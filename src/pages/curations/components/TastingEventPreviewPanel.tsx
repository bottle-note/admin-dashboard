import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TastingEventPreviewPanel() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>작성 중인 시음회 미리보기가 표시될 영역입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="min-h-[34rem] rounded-lg border border-dashed bg-muted/20"
          aria-label="비어 있는 미리보기 영역"
        />
      </CardContent>
    </Card>
  );
}
