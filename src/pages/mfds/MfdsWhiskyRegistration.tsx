import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { WhiskyImageCard } from '@/pages/whisky/components/WhiskyImageCard';
import { WhiskyBasicInfoCard } from '@/pages/whisky/components/WhiskyBasicInfoCard';
import { whiskyFormSchema, type WhiskyFormValues } from '@/pages/whisky/whisky.schema';
import { useAdminAlcoholCreate, useCategoryReferences } from '@/hooks/useAdminAlcohols';
import { useMfdsMatchingActions } from '@/hooks/useMfdsDeclarations';
import { useFileUpload, S3UploadPath } from '@/hooks/useFileUpload';
import { getErrorMessage } from '@/lib/api-error';
import { useRegionList } from '@/hooks/useRegions';
import { useDistilleryList } from '@/hooks/useDistilleries';
import { EMPTY_CATEGORY_REFERENCE_MAP, type MfdsDeclarationDetail } from '@/types/api';

type RegistrationSource = Pick<
  MfdsDeclarationDetail,
  | 'id'
  | 'rcno'
  | 'skuDisplayNameKo'
  | 'skuDisplayNameEn'
  | 'baseProductNameKo'
  | 'baseProductNameEn'
  | 'abvPercent'
  | 'ageYears'
  | 'unitVolumeMl'
  | 'selectedRegionId'
  | 'selectedDistilleryId'
>;

