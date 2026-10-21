import { useRef, useState, type CSSProperties } from 'react';
import { GitBranch, ArrowDown, Wine } from 'lucide-react';
import { useSearchParams } from 'react-router';
import {
  useAttributeGroups,
  useAttributeDefinitions,
  useScenarioCandidates,
} from '@/hooks/useAlcoholAttributes';
import { Button } from '@/components/ui/button';
import { CATEGORY_GROUP_LABELS } from '@/types/api';
import {
  ANY_ANSWER,
  isPrice,
  matchesAnswer,
  scenarioRequest,
  scenarioAbvRanges,
  type ScenarioQuestion,
  scenarioQuestions,
  type ScenarioAnswer,
} from './scenario-questions';

export function AttributeScenarioPanel() {
  const groups = useAttributeGroups();
  const [params, setParams] = useSearchParams();
  const selected = groups.data?.find((group) => String(group.id) === params.get('scenarioGroupId'));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold">시나리오 탐색</h2>
          <p className="mt-1 text-sm text-slate-500">
            질문의 분기를 따라가며 추천 후보를 좁히는 화면입니다.
          </p>
        </div>
        <label className="w-full space-y-1 text-sm font-medium sm:w-72">
          <span>
            속성 그룹 <span className="text-blue-700">필수 · 1개</span>
          </span>
          <select
            aria-label="시나리오 속성 그룹"
            className="w-full rounded-lg border bg-white px-3 py-2"
            value={selected?.id ?? ''}
            disabled={groups.isPending || !!groups.error}
            onChange={(event) =>
              setParams(
                (previous) => {
                  const next = new URLSearchParams(previous);
                  if (event.target.value) next.set('scenarioGroupId', event.target.value);
                  else next.delete('scenarioGroupId');
                  return next;
                },
                { replace: true }
              )
            }
          >
            <option value="">
              {groups.isPending ? '그룹을 불러오는 중…' : '그룹을 선택하세요'}
            </option>
            {groups.data?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {groups.error ? (
        <div role="alert" className="rounded-xl border bg-white p-6 text-sm">
          그룹을 불러오지 못했습니다.
          <Button variant="outline" className="ml-3" onClick={() => void groups.refetch()}>
            다시 조회
          </Button>
        </div>
      ) : !selected ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50/60 p-8 text-center">
          <GitBranch className="mb-4 h-9 w-9 text-slate-400" aria-hidden="true" />
          <h3 className="text-base font-semibold">먼저 속성 그룹을 선택하세요</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            선택한 그룹의 질문에 종류·향·도수 질문을 함께 연결합니다.
            <br />
            그룹을 선택하면 실제 질문과 추천 후보를 확인할 수 있습니다.
          </p>
          {groups.isSuccess && !groups.data?.length && (
            <p className="mt-3 text-sm">속성 그룹 탭에서 그룹을 먼저 만들어주세요.</p>
          )}
        </div>
      ) : (
        <ScenarioExplorer key={selected.id} groupId={selected.id} />
      )}
    </div>
  );
}

