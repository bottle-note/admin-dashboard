import { useSearchParams } from 'react-router';
import { MediaUpload } from '@/components/common/MediaUpload';
import { DEFAULT_IMAGE_PROCESSING_POLICY } from '@/components/common/image-processing-policy';
import { useBulkAlcoholImages } from '@/hooks/useBulkAlcoholImages';
import { BulkImageDialog } from './BulkImageDialog';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Upload,
} from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAlcoholBulkCreate,
  useAlcoholExcelTemplateDownload,
  useAlcoholExcelValidate,
} from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage, isApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type {
  AlcoholBulkValidationResult,
  AlcoholExcelValidationResult,
  AlcoholExcelValidationRow,
} from '@/types/api';

type IssueFilter = 'ALL' | 'ERROR' | 'WARNING' | 'NO_IMAGE';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getWhiskyName(row: AlcoholExcelValidationRow) {
  return [row.korName, row.engName].filter(Boolean).join(' / ') || '-';
}

function isBulkValidationResult(value: unknown): value is AlcoholBulkValidationResult {
  if (!value || typeof value !== 'object') return false;

  const result = value as Partial<AlcoholBulkValidationResult>;
  return (
    typeof result.totalRows === 'number' &&
    typeof result.validRows === 'number' &&
    typeof result.invalidRows === 'number' &&
    typeof result.warningRows === 'number' &&
    Array.isArray(result.rows)
  );
}

function mergeBulkValidationResult(
  excelResult: AlcoholExcelValidationResult,
  bulkResult: AlcoholBulkValidationResult
): AlcoholExcelValidationResult {
  const bulkRows = new Map(bulkResult.rows.map((row) => [row.clientRowId, row]));

  return {
    totalRows: bulkResult.totalRows,
    validRows: bulkResult.validRows,
    invalidRows: bulkResult.invalidRows,
    warningRows: bulkResult.warningRows,
    rows: excelResult.rows.map((row) => {
      const bulkRow = bulkRows.get(row.clientRowId);
      if (!bulkRow) return row;

      return {
        ...row,
        valid: bulkRow.valid,
        normalized: bulkRow.normalized,
        errors: bulkRow.errors,
        warnings: bulkRow.warnings,
        candidateAlcoholIds: bulkRow.candidateAlcoholIds,
      };
    }),
  };
}

