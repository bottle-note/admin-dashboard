import { ArrowLeft, Check, Layers, Link2, Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MfdsBulkMatchingPanel } from './MfdsBulkMatchingPanel';
import { PENDING_WHISKY_SOURCE_LABEL, type PendingWhisky } from './mfds-pending-whisky';
import { MfdsWhiskyLookupPanel, MfdsWhiskyMatchingPanel } from './MfdsWhiskyMatchingPanel';
import { MfdsWhiskyThumbnail } from './MfdsWhiskyThumbnail';

export type MfdsWorkspaceView = 'whisky' | 'whiskySearch' | 'bulk';

/** 보이는 화면과 선택한 위스키를 함께 들고 다녀 화면이 바뀌어도 선택이 유지된다. */
export interface MfdsWorkspaceState {
  view: MfdsWorkspaceView;
  selected: PendingWhisky | null;
}

export interface MfdsWorkspaceSummary {
  title: string;
  subtitle: string | null;
  rcno: string;
  facts: { label: string; value: string }[];
  importer: { name: string; connected: boolean };
}

const VIEW_TEXT: Record<MfdsWorkspaceView, { title: string; description: string }> = {
  whisky: {
    title: '보틀노트 위스키 연결',
    description: '후보 또는 직접 검색으로 위스키를 고르고 이 신고에 확정합니다.',
  },
  whiskySearch: {
    title: '위스키 직접 찾기',
    description: '고른 위스키는 위스키 연결 화면으로 돌아가 확정합니다.',
  },
  bulk: {
    title: '같은 제품 일괄 적용',
    description: '같은 제품으로 묶인 신고에 선택한 위스키를 한 번에 연결합니다.',
  },
};

/**
 * 신고 상세에서 여는 매칭 작업 창이다. 사이드바는 고정하고 오른쪽 콘텐츠만 바꿔
 * 창을 겹쳐 띄우지 않는다.
 */
