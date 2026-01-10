/**
 * 사용자 관리 페이지 (ROOT_ADMIN 전용)
 */

export function UserListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">
          어드민 사용자를 관리합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 사용자 목록이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