/** Register first, then match; retain the new ID so a failed match can be retried safely. */
export function MfdsWhiskyRegistration({
  source,
  onComplete,
}: {
  source: RegistrationSource;
  onComplete: () => void;
}) {
  const categories = useCategoryReferences();
  const storageKey = `mfds-registration:${source.id}`;
  const [createdId, setCreatedId] = useState<number | null>(() => {
    const stored = Number(sessionStorage.getItem(storageKey));
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  });
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const imageFile = useRef<File | null>(null);
  const uploadedUrl = useRef<string | null>(null);
  const upload = useFileUpload({ rootPath: S3UploadPath.ALCOHOL });
  const create = useAdminAlcoholCreate({ showErrorToast: false });
  const { confirmMatching } = useMfdsMatchingActions(source.id);
  const regions = useRegionList({ size: 100 });
  const distilleries = useDistilleryList({ size: 9999 });
  const form = useForm<WhiskyFormValues>({
    resolver: zodResolver(whiskyFormSchema),
    defaultValues: {
      korName: source.skuDisplayNameKo?.trim() || source.baseProductNameKo?.trim() || '',
      engName: source.skuDisplayNameEn?.trim() || source.baseProductNameEn?.trim() || '',
      korCategory: '',
      engCategory: '',
      regionId: source.selectedRegionId ?? 0,
      distilleryId: source.selectedDistilleryId ?? 0,
      abv: source.abvPercent == null ? '' : String(source.abvPercent),
      age: source.ageYears == null ? '' : String(source.ageYears),
      volume: source.unitVolumeMl == null ? '' : `${source.unitVolumeMl}ml`,
      cask: '',
      description: '',
      imageUrl: '',
    },
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const failed = categories.isError || regions.isError || distilleries.isError;
  const loading = categories.isLoading || regions.isLoading || distilleries.isLoading;
  async function registerAndMatch() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setSaveError(null);
    setIssues([]);
    try {
      let alcoholId = createdId;
      if (!alcoholId) {
        const validation = whiskyFormSchema.safeParse(form.getValues());
        if (!validation.success || !imageFile.current) {
          setIssues(
            validation.success
              ? ['이미지는 필수입니다']
              : validation.error.issues.map((issue) => issue.message)
          );
          setSaveError('필수 입력값과 이미지를 확인하세요.');
          return;
        }
        const values = validation.data;
        const imageUrl = uploadedUrl.current ?? (await upload.upload(imageFile.current));
        if (!imageUrl) {
          setSaveError('이미지 업로드에 실패했습니다. 다시 시도하세요.');
          return;
        }
        uploadedUrl.current = imageUrl;
        const result = await create.mutateAsync({
          korName: values.korName.trim(),
          engName: values.engName.trim(),
          type: 'WHISKY',
          korCategory: values.korCategory,
          engCategory: values.engCategory,
          categoryGroup: values.categoryGroup,
          regionId: values.regionId,
          distilleryId:
            values.distilleryId ||
            distilleries.data?.items.find((item) => item.korName === '-')?.id ||
            0,
          abv: `${values.abv}%`,
          age: values.age.trim() || '-',
          volume: values.volume,
          cask: values.cask.trim() || '-',
          description: values.description.trim() || '-',
          imageUrl,
          tastingTagIds: [],
        });
        alcoholId = result.targetId;
        setCreatedId(alcoholId);
        sessionStorage.setItem(storageKey, String(alcoholId));
      }
      await confirmMatching.mutateAsync({ alcoholId });
      sessionStorage.removeItem(storageKey);
      onComplete();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">위스키 등록</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          신고 {source.id}의 이름과 확인된 규격을 채웠습니다. 등록하면 이 신고에 연결하고
          증류소·지역을 함께 반영합니다.
        </p>
      </div>
      {failed ? (
        <div className="space-y-2">
          <p>등록에 필요한 선택 목록을 불러오지 못했습니다.</p>
          <Button
            variant="outline"
            onClick={() => {
              void categories.refetch();
              void regions.refetch();
              void distilleries.refetch();
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : loading ? (
        <p>등록 정보를 불러오는 중입니다.</p>
      ) : (
        <fieldset
          disabled={busy || createdId !== null}
          className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]"
        >
          <div className="min-w-0">
            <WhiskyBasicInfoCard
              form={form}
              disabled={busy || createdId !== null}
              fieldHints={{
                categoryGroup: !form.watch('categoryGroup')
                  ? '신고의 주종만으로 세부 분류를 정할 수 없어 직접 선택해야 합니다.'
                  : undefined,
                regionId:
                  !source.selectedRegionId && !form.watch('regionId')
                    ? '신고에 확정된 지역이 없어 직접 선택해야 합니다.'
                    : undefined,
                distilleryId:
                  !source.selectedDistilleryId && !form.watch('distilleryId')
                    ? '신고에 확정된 증류소가 없습니다. 확인 가능한 경우 선택하세요.'
                    : undefined,
                abv:
                  source.abvPercent == null && !form.watch('abv')
                    ? '신고 데이터에 도수가 없어 직접 입력해야 합니다.'
                    : undefined,
                volume:
                  source.unitVolumeMl == null && !form.watch('volume')
                    ? '신고 데이터에 단위 용량이 없어 직접 입력해야 합니다.'
                    : undefined,
              }}
              groupedCategories={categories.data ?? EMPTY_CATEGORY_REFERENCE_MAP}
              regions={regions.data?.items ?? []}
              distilleries={distilleries.data?.items ?? []}
            />
          </div>
          <div className="min-w-0 space-y-3">
            <WhiskyImageCard
              disabled={busy || createdId !== null}
              imageUrl={imagePreview}
              onImageChange={(file, url) => {
                imageFile.current = file;
                uploadedUrl.current = null;
                setImagePreview(url);
                form.setValue('imageUrl', url ?? '');
              }}
            />
            <p className="text-xs text-muted-foreground">
              등록할 때 이미지를 업로드합니다. 도수·단위 용량·카테고리가 없으면 직접 입력하세요.
            </p>
          </div>
        </fieldset>
      )}
      {createdId && (
        <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          위스키 ID {createdId}는 등록되었습니다. 다시 등록하지 않고 연결만 재시도합니다.{' '}
          <a href={`/whisky/${createdId}`} target="_blank" rel="noreferrer" className="underline">
            등록된 위스키 확인
          </a>
        </p>
      )}
      {issues.length > 0 && (
        <ul className="list-inside list-disc text-sm text-destructive">
          {issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
      )}
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}
      <div className="flex justify-end border-t pt-4">
        <Button disabled={busy || loading || failed} onClick={registerAndMatch}>
          {busy
            ? upload.isUploading
              ? '이미지 업로드 중...'
              : createdId
                ? '연결 중...'
                : '등록 중...'
            : createdId
              ? '연결 재시도'
              : '등록하고 연결'}
        </Button>
      </div>
    </div>
  );
}
