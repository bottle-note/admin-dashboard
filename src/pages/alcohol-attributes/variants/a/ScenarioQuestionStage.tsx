import { useEffect, useRef, type ReactNode } from 'react';

export function ScenarioQuestionStage<T extends { id: string }>({
  questions,
  stage,
  edges,
  selectedId,
  renderQuestion,
}: {
  questions: T[];
  stage: number;
  edges: { id: string; from: string; to: string | null; label: string }[];
  selectedId?: string;
  renderQuestion: (question: T, label: string) => ReactNode;
}) {
  const branches = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = branches.current;
    const selected = Array.from(
      container?.querySelectorAll<HTMLElement>('[data-stage-node]') ?? []
    ).find((node) => node.dataset.stageNode === selectedId);
    if (!container || !selected) return;
    const reveal = () => {
      const viewport = container.getBoundingClientRect();
      const card = selected.getBoundingClientRect();
      if (card.left < viewport.left || card.right > viewport.right)
        container.scrollTo({
          left:
            container.scrollLeft + card.left - viewport.left - (viewport.width - card.width) / 2,
          behavior: 'instant',
        });
    };
    reveal();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(reveal);
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedId]);
  if (questions.length === 1)
    return <div>{renderQuestion(questions[0]!, String(stage).padStart(2, '0'))}</div>;
  return (
    <section role="region" aria-label={`질문 ${stage} 분기`} className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="font-medium text-slate-600">
          질문 {stage} · 답변에 따라 한 갈래만 진행합니다.
        </p>
        <p className="text-slate-500">갈래를 좌우로 넘겨 볼 수 있습니다.</p>
      </div>
      <div
        ref={branches}
        role="group"
        aria-label={`질문 ${stage}의 세부 질문`}
        tabIndex={0}
        className="scenario-stage-branches rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        {questions.map((question, index) => (
          <div key={question.id} data-stage-node={question.id} className="min-w-0">
            <p
              className={`mb-3 min-h-6 break-keep text-center text-xs font-medium ${selectedId === question.id ? 'text-blue-700' : 'text-slate-500'}`}
            >
              {edges
                .filter((edge) => edge.to === question.id)
                .map((edge) => edge.label)
                .join(' / ')}
            </p>
            {renderQuestion(question, `${stage}-${index + 1}`)}
          </div>
        ))}
      </div>
    </section>
  );
}
