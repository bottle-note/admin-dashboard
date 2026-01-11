/**
 * 정책/방침 관리 페이지
 */

export function PolicyListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">정책/방침 관리</h1>
        <p className="text-muted-foreground">
          서비스 정책 및 방침을 관리합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 정책 목록이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
