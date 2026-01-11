/**
 * 테이스팅 태그 목록 페이지
 */

export function TastingTagListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">테이스팅 태그 목록</h1>
        <p className="text-muted-foreground">
          테이스팅 태그를 관리합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 테이스팅 태그 목록이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
