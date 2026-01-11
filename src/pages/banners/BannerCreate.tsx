/**
 * 배너 등록 페이지
 */

export function BannerCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">배너 등록</h1>
        <p className="text-muted-foreground">
          새 배너를 등록합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 배너 등록 폼이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
