/**
 * 위스키 상세 페이지
 */

import { useParams } from 'react-router';

export function WhiskyDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">위스키 상세</h1>
        <p className="text-muted-foreground">
          위스키 ID: {id}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          API 연동 후 위스키 상세 정보가 표시됩니다.
        </p>
      </div>
    </div>
  );
}
