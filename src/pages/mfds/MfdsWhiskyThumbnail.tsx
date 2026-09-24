import { cn } from '@/lib/utils';

/** 매칭 화면에서 쓰는 위스키 이미지. 크기는 className으로 정한다. */
export function MfdsWhiskyThumbnail({
  imageUrl,
  className,
}: {
  imageUrl: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn('h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted', className)}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
          No image
        </div>
      )}
    </div>
  );
}
