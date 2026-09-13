import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
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
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ id: number; file: File; replace: boolean; done: boolean }[]>(
    []
  );
  const nextId = useRef(0);
  const targets = rows.map((row) => ({
    row,
    filename: row.imageFileName?.normalize('NFC') || null,
  }));
  const matches = files.map((entry) => {
    const filename = entry.file.name.normalize('NFC');
    const candidates = targets.filter((item) => item.filename === filename);
    const target = candidates.length === 1 ? candidates[0] : undefined;
    const duplicate =
      files.filter((item) => !item.done && item.file.name.normalize('NFC') === filename).length > 1;
    const image = target ? uploads.images[target.row.clientRowId] : undefined;
    const supported = DEFAULT_IMAGE_PROCESSING_POLICY.allowedMimeTypes.includes(entry.file.type);
    let status = '매칭 완료';
    if (entry.done) {
      status = '업로드 완료';
    } else if (!supported) {
      status = '지원하지 않는 형식';
    } else if (candidates.length > 1) {
      status = '엑셀 파일명 중복';
    } else if (!target) {
      status = '일치하는 행 없음';
    } else if (duplicate) {
      status = '파일 중복';
    } else if (!target.row.normalized) {
      status = '엑셀 오류';
    } else if (image?.uploading) {
      status = '업로드 중...';
    } else if (image?.error) {
      status = '업로드 실패';
    } else if (image?.url && !entry.replace) {
      status = '교체 선택 필요';
    }
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
            Excel의 이미지 파일명과 일치하는 파일을 연결합니다. (확장자 포함)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-semibold">1. 이미지 선택</h3>
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
              <span className="text-xs text-muted-foreground">JPG · PNG · WEBP</span>
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
            <h3 className="font-semibold">2. 매칭 결과 확인</h3>
            <div className="divide-y rounded-md border">
              {targets.map(({ row, filename }) => (
                <div key={row.clientRowId} className="space-y-1 p-3 text-sm">
                  <p className="break-words">
                    {row.rowNumber}행 · {row.korName || row.engName}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {row.imageFileName || '파일명 미입력'}
                  </p>
                  {filename && (
                    <p className="text-xs text-muted-foreground">
                      {targets.filter((item) => item.filename === filename).length > 1
                        ? '엑셀 파일명 중복'
                        : uploads.images[row.clientRowId]?.url
                          ? '첨부 완료'
                          : files.some((item) => item.file.name.normalize('NFC') === filename)
                            ? '선택 완료'
                            : '파일 미선택'}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {matches.length > 0 && (
              <div className="space-y-2">
                {matches.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                    {DEFAULT_IMAGE_PROCESSING_POLICY.allowedMimeTypes.includes(item.file.type) && (
                      <FilePreview file={item.file} />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-all text-sm">{item.file.name}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {item.target &&
                          `${item.target.row.korName || item.target.row.engName || `${item.target.row.rowNumber}행`} · `}
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
              일치하는 행이 없는 파일과 중복 파일은 제외됩니다.
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
