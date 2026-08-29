import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useMfdsImporterCreate,
  useMfdsImporterDetail,
  useMfdsImporterUpdate,
} from '@/hooks/useMfdsImporters';
import type { MfdsImporterCreateRequest, MfdsImporterUpdateRequest } from '@/types/api';
import {
  mfdsImporterDefaultValues,
  mfdsImporterFormSchema,
  type MfdsImporterFormValues,
} from './mfds-importer.schema';

function displayValue(value: string | null | undefined) {
  return value || '-';
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('ko-KR') : '-';
}

export function MfdsImporterDetailPage() {
  const { importerId: importerIdParam } = useParams<{ importerId: string }>();
  const navigate = useNavigate();
  const isNewMode = !importerIdParam || importerIdParam === 'new';
  const parsedImporterId = Number(importerIdParam);
  const importerId =
    !isNewMode && Number.isInteger(parsedImporterId) && parsedImporterId > 0
      ? parsedImporterId
      : undefined;
  const detailQuery = useMfdsImporterDetail(importerId);
  const createMutation = useMfdsImporterCreate();
  const updateMutation = useMfdsImporterUpdate();
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const form = useForm<MfdsImporterFormValues>({
    resolver: zodResolver(mfdsImporterFormSchema),
    defaultValues: mfdsImporterDefaultValues,
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    form.reset({
      officialBusinessCode: detailQuery.data.officialBusinessCode,
      licenseNo: detailQuery.data.licenseNo,
      businessName: detailQuery.data.businessName,
      representativeName: detailQuery.data.representativeName ?? '',
      sourceListUrl: '',
      description: detailQuery.data.description ?? '',
      adminNote: detailQuery.data.adminNote ?? '',
      adminStatus: detailQuery.data.adminStatus,
    });
  }, [detailQuery.data, form]);

  const handleSubmit = (data: MfdsImporterFormValues) => {
    if (isNewMode) {
      const requiredFields = ['officialBusinessCode', 'licenseNo', 'sourceListUrl'] as const;
      const missingField = requiredFields.find((field) => !data[field].trim());

      if (missingField) {
        const labels: Record<(typeof requiredFields)[number], string> = {
          officialBusinessCode: '공식 업소 코드는 필수입니다.',
          licenseNo: '인허가 번호는 필수입니다.',
          sourceListUrl: '공식 출처 URL은 필수입니다.',
        };
        form.setError(missingField, { message: labels[missingField] });
        return;
      }

      try {
        new URL(data.sourceListUrl);
      } catch {
        form.setError('sourceListUrl', { message: '올바른 URL을 입력해주세요.' });
        return;
      }

      const request: MfdsImporterCreateRequest = {
        officialBusinessCode: data.officialBusinessCode.trim(),
        licenseNo: data.licenseNo.trim(),
        businessName: data.businessName.trim(),
        representativeName: data.representativeName.trim() || undefined,
        sourceListUrl: data.sourceListUrl.trim(),
        description: data.description.trim() || undefined,
        adminNote: data.adminNote.trim() || undefined,
        adminStatus: data.adminStatus,
      };

      createMutation.mutate(request, {
        onSuccess: (result) => navigate(`/mfds/importers/${result.targetId}`),
      });
      return;
    }

    if (!importerId) return;

    const request: MfdsImporterUpdateRequest = {
      businessName: data.businessName.trim(),
      description: data.description.trim() || undefined,
      adminNote: data.adminNote.trim() || undefined,
      adminStatus: data.adminStatus,
    };
    updateMutation.mutate({ importerId, data: request });
  };

  const handleSaveClick = async () => {
    if (!(await form.trigger())) return;

    if (isNewMode) {
      const data = form.getValues();
      const requiredFields = ['officialBusinessCode', 'licenseNo', 'sourceListUrl'] as const;
      const missingField = requiredFields.find((field) => !data[field].trim());

      if (missingField) {
        const labels: Record<(typeof requiredFields)[number], string> = {
          officialBusinessCode: '공식 업소 코드는 필수입니다.',
          licenseNo: '인허가 번호는 필수입니다.',
          sourceListUrl: '공식 출처 URL은 필수입니다.',
        };
        form.setError(missingField, { message: labels[missingField] });
        return;
      }

      try {
        new URL(data.sourceListUrl);
      } catch {
        form.setError('sourceListUrl', { message: '올바른 URL을 입력해주세요.' });
        return;
      }
    }

    setIsSaveConfirmOpen(true);
  };

  if (!isNewMode && !importerId) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="수입사 상세" onBack={() => navigate('/mfds/importers')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">올바르지 않은 수입사 ID입니다.</p>
            <Button variant="outline" onClick={() => navigate('/mfds/importers')}>
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNewMode && detailQuery.isLoading) {
    return <div className="py-16 text-center text-muted-foreground">수입사 정보를 불러오는 중입니다.</div>;
  }

  if (!isNewMode && (detailQuery.isError || !detailQuery.data)) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="수입사 상세" onBack={() => navigate('/mfds/importers')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">수입사 정보를 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => detailQuery.refetch()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const detail = detailQuery.data;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isNewMode ? '수입사 등록' : '수입사 상세'}
        subtitle={isNewMode ? undefined : `ID: ${importerId}`}
        onBack={() => navigate('/mfds/importers')}
        actions={
          <Button onClick={handleSaveClick} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? '저장 중...' : isNewMode ? '등록' : '저장'}
          </Button>
        }
      />

      {isNewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>식약처 공식 정보</CardTitle>
            <CardDescription>공식 목록에서 확인한 정보와 등록 근거를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="공식 업소 코드"
              required
              error={form.formState.errors.officialBusinessCode?.message}
            >
              <Input {...form.register('officialBusinessCode')} />
            </FormField>
            <FormField
              label="인허가 번호"
              required
              error={form.formState.errors.licenseNo?.message}
            >
              <Input {...form.register('licenseNo')} />
            </FormField>
            <FormField label="대표자">
              <Input {...form.register('representativeName')} placeholder="예: 홍길동" />
            </FormField>
            <FormField
              label="공식 출처 URL"
              required
              error={form.formState.errors.sourceListUrl?.message}
              className="sm:col-span-2"
            >
              <Input
                type="url"
                {...form.register('sourceListUrl')}
                placeholder="https://..."
              />
            </FormField>
          </CardContent>
        </Card>
      ) : detail ? (
        <Card>
          <CardHeader>
            <CardTitle>식약처 공식 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="공식 업소 코드">
              <Input value={detail.officialBusinessCode} disabled />
            </FormField>
            <FormField label="인허가 번호">
              <Input value={detail.licenseNo} disabled />
            </FormField>
            <FormField label="대표자">
              <Input value={displayValue(detail.representativeName)} disabled />
            </FormField>
            <FormField label="허가일">
              <Input value={displayValue(detail.permitDate)} disabled />
            </FormField>
            <FormField label="관할 기관">
              <Input value={displayValue(detail.institutionName)} disabled />
            </FormField>
            <FormField label="전화번호">
              <Input value={displayValue(detail.telephoneNo)} disabled />
            </FormField>
            <FormField label="소재지" className="sm:col-span-2">
              <Input value={displayValue(detail.primaryAddress)} disabled />
            </FormField>
            <FormField label="업종">
              <Input value={displayValue(detail.industryName)} disabled />
            </FormField>
            <FormField label="영업 상태">
              <Input value={displayValue(detail.operatingStatus)} disabled />
            </FormField>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>내부 운영 정보</CardTitle>
          <CardDescription>
            {isNewMode
              ? '보틀노트 운영에 사용할 업체명과 관리 상태를 입력합니다.'
              : '보틀노트 운영용 설정과 메모를 관리합니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="운영용 업체명"
              required
              error={form.formState.errors.businessName?.message}
            >
              <Input {...form.register('businessName')} />
            </FormField>
            <FormField label="관리 상태">
              <Controller
                control={form.control}
                name="adminStatus"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">활성</SelectItem>
                      <SelectItem value="INACTIVE">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
          <FormField label="공개 설명">
            <Textarea
              {...form.register('description')}
              placeholder="운영자가 참고할 수 있는 공개 설명을 입력합니다."
            />
          </FormField>
          <FormField label="관리자 메모">
            <Textarea
              {...form.register('adminNote')}
              placeholder="내부 운영 메모를 입력합니다."
            />
          </FormField>
        </CardContent>
      </Card>

      {!isNewMode && detail && (
        <Card>
          <CardHeader>
            <CardTitle>처리 기록</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="검토자">
              <Input value={displayValue(detail.reviewedBy)} disabled />
            </FormField>
            <FormField label="검토 시각">
              <Input value={formatDateTime(detail.reviewedAt)} disabled />
            </FormField>
            <FormField label="등록 시각">
              <Input value={formatDateTime(detail.createdAt)} disabled />
            </FormField>
            <FormField label="수정 시각">
              <Input value={formatDateTime(detail.updatedAt)} disabled />
            </FormField>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNewMode
                ? '등록 후 식약처 공식 정보는 수정할 수 없습니다'
                : '식약처 공식 정보는 변경되지 않습니다'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNewMode
                ? '공식 업소 코드, 인허가 번호, 대표자 등 입력한 식약처 공식 정보를 확인해주세요. 등록 후에는 이 화면에서 수정할 수 없습니다.'
                : '공식 업소 코드, 인허가 번호, 대표자 등은 수입 신고 연결의 기준값입니다. 이번 저장에는 내부 운영 정보만 반영됩니다.'}
            </AlertDialogDescription>
            {isNewMode && <p className="text-sm font-medium text-destructive">등록하시겠습니까?</p>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isPending}
            >
              {isPending ? '저장 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
