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

type IssueFilter = 'ALL' | 'ERROR' | 'WARNING';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getWhiskyName(row: AlcoholExcelValidationRow) {
  return [row.korName, row.engName].filter(Boolean).join(' / ') || '-';
}

function hasIssues(row: AlcoholExcelValidationRow) {
  return row.errors.length > 0 || row.warnings.length > 0;
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
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('ALL');
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
    return hasIssues(row);
  });
  const issueRowCount = validationResult?.rows.filter(hasIssues).length ?? 0;
  const normalizedRows =
    validationResult?.rows.flatMap((row) => (row.normalized ? [row.normalized] : [])) ?? [];
  const canUpload =
    validationResult !== null &&
    validationResult.totalRows > 0 &&
    validationResult.invalidRows === 0 &&
    normalizedRows.length === validationResult.totalRows &&
    createdRows === null;

  const selectFile = (nextFile: File | undefined) => {
    if (!nextFile) return;

    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      showToast({ type: 'error', message: '.xlsx 파일만 업로드할 수 있습니다.' });
      return;
    }

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

  const handleValidate = async () => {
    if (!file) return;

    try {
      setCreatedRows(null);
      setValidationResult(await validateExcel.mutateAsync(file));
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
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
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
          <CardTitle>2. 파일 업로드 및 검증</CardTitle>
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
            onChange={handleFileChange}
          />
          <div
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            {file ? (
              <div className="space-y-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">.xlsx 파일을 드래그하거나 선택하세요</p>
                <p className="text-sm text-muted-foreground">
                  기존 양식의 시트와 헤더를 유지해야 합니다.
                </p>
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FolderOpen />
              {file ? '다른 파일 선택' : '파일 선택'}
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={handleValidate}
              disabled={!file || validateExcel.isPending || createBulk.isPending}
            >
              <FileSpreadsheet />
              {validateExcel.isPending ? '검증 중...' : '검증하기'}
            </Button>
            <Button
              onClick={() => setIsUploadConfirmOpen(true)}
              disabled={!canUpload || validateExcel.isPending || createBulk.isPending}
            >
              <Upload />
              {createBulk.isPending ? '업로드 중...' : '업로드하기'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>검증 결과</CardTitle>
            <CardDescription>
              오류와 경고를 확인한 뒤, 오류가 없으면 위스키를 업로드할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['전체 행', validationResult.totalRows, 'text-foreground'],
                ['오류 없는 행', validationResult.validRows, 'text-emerald-700'],
                ['오류 행', validationResult.invalidRows, 'text-destructive'],
                ['경고 포함 행', validationResult.warningRows, 'text-amber-700'],
              ].map(([label, value, className]) => (
                <div key={label} className="rounded-lg border px-4 py-3">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={cn('mt-1 text-2xl font-semibold', className)}>{value}</p>
                </div>
              ))}
            </div>

            {createdRows !== null && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                위스키 {createdRows}건을 등록했습니다.
              </div>
            )}

            {validationResult.totalRows === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                입력된 데이터 행이 없습니다. 양식의 3행부터 내용을 작성해 다시 검증하세요.
              </div>
            ) : issueRowCount > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['ALL', `전체 (${issueRowCount})`],
                      ['ERROR', `오류 (${validationResult.invalidRows})`],
                      ['WARNING', `경고 (${validationResult.warningRows})`],
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
                {issueRows.length ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 whitespace-nowrap">행</TableHead>
                          <TableHead className="min-w-52">위스키 이름</TableHead>
                          <TableHead className="w-24 whitespace-nowrap">상태</TableHead>
                          <TableHead>확인 사항</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issueRows.map((row) => {
                          const issues = [
                            ...row.errors.map((issue) => ({ issue, type: '오류' })),
                            ...row.warnings.map((issue) => ({ issue, type: '경고' })),
                          ];

                          return (
                            <TableRow key={row.rowNumber}>
                              <TableCell className="font-mono">{row.rowNumber}</TableCell>
                              <TableCell>{getWhiskyName(row)}</TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    'whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium',
                                    row.errors.length > 0
                                      ? 'bg-destructive/10 text-destructive'
                                      : 'bg-amber-100 text-amber-800'
                                  )}
                                >
                                  {row.errors.length > 0 ? '오류' : '경고'}
                                </span>
                              </TableCell>
                              <TableCell className="space-y-2">
                                {issues.map(({ issue, type }, index) => (
                                  <p key={`${issue.code}-${index}`} className="text-sm">
                                    <span
                                      className={cn(
                                        'mr-2 font-medium',
                                        type === '오류' ? 'text-destructive' : 'text-amber-800'
                                      )}
                                    >
                                      {type}
                                      {issue.field ? ` · ${issue.field}` : ''}
                                    </span>
                                    {issue.message}
                                  </p>
                                ))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                    선택한 상태에 해당하는 행이 없습니다.
                  </div>
                )}
              </>
            ) : (
              createdRows === null && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  오류나 경고가 없는 파일입니다. 검증만 완료되었으며 아직 등록되지는 않았습니다.
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isUploadConfirmOpen} onOpenChange={setIsUploadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              위스키 {validationResult?.totalRows ?? 0}건을 등록할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {validationResult?.warningRows
                ? `경고가 있는 행이 ${validationResult.warningRows}건 포함되어 있습니다. `
                : ''}
              업로드를 반복하면 같은 위스키가 중복 등록될 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createBulk.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={createBulk.isPending}>
              {createBulk.isPending ? '업로드 중...' : '업로드'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
