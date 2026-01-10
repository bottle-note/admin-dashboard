/**
 * 문의 목록 페이지
 */

export function InquiryListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">위스키 문의 목록</h1>
        <p className="text-muted-foreground">
          사용자 문의를 관리합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 문의 목록이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
