/**
 * 속성 상세 페이지
 * - /attributes/new: 등록 (?groupId= 로 그룹을 미리 고른다)
 * - /attributes/:id: 상세·수정·삭제
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2, X } from 'lucide-react';

import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAlcoholAttributeBatchDelete,
  useAlcoholAttributeCreate,
  useAlcoholAttributeUpdate,
  useAttributeDefinitions,
  useAttributedAlcohols,
  useAttributeEnums,
  useAttributeGroups,
} from '@/hooks/useAlcoholAttributes';
import { useToast } from '@/hooks/useToast';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import { CharacterRuleBuilder } from './variants/a/CharacterRuleBuilder';
import {
  attributeDefaultValues,
  attributeFormSchema,
  toAttributeCreateRequest,
  toAttributeFormValues,
  toAttributeUpdateRequest,
  type AttributeFormValues,
} from './attribute.schema';

const NO_GROUP = 'none';
const DATATYPE_LABELS = {
  STRING: '텍스트',
  INT: '정수',
  DOUBLE: '소수',
  BOOLEAN: '예/아니오',
} as const;

export function AttributeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNew = !id || id === 'new';
  const attributeId = isNew ? undefined : Number(id);

  const definitions = useAttributeDefinitions();
  const groups = useAttributeGroups();
  const enums = useAttributeEnums();
  const attribute = definitions.data?.find((item) => item.id === attributeId);
  const linked = useAttributedAlcohols(
    { key: attribute?.key, page: 0, size: 1 },
    Boolean(attribute)
  );

  const create = useAlcoholAttributeCreate();
  const update = useAlcoholAttributeUpdate();
  const remove = useAlcoholAttributeBatchDelete();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: attributeDefaultValues(searchParams.get('groupId')),
  });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: 'type' });
  const typeDescription = enums.data?.types.find((item) => item.code === type)?.description;
  const datatype = useWatch({ control: form.control, name: 'datatype' });
  const allowedValues = useWatch({ control: form.control, name: 'allowedValues' });
  const pattern = useWatch({ control: form.control, name: 'pattern' });

  useEffect(() => {
    if (attribute) form.reset(toAttributeFormValues(attribute));
  }, [attribute, form]);

  const onSubmit = async (values: AttributeFormValues) => {
    if (isNew) {
      const created = await create.mutateAsync(toAttributeCreateRequest(values));
      showToast({ type: 'success', message: '속성을 등록했습니다.' });
      navigate(`/attributes/${created.id}`);
    } else if (attributeId) {
      await update.mutateAsync({ id: attributeId, data: toAttributeUpdateRequest(values) });
      showToast({ type: 'success', message: '변경을 저장했습니다.' });
    }
  };

  const onDelete = async () => {
    if (!attributeId) return;
    await remove.mutateAsync([attributeId]);
    showToast({ type: 'success', message: '속성을 삭제했습니다.' });
    navigate('/attributes');
  };

  const isSaving = create.isPending || update.isPending;

  if (!isNew && definitions.isPending)
    return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>;
  if (!isNew && !attribute)
    return <div className="py-8 text-center text-muted-foreground">속성을 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isNew ? '속성 등록' : attribute!.displayName}
        onBack={() => navigate('/attributes')}
        actions={
          <>
            {!isNew && (
              <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button
              onClick={form.handleSubmit((values) => onSubmit(values).catch(() => undefined))}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? '저장 중...' : isNew ? '등록' : '저장'}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="flex-[3]">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="이름"
                required
                htmlFor="displayName"
                error={errors.displayName?.message}
              >
                <Input
                  id="displayName"
                  {...form.register('displayName')}
                  placeholder="예: 추천 종류"
                />
              </FormField>
              <FormField label="그룹" htmlFor="groupId">
                <Controller
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <Select
                      value={field.value || NO_GROUP}
                      onValueChange={(value) => field.onChange(value === NO_GROUP ? '' : value)}
                    >
                      <SelectTrigger id="groupId" aria-label="그룹">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GROUP}>미분류</SelectItem>
                        {groups.data?.map((group) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            {isNew ? (
              <FormField label="키" required htmlFor="key" error={errors.key?.message}>
                <Input
                  id="key"
                  {...form.register('key')}
                  placeholder="예: bn_kind"
                  className="font-mono"
                />
              </FormField>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">키</span>
                  <span className="text-xs text-muted-foreground">등록 후에는 바꿀 수 없어요</span>
                </div>
                <p className="font-mono text-sm">{attribute!.key}</p>
              </div>
            )}
            <FormField label="분류" required htmlFor="type" className="sm:max-w-[50%]">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" aria-label="분류">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {enums.data?.types.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.korName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {typeDescription && (
                <p className="text-xs text-muted-foreground">{typeDescription}</p>
              )}
            </FormField>
            <FormField label="설명" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" rows={3} {...form.register('description')} />
            </FormField>
          </CardContent>
        </Card>

        {!isNew && (
          <Card className="flex-[2]">
            <CardHeader>
              <CardTitle>사용 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground">연결된 위스키</span>
                <span className="text-xl font-bold tabular-nums">
                  {linked.data?.meta.totalElements ?? '-'}
                </span>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link
                  to={`/alcohol-attributes?tab=mappings&attributeKey=${encodeURIComponent(attribute!.key)}`}
                >
                  값 연결에서 보기
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>값 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="값 형식" required htmlFor="datatype">
              <Controller
                control={form.control}
                name="datatype"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="datatype" aria-label="값 형식">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATATYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="단위" htmlFor="unit" error={errors.unit?.message}>
              <Input id="unit" {...form.register('unit')} placeholder="예: 원, 점" />
            </FormField>
          </div>

          {datatype === 'STRING' && (
            <ValueListInput
              values={allowedValues}
              error={errors.allowedValues?.message}
              onChange={(values) =>
                form.setValue('allowedValues', values, { shouldDirty: true, shouldValidate: true })
              }
            />
          )}

          {datatype === 'STRING' && allowedValues.length === 0 && (
            <CharacterRuleBuilder
              key={attribute?.id ?? 'new'}
              pattern={pattern}
              onChange={(pattern) => form.setValue('pattern', pattern, { shouldDirty: true })}
              onError={(message) => form.setValue('patternError', message)}
            />
          )}

          <div className="space-y-3">
            <span className="text-sm font-medium">복수 선택</span>
            <Controller
              control={form.control}
              name="allowMultipleValues"
              render={({ field }) => (
                <RadioGroup
                  aria-label="복수 선택"
                  value={field.value ? 'multiple' : 'single'}
                  onValueChange={(value) => field.onChange(value === 'multiple')}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="multi-single" value="single" />
                    <Label htmlFor="multi-single">하나만</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="multi-multiple" value="multiple" />
                    <Label htmlFor="multi-multiple">여러 개</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => void onDelete().catch(() => undefined)}
        title="속성 삭제"
        description="이 속성과 위스키에 연결된 값이 모두 삭제됩니다. 되돌릴 수 없습니다."
        isPending={remove.isPending}
      />
    </div>
  );
}

function ValueListInput({
  values,
  error,
  onChange,
}: {
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (value.length > 255) return setMessage('값은 255자 이내로 입력하세요.');
    if (values.includes(value)) return setMessage('이미 있는 값이에요.');
    onChange([...values, value]);
    setDraft('');
    setMessage('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium">값 목록</span>
        <span className="text-xs text-muted-foreground">정해 두면 이 값만 쓸 수 있어요</span>
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border px-2 py-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-muted px-2 text-sm"
          >
            {value}
            <button
              type="button"
              aria-label={`${value} 삭제`}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          aria-label="값 추가"
          value={draft}
          placeholder="값 입력 후 Enter"
          className="h-7 min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (isNonComposingEnterKey(event)) {
              event.preventDefault();
              add();
            }
          }}
        />
      </div>
      {(message || error) && <p className="text-sm text-destructive">{message || error}</p>}
    </div>
  );
}