function ScenarioExplorer({ groupId }: { groupId: number }) {
  const definitions = useAttributeDefinitions();
  const [answers, setAnswers] = useState<ScenarioAnswer[]>([]);
  const [width, setWidth] = useState(60);
  const container = useRef<HTMLDivElement>(null);
  const questions = scenarioQuestions(
    (definitions.data ?? []).filter((a) => a.groupId === groupId)
  );
  const dataset = useScenarioCandidates(
    groupId,
    scenarioRequest(questions, answers),
    definitions.isSuccess
  );
  const first = dataset.data?.pages[0];
  const candidates = [
    ...new Map(
      dataset.data?.pages.flatMap((page) => page.items).map((item) => [item.alcoholId, item])
    ).values(),
  ];
  const resize = (value: number) => setWidth(Math.max(35, Math.min(75, value)));
  if (definitions.error)
    return (
      <div role="alert">
        질문을 불러오지 못했습니다.{' '}
        <Button onClick={() => void definitions.refetch()}>다시 조회</Button>
      </div>
    );
  if (definitions.isPending)
    return (
      <p role="status" className="p-8">
        그룹의 질문을 불러오는 중입니다.
      </p>
    );
  return (
    <div
      ref={container}
      className="scenario-split overflow-hidden rounded-xl border bg-white"
      style={{ '--question-width': `${width}%` } as CSSProperties}
    >
      <section aria-label="질문과 분기" className="min-w-0 bg-slate-50/50">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <GitBranch className="h-4 w-4 text-blue-600" />
            질문과 분기
          </h3>
          <Button
            size="sm"
            variant="ghost"
            disabled={!answers.length}
            onClick={() => setAnswers([])}
          >
            처음부터
          </Button>
        </header>
        <div className="p-4 sm:p-6">
          <p className="mb-5 text-xs text-slate-500">
            질문에 순서대로 답해주세요. 앞 답변을 바꾸면 이후 답변이 초기화됩니다.
          </p>
          {!questions.length && (
            <p className="py-8 text-center text-slate-500">이 그룹에 등록된 속성이 없습니다.</p>
          )}
          {questions.map((question, index) => (
            <ScenarioQuestionCard
              key={question.key}
              groupId={groupId}
              questions={questions}
              question={question}
              index={index}
              answers={answers}
              onAnswer={(answer) => setAnswers([...answers.slice(0, index), answer])}
              onEdit={() => setAnswers((current) => current.slice(0, index))}
            />
          ))}
        </div>
      </section>
      <div
        role="separator"
        aria-label="질문 패널 너비"
        aria-orientation="vertical"
        aria-valuemin={35}
        aria-valuemax={75}
        aria-valuenow={Math.round(width)}
        tabIndex={0}
        className="scenario-divider relative hidden cursor-col-resize touch-none items-center justify-center bg-slate-100 outline-none hover:bg-blue-100 focus-visible:bg-blue-200 lg:flex"
        onKeyDown={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            resize(
              event.key === 'Home'
                ? 35
                : event.key === 'End'
                  ? 75
                  : width + (event.key === 'ArrowLeft' ? -5 : 5)
            );
          }
        }}
        onPointerDown={(event) => {
          if (event.button === 0) {
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const rect = container.current?.getBoundingClientRect();
          if (rect) resize(((event.clientX - rect.left) / rect.width) * 100);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        <span className="h-10 w-0.5 rounded-full bg-slate-400" />
      </div>

      <section aria-label="추천 후보" className="min-w-0 border-t lg:border-t-0">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Wine className="h-4 w-4 text-blue-600" />
            추천 후보
          </h3>
          {first && (
            <span
              role="status"
              className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
            >
              후보 {first.totalCount}개
            </span>
          )}
        </header>
        <div className="p-4 sm:p-5">
          <p className="mb-4 text-xs text-slate-500">
            {answers.length
              ? `선택한 답변 ${answers.length}개를 모두 만족하는 위스키입니다.`
              : '이 그룹의 속성이 연결된 위스키입니다.'}{' '}
            {first && `전체 ${first.totalCount}개 중 ${candidates.length}개 표시`}
          </p>
          {dataset.isPending && <p role="status">추천 후보를 불러오는 중입니다.</p>}
          {dataset.isError && (
            <div role="alert" className="mb-4 text-sm">
              {dataset.isFetchNextPageError
                ? '추가 후보를 불러오지 못했습니다.'
                : '추천 후보를 불러오지 못했습니다.'}
              <Button
                variant="outline"
                className="ml-2"
                onClick={() =>
                  void (dataset.isFetchNextPageError ? dataset.fetchNextPage() : dataset.refetch())
                }
              >
                다시 조회
              </Button>
            </div>
          )}
          {first?.totalCount === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              조건에 맞는 위스키가 없습니다.
            </p>
          )}
          <ul className="divide-y">
            {candidates.map((row) => (
              <li key={row.alcoholId} className="py-3 first:pt-0">
                <p className="break-words text-sm font-semibold">
                  {row.korName || row.engName || `위스키 #${row.alcoholId}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {CATEGORY_GROUP_LABELS[row.categoryGroup] ?? row.korCategory}
                  {row.abv !== null ? ` · ${row.abv}%` : row.abvRaw ? ` · ${row.abvRaw}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.attributes.flatMap((attribute) =>
                    attribute.values
                      .filter((value) =>
                        questions.some(
                          (q, i) =>
                            q.source === 'attribute' &&
                            q.attribute.id === attribute.attributeId &&
                            answers[i] !== undefined &&
                            matchesAnswer(value, answers[i]!)
                        )
                      )
                      .map((value) => (
                        <span
                          key={`${attribute.attributeId}:${value}`}
                          className="max-w-full break-words rounded bg-blue-50 px-2 py-1 text-xs text-blue-800"
                        >
                          {first?.attributeDefinitions.find(
                            (a) => a.attributeId === attribute.attributeId
                          )?.unit === '원'
                            ? `${Number(value).toLocaleString()}원`
                            : value}
                        </span>
                      ))
                  )}
                </div>
              </li>
            ))}
          </ul>
          {dataset.hasNextPage && (
            <Button
              className="mt-4 w-full"
              variant="outline"
              disabled={dataset.isFetching}
              onClick={() => void dataset.fetchNextPage()}
            >
              {dataset.isFetchingNextPage ? '추가 후보를 불러오는 중…' : '25개 더 보기'}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function ScenarioQuestionCard({
  groupId,
  questions,
  question,
  index,
  answers,
  onAnswer,
  onEdit,
}: {
  groupId: number;
  questions: ScenarioQuestion[];
  question: ScenarioQuestion;
  index: number;
  answers: ScenarioAnswer[];
  onAnswer: (answer: ScenarioAnswer) => void;
  onEdit: () => void;
}) {
  const locked = index > answers.length;
  const query = useScenarioCandidates(
    groupId,
    scenarioRequest(questions, answers.slice(0, index)),
    !locked
  );
  const page = query.data?.pages[0];
  const facets = page?.facets;
  const options =
    facets?.options.map((option) => ({
      ...option,
      label:
        question.source === 'abv'
          ? (scenarioAbvRanges.find((r) => r.key === option.value)?.label ?? option.label)
          : option.label,
    })) ?? [];
  if (question.source !== 'attribute' && page)
    options.push({
      value: ANY_ANSWER,
      label: '상관없어요',
      count: page.totalCount,
      from: null,
      to: null,
    });
  return (
    <div>
      {index > 0 && (
        <div className="flex justify-center py-4 text-slate-300">
          <ArrowDown aria-hidden="true" className="h-5 w-5" />
        </div>
      )}
      <fieldset
        disabled={locked || query.isPending || query.isError}
        className={`min-w-0 rounded-xl border bg-white p-4 sm:p-5 ${locked ? 'opacity-50' : ''}`}
      >
        <legend className="px-2 text-xs font-medium text-blue-700">
          질문 {String(index + 1).padStart(2, '0')}
        </legend>
        <h4 className="mb-2 text-base font-semibold">{question.displayName}</h4>
        <p className="mb-4 text-xs leading-5 text-slate-500">
          {question.source === 'attribute'
            ? '선택한 속성 그룹의 연결 값으로 찾습니다.'
            : question.source === 'tasting'
              ? '선택한 향 그룹의 대표 태그가 있는 위스키를 찾습니다.'
              : question.source === 'abv'
                ? '도수 구간은 양끝을 포함합니다. 도수 정보가 없으면 범위 선택 시 제외됩니다.'
                : '위스키에 등록된 종류로 찾습니다.'}
        </p>
        {locked ? (
          <p className="text-xs text-slate-500">앞 질문에 먼저 답해주세요.</p>
        ) : query.isPending ? (
          <p role="status" className="text-xs">
            선택지를 불러오는 중입니다.
          </p>
        ) : question.source === 'attribute' && isPrice(question.key) ? (
          <ScenarioPriceRange
            key={`${question.key}:${JSON.stringify(answers.slice(0, index))}`}
            minimum={facets?.min ?? null}
            maximum={facets?.max ?? null}
            applied={Array.isArray(answers[index])}
            onEdit={onEdit}
            onApply={onAnswer}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map(({ value, label, count }) => (
              <button
                key={value}
                type="button"
                aria-pressed={answers[index] === value}
                aria-label={`${label} · ${count}개`}
                disabled={count === 0 && value !== ANY_ANSWER}
                className={`flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${answers[index] === value ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500' : 'bg-white hover:border-blue-300 disabled:text-slate-400'}`}
                onClick={() => onAnswer(value)}
              >
                <span className="min-w-0 break-words">{label}</span>
                <span className="shrink-0 text-xs tabular-nums">{count}개</span>
              </button>
            ))}
          </div>
        )}
        {facets?.hasMoreOptions && (
          <p className="mt-2 text-xs text-slate-500">
            선택지는 최대 100개까지 표시합니다. 앞 조건을 좁히면 나머지 값을 확인할 수 있습니다.
          </p>
        )}
      </fieldset>
      {!locked && query.isError && (
        <div role="alert" className="p-3 text-sm">
          선택지를 불러오지 못했습니다.{' '}
          <Button variant="outline" onClick={() => void query.refetch()}>
            선택지 다시 조회
          </Button>
        </div>
      )}
    </div>
  );
}

function ScenarioPriceRange({
  minimum,
  maximum,
  applied,
  onEdit,
  onApply,
}: {
  minimum: number | null;
  maximum: number | null;
  applied: boolean;
  onEdit: () => void;
  onApply: (range: [number, number]) => void;
}) {
  const lower = minimum === null ? 0 : Math.floor(minimum / 1000) * 1000;
  const upper = maximum === null ? 1000 : Math.max(lower + 1000, Math.ceil(maximum / 1000) * 1000);
  const [draft, setDraft] = useState<[string, string]>([String(lower), String(upper)]);
  const min = Number(draft[0]),
    max = Number(draft[1]);
  const valid =
    minimum !== null &&
    maximum !== null &&
    draft.every((value) => value.trim() !== '' && Number.isSafeInteger(Number(value))) &&
    min >= 0 &&
    min <= max;
  function change(index: 0 | 1, value: string) {
    setDraft((previous) => (index === 0 ? [value, previous[1]] : [previous[0], value]));
    onEdit();
  }
  const ratio = (value: number) =>
    Math.max(0, Math.min(100, ((value - lower) / (upper - lower)) * 100));
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        한 잔에 얼마 정도를 생각하세요? 양쪽 손잡이를 드래그하거나 금액을 입력하세요.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold tabular-nums text-blue-800">
          {valid
            ? `${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`
            : '가격 범위를 확인해주세요'}
        </p>
        <span className="text-xs text-slate-500">적용 후 전체 후보 수를 확인합니다.</span>
      </div>
      <div className="scenario-price-range relative mx-3 h-9">
        <div className="absolute inset-x-0 top-4 h-1 rounded bg-slate-200" />
        <div
          className="absolute top-4 h-1 rounded bg-blue-500"
          style={{ left: `${ratio(min)}%`, right: `${100 - ratio(max)}%` }}
        />
        <input
          type="range"
          aria-label="최소 잔 가격 조절"
          min={lower}
          max={upper}
          step={1000}
          value={Math.max(lower, Math.min(upper, min))}
          style={{ zIndex: min >= upper ? 4 : 2 }}
          onChange={(event) => change(0, String(Math.min(Number(event.target.value), max)))}
        />
        <input
          type="range"
          aria-label="최대 잔 가격 조절"
          min={lower}
          max={upper}
          step={1000}
          value={Math.max(lower, Math.min(upper, max))}
          style={{ zIndex: 3 }}
          onChange={(event) => change(1, String(Math.max(Number(event.target.value), min)))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 text-xs">
          최소 잔 가격
          <input
            type="number"
            min={0}
            step={1000}
            value={draft[0]}
            onChange={(event) => change(0, event.target.value)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          />
        </label>
        <label className="min-w-0 text-xs">
          최대 잔 가격
          <input
            type="number"
            min={0}
            step={1000}
            value={draft[1]}
            onChange={(event) => change(1, event.target.value)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          />
        </label>
      </div>
      {!valid && (
        <p role="alert" className="text-xs text-red-700">
          가격은 0원 이상의 정수이며 최소 가격이 최대 가격보다 작거나 같아야 합니다.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!valid || applied} onClick={() => onApply([min, max])}>
          가격 범위 적용
        </Button>
        <span className="text-xs text-slate-500">
          {applied ? '적용됨 · 다음 질문으로 진행하세요.' : '적용하면 후보가 갱신됩니다.'}
        </span>
      </div>
      <p className="text-xs leading-5 text-slate-400">
        시나리오 검증용 모의 참고 가격입니다. 실제 판매가와 다르며, 가격이 없는 위스키는 범위 적용
        시 제외됩니다.
      </p>
    </div>
  );
}