export function WhiskyExcelBulkPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('issue');
  const issueFilter: IssueFilter =
    filterParam === 'ERROR' || filterParam === 'WARNING' || filterParam === 'NO_IMAGE'
      ? filterParam
      : 'ALL';
  const setIssueFilter = (value: IssueFilter) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === 'ALL') next.delete('issue');
        else next.set('issue', value);
        return next;
      },
      { replace: true }
    );
  const uploads = useBulkAlcoholImages();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isWorkInfoOpen, setIsWorkInfoOpen] = useState(false);
  const [resetAction, setResetAction] = useState<'select' | 'validate' | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<AlcoholExcelValidationResult | null>(
    null
  );
  const [createdRows, setCreatedRows] = useState<number | null>(null);
  const [isUploadConfirmOpen, setIsUploadConfirmOpen] = useState(false);
  const downloadTemplate = useAlcoholExcelTemplateDownload();
  const validateExcel = useAlcoholExcelValidate();
  const createBulk = useAlcoholBulkCreate();

  const issueRows = (validationResult?.rows ?? []).filter((row) => {
    if (issueFilter === 'ERROR') return row.errors.length > 0;
    if (issueFilter === 'WARNING') return row.warnings.length > 0;
    if (issueFilter === 'NO_IMAGE') return !uploads.images[row.clientRowId]?.url;
    return true;
  });
  const imageCount = Object.values(uploads.images).filter((image) => image.url).length;
  const hasImageErrors = Object.values(uploads.images).some((image) => image.error);
  const busy = uploads.isUploading || validateExcel.isPending || createBulk.isPending;
  const normalizedRows =
    validationResult?.rows.flatMap((row) =>
      row.normalized
        ? [{ ...row.normalized, imageUrl: uploads.images[row.clientRowId]?.url ?? null }]
        : []
    ) ?? [];
  const uploadBlockedReason =
    createdRows !== null
      ? '등록이 완료되었습니다. 같은 작업을 다시 전송할 수 없습니다.'
      : createBulk.isPending
        ? '등록 결과를 기다리고 있습니다.'
        : validateExcel.isPending
          ? '엑셀 검증을 기다리고 있습니다.'
          : uploads.isUploading
            ? '이미지 업로드가 끝난 뒤 전송할 수 있습니다.'
            : !validationResult || validationResult.totalRows === 0
              ? '등록할 엑셀 데이터를 검증해주세요.'
              : validationResult.invalidRows > 0 ||
                  normalizedRows.length !== validationResult.totalRows
                ? '엑셀 오류를 수정하고 다시 검증해주세요.'
                : hasImageErrors
                  ? '실패한 이미지를 재시도하거나 첨부를 취소하세요.'
                  : null;
  const canUpload = uploadBlockedReason === null;
  const workState = {
    fileName: file?.name ?? null,
    operation: 'CREATE',
    canSubmit: canUpload,
    blockedReason: uploadBlockedReason,
    createdRows,
    rows: (validationResult?.rows ?? []).map((row) => {
      const image = uploads.images[row.clientRowId];
      return {
        clientRowId: row.clientRowId,
        rowNumber: row.rowNumber,
        name: getWhiskyName(row),
        errors: row.errors,
        warnings: row.warnings,
        imageStatus: image?.uploading
          ? 'UPLOADING'
          : image?.error
            ? 'ERROR'
            : image?.url
              ? 'READY'
              : 'EMPTY',
        imageUrl: image?.url ?? null,
        imageError: image?.error ?? null,
      };
    }),
  };

  const selectFile = (nextFile: File | undefined, confirmed = false) => {
    if (busy) return;
    if (!nextFile) return;

    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      showToast({ type: 'error', message: '.xlsx 파일만 업로드할 수 있습니다.' });
      return;
    }

    if (!confirmed && Object.values(uploads.images).some((image) => image.url || image.file)) {
      setPendingFile(nextFile);
      setResetAction('select');
      return;
    }
    uploads.reset();
    setIsImageDialogOpen(false);
    setFile(nextFile);
    setValidationResult(null);
    setCreatedRows(null);
    setIsUploadConfirmOpen(false);
    setIssueFilter('ALL');
    createBulk.reset();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await downloadTemplate.mutateAsync();
      const url = URL.createObjectURL(new Blob([template], { type: XLSX_MIME_TYPE }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bottlenote-alcohol-import-template.xlsx';
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', message: 'Excel 양식을 다운로드했습니다.' });
    } catch (error) {
      showToast({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleValidate = async (confirmed = false) => {
    if (!file || busy) return;
    if (!confirmed && Object.values(uploads.images).some((image) => image.url || image.file)) {
      setResetAction('validate');
      return;
    }
    uploads.reset();
    setValidationResult(null);

    try {
      setCreatedRows(null);
      const result = await validateExcel.mutateAsync(file);
      uploads.reset(
        Object.fromEntries(
          result.rows
            .filter((row) => row.normalized?.imageUrl)
            .map((row) => [row.clientRowId, { url: row.normalized!.imageUrl ?? null }])
        )
      );
      setValidationResult(result);
    } catch (error) {
      showToast({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleUpload = async () => {
    if (!validationResult || !canUpload) return;

    setIsUploadConfirmOpen(false);

    try {
      const result = await createBulk.mutateAsync({ rows: normalizedRows });
      setCreatedRows(result.createdRows);
      showToast({ type: 'success', message: `위스키 ${result.createdRows}건을 등록했습니다.` });
    } catch (error) {
      if (isApiError(error) && isBulkValidationResult(error.details)) {
        setValidationResult(mergeBulkValidationResult(validationResult, error.details));
        setIssueFilter('ALL');
        showToast({
          type: 'error',
          message: '업로드 직전 재검증에서 오류가 발견되었습니다. 내용을 확인해주세요.',
        });
        return;
      }

      showToast({ type: 'error', message: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">위스키 Excel 벌크 등록</h1>
        <ol aria-label="벌크 등록 단계" className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {['양식 다운로드', '엑셀 업로드', '검증 및 이미지 추가', '최종 전송'].map(
            (label, index) => {
              const active = createdRows !== null ? 3 : validationResult ? 2 : file ? 1 : 0;
              return (
                <li
                  key={label}
                  aria-current={index === active ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2',
                    index === active ? 'font-medium text-primary' : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full',
                      index === active ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {index + 1}
                  </span>
                  {label}
                </li>
              );
            }
          )}
        </ol>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>1. 양식 다운로드</CardTitle>
            <CardDescription>
              빈 양식 또는 수입 신고 화면에서 받은 등록 초안을 사용해 정보를 작성하세요.
            </CardDescription>
          </div>
          <Button onClick={handleDownloadTemplate} disabled={downloadTemplate.isPending}>
            <Download />
            {downloadTemplate.isPending ? '다운로드 준비 중...' : '양식 다운로드'}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. 엑셀 업로드</CardTitle>
          <CardDescription>
            작성한 .xlsx 파일을 올리면 저장 없이 행별 오류와 경고를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileInputRef}
            type="file"
            aria-label="검증할 Excel 파일 선택"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            disabled={busy}
            onChange={handleFileChange}
          />
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4',
              validationResult
                ? 'flex-wrap py-3'
                : 'min-h-40 flex-col justify-center border-dashed py-8 text-center'
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            {file ? (
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-all font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                  {validationResult ? ' · 검증 완료' : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">.xlsx 파일을 드래그하거나 선택하세요</p>
                <p className="text-sm text-muted-foreground">
                  기존 양식의 시트와 헤더를 유지해야 합니다.
                </p>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen />
              {file ? '다른 파일 선택' : '파일 선택'}
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => void handleValidate()} disabled={!file || busy}>
              <FileSpreadsheet />
              {validateExcel.isPending ? '검증 중...' : '검증하기'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <>
          <Card>
            <CardHeader className="gap-3">
              <CardTitle>3. 검증 및 이미지 추가</CardTitle>
              <CardDescription>
                검증 결과를 확인하고 이미지를 첨부하세요. 아직 등록되지는 않았습니다.
              </CardDescription>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>전체 {validationResult.totalRows}건</span>
                <span className="text-destructive">오류 {validationResult.invalidRows}건</span>
                <span className="text-amber-700">경고 {validationResult.warningRows}건</span>
                <span>이미지 {imageCount}건</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdRows !== null && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  위스키 {createdRows}건을 등록했습니다.
                </div>
              )}
              {validationResult.totalRows === 0 ? (
                <p className="rounded-lg bg-muted p-4 text-sm">
                  입력된 데이터 행이 없습니다. 양식의 3행부터 내용을 작성해 다시 검증하세요.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ['ALL', `전체 (${validationResult.totalRows})`],
                          ['ERROR', `오류 (${validationResult.invalidRows})`],
                          ['WARNING', `경고 (${validationResult.warningRows})`],
                          [
                            'NO_IMAGE',
                            `이미지 미첨부 (${validationResult.totalRows - imageCount})`,
                          ],
                        ] as const
                      ).map(([value, label]) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={issueFilter === value ? 'default' : 'outline'}
                          onClick={() => setIssueFilter(value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      disabled={busy || createdRows !== null}
                      onClick={() => setIsImageDialogOpen(true)}
                    >
                      <Upload />
                      여러 이미지 추가
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-lg border [&>div]:max-h-[36rem]">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
                          <TableHead className="w-16 whitespace-nowrap">행</TableHead>
                          <TableHead className="min-w-52">위스키명</TableHead>
                          <TableHead className="min-w-52">상태 / 확인 사항</TableHead>
                          <TableHead className="min-w-56">이미지</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issueRows.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-muted-foreground"
                            >
                              선택한 상태에 해당하는 행이 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                        {issueRows.map((row) => {
                          const image = uploads.images[row.clientRowId];
                          return (
                            <TableRow
                              key={row.clientRowId}
                              data-client-row-id={row.clientRowId}
                              data-row-number={row.rowNumber}
                              aria-busy={Boolean(image?.uploading)}
                            >
                              <TableCell className="font-mono">{row.rowNumber}</TableCell>
                              <TableCell className="max-w-72 break-words">
                                {getWhiskyName(row)}
                              </TableCell>
                              <TableCell className="max-w-96 space-y-2">
                                <span
                                  className={cn(
                                    'inline-flex rounded px-2 py-1 text-xs font-medium',
                                    row.errors.length
                                      ? 'bg-destructive/10 text-destructive'
                                      : row.warnings.length
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-50 text-emerald-800'
                                  )}
                                >
                                  {row.errors.length
                                    ? '오류'
                                    : row.warnings.length
                                      ? '경고'
                                      : '정상'}
                                </span>
                                {[...row.errors, ...row.warnings].map((issue, index) => (
                                  <p key={`${issue.code}-${index}`} className="break-words text-sm">
                                    {issue.field && (
                                      <span className="mr-1 text-muted-foreground">
                                        {issue.field} ·
                                      </span>
                                    )}
                                    {issue.message}
                                  </p>
                                ))}
                              </TableCell>
                              <TableCell>
                                <MediaUpload
                                  loadImageFile={() => uploads.getImageFile(row.clientRowId)}
                                  variant="compact"
                                  label={`${row.rowNumber}행 ${row.korName || row.engName || '위스키'} 이미지`}
                                  mediaUrl={image?.url ?? null}
                                  disabled={busy || createdRows !== null || !row.normalized}
                                  imageProcessingPolicy={DEFAULT_IMAGE_PROCESSING_POLICY}
                                  onFileRejected={() =>
                                    showToast({
                                      type: 'error',
                                      message: 'JPG, PNG, WEBP 이미지만 사용할 수 있습니다.',
                                    })
                                  }
                                  onMediaChange={(file) => {
                                    if (file)
                                      void uploads.upload([
                                        { clientRowId: row.clientRowId, file, prepared: true },
                                      ]);
                                    else uploads.remove(row.clientRowId);
                                  }}
                                />
                                {image?.url && !image.uploading && !image.error && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    이미지 첨부 완료
                                  </p>
                                )}
                                {image?.uploading && (
                                  <p role="status" className="mt-2 text-xs text-muted-foreground">
                                    이미지 업로드 중...
                                  </p>
                                )}
                                {image?.error && (
                                  <div className="mt-2 max-w-64 space-y-1">
                                    <p
                                      role="alert"
                                      className="break-words text-xs text-destructive"
                                    >
                                      {image.error}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={busy}
                                        aria-label={`${row.rowNumber}행 이미지 업로드 재시도`}
                                        onClick={() => {
                                          if (image.file)
                                            void uploads.upload([
                                              {
                                                clientRowId: row.clientRowId,
                                                file: image.file,
                                                prepared: image.prepared,
                                              },
                                            ]);
                                        }}
                                      >
                                        재시도
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        aria-label={`${row.rowNumber}행 이미지 첨부 취소`}
                                        onClick={() => uploads.dismissError(row.clientRowId)}
                                      >
                                        첨부 취소
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {!row.normalized && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    엑셀 오류를 수정한 뒤 첨부하세요.
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    이미지는 선택 항목입니다. 첨부하지 않은 행도 등록할 수 있습니다.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle>4. 최종 전송</CardTitle>
                <CardDescription>
                  등록 {validationResult.totalRows}건 · 이미지 첨부 {imageCount}건 · 경고{' '}
                  {validationResult.warningRows}건
                </CardDescription>
                <p id="bulk-submit-status" role="status" className="text-sm text-muted-foreground">
                  {uploadBlockedReason ?? '전송할 준비가 되었습니다.'}
                </p>
              </div>
              <Button
                onClick={() => setIsUploadConfirmOpen(true)}
                disabled={!canUpload}
                aria-describedby="bulk-submit-status"
              >
                <Upload />
                {createBulk.isPending ? '전송 중...' : '최종 전송'}
              </Button>
            </CardHeader>
          </Card>
          <details
            className="rounded-lg border p-4"
            onToggle={(event) => setIsWorkInfoOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer text-sm font-medium">작업 정보</summary>
            {isWorkInfoOpen && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  현재 검증 결과와 이미지 연결 상태입니다. 필터에 가려진 행도 포함합니다.
                </p>
                <textarea
                  aria-label="현재 벌크 등록 작업 정보 JSON"
                  readOnly
                  value={JSON.stringify(workState, null, 2)}
                  className="h-48 w-full rounded-md border bg-muted p-3 font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(workState, null, 2));
                      showToast({ type: 'success', message: '작업 정보를 복사했습니다.' });
                    } catch {
                      showToast({
                        type: 'error',
                        message: '복사하지 못했습니다. 작업 정보에서 직접 복사해주세요.',
                      });
                    }
                  }}
                >
                  작업 정보 복사
                </Button>
                <a
                  href="/agent-guides/whisky-excel-bulk.md"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-3 text-sm underline"
                >
                  작업 가이드
                </a>
              </div>
            )}
          </details>
          {isImageDialogOpen && (
            <BulkImageDialog
              rows={validationResult.rows}
              uploads={uploads}
              onClose={() => setIsImageDialogOpen(false)}
            />
          )}
        </>
      )}
      <AlertDialog
        open={resetAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetAction(null);
            setPendingFile(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미지 연결을 초기화할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              엑셀을 변경하거나 다시 검증하면 현재 첨부한 이미지 연결이 초기화됩니다. 새 검증
              결과에서 이미지를 다시 첨부해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resetAction === 'select' && pendingFile) selectFile(pendingFile, true);
                if (resetAction === 'validate') void handleValidate(true);
                setResetAction(null);
                setPendingFile(null);
              }}
            >
              초기화하고 계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUploadConfirmOpen} onOpenChange={setIsUploadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              위스키 {validationResult?.totalRows ?? 0}건을 등록할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              이미지 {imageCount}건이 첨부됩니다.{' '}
              {validationResult?.warningRows
                ? `경고가 있는 행이 ${validationResult.warningRows}건 포함되어 있습니다. `
                : ''}
              업로드를 반복하면 같은 위스키가 중복 등록될 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createBulk.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={createBulk.isPending}>
              {createBulk.isPending ? '전송 중...' : '등록'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
