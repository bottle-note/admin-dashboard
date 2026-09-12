import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_IMAGE_PROCESSING_POLICY } from '@/components/common/image-processing-policy';
import type { useBulkAlcoholImages } from '@/hooks/useBulkAlcoholImages';
import type { AlcoholExcelValidationRow } from '@/types/api/alcohol.api';

function FilePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = next;
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <img
      ref={imageRef}
      alt="선택 이미지"
      className="h-10 w-10 shrink-0 rounded border object-contain"
    />
  );
}

export function BulkImageDialog({
  rows,
  uploads,
  onClose,
}: {
  rows: AlcoholExcelValidationRow[];
  uploads: ReturnType<typeof useBulkAlcoholImages>;
  onClose: () => void;
}) {
  const [copyState, setCopyState] = useState<{
    clientRowId: string;
    status: 'copied' | 'error';
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ id: number; file: File; replace: boolean; done: boolean }[]>(
    []
  );
  const nextId = useRef(0);
  const targets = rows.map((row) => ({
    row,
    filename: `${String(row.rowNumber).padStart(3, '0')}_${(row.korName || row.engName || '위스키')
      .normalize('NFC')
      .replace(/[<>:"/\\|?*]/g, '_')
      .split('')
      .map((character) => (character.charCodeAt(0) < 32 ? '_' : character))
      .join('')
      .replace(/\s+/g, '_')
      .slice(0, 80)
      .replace(/[. ]+$/, '')}`,
  }));
  const matches = files.map((entry) => {
    const basename = entry.file.name.replace(/\.[^.]+$/, '').normalize('NFC');
    const target = targets.find((item) => item.filename === basename);
    const duplicate =
      files.filter(
        (item) => !item.done && item.file.name.replace(/\.[^.]+$/, '').normalize('NFC') === basename
      ).length > 1;
    const image = target ? uploads.images[target.row.clientRowId] : undefined;
    const supported = DEFAULT_IMAGE_PROCESSING_POLICY.allowedMimeTypes.includes(entry.file.type);
    const status = entry.done
      ? '업로드 완료'
      : !supported
        ? '지원하지 않는 형식'
        : !target
          ? '대상 없음'
          : duplicate
            ? '파일 중복 · 하나만 남겨주세요'
            : !target.row.normalized
              ? '엑셀 오류 수정 필요'
              : image?.uploading
                ? '업로드 중...'
                : image?.error
                  ? '업로드 실패'
                  : image?.url && !entry.replace
                    ? '교체 선택 필요'
                    : '매칭 완료';
    const eligible =
      !entry.done &&
      supported &&
      target?.row.normalized &&
      !duplicate &&
      (!image?.url || entry.replace);
    return { ...entry, target, image, status, eligible };
  });
  const eligible = matches.filter((item) => item.eligible);
  const addFiles = (selected: File[]) => {
    if (uploads.isUploading) return;
    setFiles((current) => [
      ...current,
      ...selected.map((file) => ({ id: nextId.current++, file, replace: false, done: false })),
    ]);
  };
  const handleUpload = async () => {
    const result = await uploads.upload(
      eligible.map((item) => ({ clientRowId: item.target!.row.clientRowId, file: item.file }))
    );
    if (!result) return;
    const completedIds = new Set(
      eligible.filter((item) => result[item.target!.row.clientRowId]).map((item) => item.id)
    );
    setFiles((current) =>
      current.map((item) => (completedIds.has(item.id) ? { ...item, done: true } : item))
    );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !uploads.isUploading) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>여러 이미지 추가</DialogTitle>
          <DialogDescription>
            파일명으로 위스키를 연결하고 매칭 결과를 확인한 뒤 업로드하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-semibold">1. 파일명 준비</h3>
            <p className="text-sm text-muted-foreground">
              아래 이름을 복사해 파일명을 변경하세요. 확장자는 유지하세요.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const csvRows = [
                  ['행 번호', '위스키명', '파일명 (확장자 제외)'],
                  ...targets.map(({ row, filename }) => [
                    String(row.rowNumber),
                    row.korName || row.engName || '위스키',
                    filename,
                  ]),
                ];
                const csv =
                  '\uFEFF' +
                  csvRows
                    .map((cells) =>
                      cells
                        .map((cell) => {
                          const safeCell = /^[\s]*[=+@-]/.test(cell) ? "'" + cell : cell;
                          return '"' + safeCell.replace(/"/g, '""') + '"';
                        })
                        .join(',')
                    )
                    .join('\r\n');
                const url = URL.createObjectURL(
                  new Blob([csv], { type: 'text/csv;charset=utf-8' })
                );
                const link = document.createElement('a');
                link.href = url;
                link.download = 'whisky-image-filenames.csv';
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              파일명 목록 다운로드
            </Button>
            <div className="rounded-md border">
              {targets.map(({ row, filename }) => (
                <div
                  key={row.clientRowId}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 border-b p-3 last:border-0"
                >
                  <span className="break-words text-sm">{row.korName || row.engName}</span>
                  <code className="break-all rounded bg-muted px-2 py-1 text-xs">{filename}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`${row.rowNumber}행 ${row.korName || row.engName} 파일명 복사`}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(filename);
                        setCopyState({ clientRowId: row.clientRowId, status: 'copied' });
                      } catch {
                        setCopyState({ clientRowId: row.clientRowId, status: 'error' });
                      }
                    }}
                  >
                    {copyState?.clientRowId === row.clientRowId && copyState.status === 'copied' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                        <span role="status">완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        복사
                      </>
                    )}
                  </Button>
                  {copyState?.clientRowId === row.clientRowId && copyState.status === 'error' && (
                    <p role="alert" className="col-span-3 text-xs text-destructive">
                      복사하지 못했습니다. 표시된 파일명을 직접 복사하세요.
                    </p>
                  )}
                </div>
              ))}
            </div>
            {targets[0] && (
              <p className="break-all text-xs text-muted-foreground">
                예: {targets[0].filename}.jpg
              </p>
            )}
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">2. 이미지 선택</h3>
            <button
              type="button"
              disabled={uploads.isUploading}
              onClick={() => input.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(Array.from(event.dataTransfer.files));
              }}
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-sm disabled:opacity-50"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              이미지를 드래그하거나 파일 선택
              <span className="text-xs text-muted-foreground">
                JPG · PNG · WEBP / 여러 파일 선택 가능
              </span>
            </button>
            <input
              ref={input}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-label="매칭할 이미지 파일 선택"
              className="hidden"
              disabled={uploads.isUploading}
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
            />
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">3. 매칭 결과 확인</h3>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                이미지를 선택하면 연결 대상이 표시됩니다.
              </p>
            ) : (
              <div className="space-y-2">
                {matches.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                    {DEFAULT_IMAGE_PROCESSING_POLICY.allowedMimeTypes.includes(item.file.type) && (
                      <FilePreview file={item.file} />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-all text-sm">{item.file.name}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {item.target?.row.korName || item.target?.row.engName || '연결 대상 없음'} ·{' '}
                        {item.status}
                      </p>
                      {item.image?.error && !item.done && (
                        <p className="text-xs text-destructive">{item.image.error}</p>
                      )}
                      {item.image?.url && !item.done && (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            aria-label={`선택 ${item.id + 1}번 ${item.file.name} 기존 이미지 교체`}
                            checked={item.replace}
                            disabled={uploads.isUploading}
                            onChange={(event) =>
                              setFiles((current) =>
                                current.map((file) =>
                                  file.id === item.id
                                    ? { ...file, replace: event.target.checked }
                                    : file
                                )
                              )
                            }
                          />
                          기존 이미지 교체
                        </label>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={uploads.isUploading}
                      aria-label={`선택 ${item.id + 1}번 ${item.file.name} 목록에서 제외`}
                      onClick={() => {
                        setFiles((current) => current.filter((file) => file.id !== item.id));
                        if (item.target && item.image?.error)
                          uploads.dismissError(item.target.row.clientRowId);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {files.some((file) => file.done) && (
              <p role="status" className="text-sm text-muted-foreground">
                이미지 {files.filter((file) => file.done).length}개 업로드 완료
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              대상이 없거나 중복된 파일은 업로드하지 않습니다. 실패한 파일만 다시 업로드할 수
              있습니다.
            </p>
          </section>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" disabled={uploads.isUploading} onClick={onClose}>
            {files.some((file) => file.done) ? '닫기' : '취소'}
          </Button>
          <Button
            type="button"
            disabled={uploads.isUploading || eligible.length === 0}
            onClick={handleUpload}
          >
            {uploads.isUploading
              ? '이미지 업로드 중...'
              : `매칭된 이미지 ${eligible.length}개 업로드`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
