import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminAlcoholDetail } from '@/hooks/useAdminAlcohols';
import { useMfdsAutoMatching, useMfdsBulkMatchingPreview } from '@/hooks/useMfdsDeclarations';
import type { MfdsAlcoholCandidateItem } from '@/types/api';

function candidateName(candidate: MfdsAlcoholCandidateItem) {
  return candidate.korName ?? candidate.engName ?? `위스키 ${candidate.alcoholId}`;
}

// 호버한 후보만 마운트되므로 상세 조회도 그때 한 번 일어난다.
function CandidateDetail({ candidate }: { candidate: MfdsAlcoholCandidateItem }) {
  const detailQuery = useAdminAlcoholDetail(candidate.alcoholId);
  const detail = detailQuery.data;
  const imageUrl = detail?.imageUrl ?? candidate.imageUrl;
  const abv = detail?.abv ?? candidate.abv;
  const rows: [string, string | null | undefined][] = [
    ['종류', detail?.korCategory ?? candidate.korCategory],
    ['도수', abv && `${abv}%`],
    ['숙성', detail?.age ?? candidate.age],
    ['캐스크', detail?.cask],
  ];

  return (
    <div className="w-72 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{candidate.korName ?? '-'}</p>
          {candidate.engName && <p className="text-muted-foreground">{candidate.engName}</p>}
          <p className="text-muted-foreground">ID {candidate.alcoholId}</p>
        </div>
      </div>
      <dl className="grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-1">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="[overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
      </dl>
      {detailQuery.isLoading && (
        <p className="text-muted-foreground">상세 정보를 불러오는 중입니다.</p>
      )}
      {detailQuery.isError && (
        <p className="text-muted-foreground">상세 정보를 불러오지 못했습니다.</p>
      )}
    </div>
  );
}

export function MfdsTopCandidates({
  declarationId,
  candidates,
  candidatesLoaded,
  candidatesRefreshing,
  onSelect,
}: {
  declarationId: number;
  candidates: MfdsAlcoholCandidateItem[];
  /** 저장된 후보 조회가 끝났는지 여부. 0건 확인 뒤에만 자동 계산한다. */
  candidatesLoaded: boolean;
  /** 자동 계산 뒤 후보를 다시 불러오는 중인지 여부. */
  candidatesRefreshing: boolean;
  /** 후보를 고른 채 매칭 작업 창을 연다. 확정은 작업 창에서 한다. */
  onSelect: (candidate: MfdsAlcoholCandidateItem) => void;
}) {
  const top = [...candidates].sort((a, b) => b.score - a.score).slice(0, 3);
  // 같은 제품 그룹은 적용할 위스키와 무관하므로 1위 후보로 한 번만 조회해 건수를 보여 준다.
  const groupQuery = useMfdsBulkMatchingPreview(declarationId, top[0]?.alcoholId);
  const autoMatching = useMfdsAutoMatching(
    declarationId,
    candidatesLoaded && candidates.length === 0
  );
  if (top.length === 0) {
    if (!candidatesLoaded) return null;
    return (
      <p className="rounded-md border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
        {autoMatching.isFetching || candidatesRefreshing
          ? '저장된 후보가 없어 추천 후보를 계산하는 중입니다.'
          : autoMatching.isError
            ? '추천 후보를 계산하지 못했습니다. 매칭 관리에서 다시 계산할 수 있습니다.'
            : '추천할 후보가 없습니다. 매칭 관리에서 직접 검색하세요.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        추천 후보
        {groupQuery.data && ` · 같은 제품 신고 ${groupQuery.data.items.length}건`}
      </p>
      <TooltipProvider delayDuration={200}>
        <ol className="divide-y rounded-md border bg-background">
          {top.map((candidate, index) => {
            const name = candidateName(candidate);
            return (
              <li key={candidate.alcoholId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${name} 선택해 매칭 관리 열기`}
                      onClick={() => onSelect(candidate)}
                      className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{name}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {candidate.alcoholId}
                        </span>
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    align="start"
                    className="border bg-popover p-3 text-xs text-popover-foreground shadow-md"
                  >
                    <CandidateDetail candidate={candidate} />
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ol>
      </TooltipProvider>
    </div>
  );
}