export function MfdsMatchingWorkspace({
  state,
  onStateChange,
  declarationId,
  currentWhisky,
  defaultBulkWhisky,
  summary,
  onRegister,
}: {
  state: MfdsWorkspaceState | null;
  onStateChange: (state: MfdsWorkspaceState | null) => void;
  declarationId: number;
  currentWhisky: PendingWhisky | null;
  /** 선택한 위스키 없이 일괄 적용을 열 때 쓰는 위스키다. 현재 연결 또는 1위 후보다. */
  defaultBulkWhisky: PendingWhisky | undefined;
  summary: MfdsWorkspaceSummary;
  /** 신규 위스키는 상세의 위스키 등록 탭에서 등록과 동시에 이 신고에 연결한다. */
  onRegister: () => void;
}) {
  const view = state?.view ?? null;
  const selected = state?.selected ?? null;
  const close = () => onStateChange(null);
  const go = (next: MfdsWorkspaceView, nextSelected: PendingWhisky | null = selected) =>
    onStateChange({ view: next, selected: nextSelected });
  const bulkWhisky = selected ?? defaultBulkWhisky ?? null;
  const text = VIEW_TEXT[view ?? 'whisky'];

  const nav = [
    { label: '위스키 연결', icon: Link2, view: 'whisky' as const, disabled: false },
    { label: '위스키 직접 찾기', icon: Search, view: 'whiskySearch' as const, disabled: false },
    { label: '같은 제품 일괄 적용', icon: Layers, view: 'bulk' as const, disabled: !bulkWhisky },
  ];
  const navItemClass =
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

  return (
    <Dialog open={view != null} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="flex h-[85vh] max-w-5xl gap-0 overflow-hidden p-0 text-sm"
        // 요청 중 버튼이 비활성화되면 포커스가 창 밖으로 빠진다. 이때와 토스트 조작으로 창이 닫히지 않게 한다.
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          if ((event.target as HTMLElement | null)?.closest('[role="alert"]')) {
            event.preventDefault();
          }
        }}
      >
        <aside className="hidden w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/30 px-4 py-4 md:flex">
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">
              {summary.title}
            </p>
            {summary.subtitle && (
              <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                {summary.subtitle}
              </p>
            )}
            <p className="font-mono text-[11px] text-muted-foreground">RCNO {summary.rcno}</p>
          </div>
          <nav aria-label="매칭 작업" className="space-y-1">
            {nav.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-current={view === item.view ? 'page' : undefined}
                disabled={item.disabled}
                onClick={() => go(item.view, item.view === 'bulk' ? bulkWhisky : selected)}
                className={cn(
                  navItemClass,
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  view === item.view
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/80 hover:bg-background hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            ))}
            <div className="!mt-2 border-t pt-2">
              <button
                type="button"
                onClick={() => {
                  close();
                  onRegister();
                }}
                className={cn(
                  navItemClass,
                  'text-foreground/80 hover:bg-background hover:text-foreground'
                )}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                위스키 신규 등록
              </button>
            </div>
          </nav>
          <dl className="grid grid-cols-[4rem_1fr] gap-x-2 gap-y-1 border-t pt-3 text-xs">
            {summary.facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="[overflow-wrap:anywhere]">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <dl className="space-y-1.5 border-t pt-3 text-xs">
            <div className="flex items-start gap-1.5">
              <span
                className={cn(
                  'mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                  summary.importer.connected
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-muted-foreground/30'
                )}
                aria-hidden="true"
              >
                {summary.importer.connected && <Check className="h-2.5 w-2.5" />}
              </span>
              <dt className="w-10 shrink-0 text-muted-foreground">수입사</dt>
              <dd className="min-w-0 [overflow-wrap:anywhere]">{summary.importer.name}</dd>
            </div>
          </dl>
          <div className="mt-auto space-y-2 border-t pt-3 text-xs">
            <div>
              <p className="text-muted-foreground">현재 연결</p>
              <p className="mt-0.5 font-medium [overflow-wrap:anywhere]">
                {currentWhisky
                  ? `${currentWhisky.korName} · ${currentWhisky.alcoholId}`
                  : '연결된 위스키 없음'}
              </p>
            </div>
            <section
              aria-label="선택한 위스키"
              className={cn(
                'rounded-md border p-2',
                selected ? 'border-primary bg-background shadow-sm' : 'border-dashed'
              )}
            >
              <p className="text-muted-foreground">선택한 위스키</p>
              {selected ? (
                <div className="mt-1.5 flex items-start gap-2">
                  <MfdsWhiskyThumbnail imageUrl={selected.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">
                      {selected.korName}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      {PENDING_WHISKY_SOURCE_LABEL[selected.source]} · ID {selected.alcoholId}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="선택 해제"
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => go(view === 'bulk' ? 'whisky' : (view ?? 'whisky'), null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  후보, 직접 검색, 추천에서 위스키를 고르세요.
                </p>
              )}
            </section>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start gap-2 border-b px-5 py-3 pr-12">
            {view && view !== 'whisky' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-ml-2 h-7 w-7 shrink-0"
                aria-label="위스키 연결로 돌아가기"
                onClick={() => go('whisky')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0">
              <DialogTitle className="text-base">{text.title}</DialogTitle>
              <DialogDescription className="text-xs">{text.description}</DialogDescription>
            </div>
          </header>

          {view === 'whisky' && (
            <MfdsWhiskyMatchingPanel
              declarationId={declarationId}
              selectedAlcoholId={currentWhisky?.alcoholId ?? null}
              selectedWhisky={selected}
              onSelectWhisky={(whisky) => go('whisky', whisky)}
              onOpenBulk={() => go('bulk')}
              onDone={close}
            />
          )}
          {view === 'whiskySearch' && (
            <MfdsWhiskyLookupPanel onSelect={(whisky) => go('whisky', whisky)} />
          )}
          {view === 'bulk' && bulkWhisky && (
            <MfdsBulkMatchingPanel
              key={bulkWhisky.alcoholId}
              declarationId={declarationId}
              alcoholId={bulkWhisky.alcoholId}
              onDone={close}
            />
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
