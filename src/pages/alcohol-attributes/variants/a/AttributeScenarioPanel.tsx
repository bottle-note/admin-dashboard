import { useRef, useState, type CSSProperties } from 'react';
import { GitBranch, Plus, Wine } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useAttributeGroups, useAttributeDefinitions } from '@/hooks/useAlcoholAttributes';
import {
  useAlcoholScenarios,
  useAlcoholScenarioCreate,
  useAlcoholScenarioDetail,
  useAlcoholScenarioVersion,
  useAlcoholScenarioSave,
  useAlcoholScenarioPreview,
} from '@/hooks/useAlcoholScenarios';
import { Button } from '@/components/ui/button';
import { TabBar } from '@/components/common/TabBar';
import { CATEGORY_GROUP_LABELS } from '@/types/api';
import type {
  AlcoholScenario,
  ScenarioVersionDetail,
  AlcoholScenarioQuestion,
  ScenarioAnswer,
  ScenarioPreview,
  ScenarioDefinition,
} from '@/types/api/alcohol-scenario.api';
import type { ScenarioCandidates } from '@/types/api/alcohol-attribute.api';
import { ScenarioQuestionEditor } from './ScenarioQuestionEditor';
import { ScenarioQuestionStage } from './ScenarioQuestionStage';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function AttributeScenarioPanel() {
  const groups = useAttributeGroups();
  const [params, setParams] = useSearchParams();
  const selected = groups.data?.find((g) => String(g.id) === params.get('scenarioGroupId'));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold">시나리오 탐색</h2>
          <p className="mt-1 text-sm text-slate-500">
            질문과 분기를 저장하고 답변에 따른 추천 후보를 확인합니다.
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
            onChange={(e) =>
              setParams(
                (previous) => {
                  const next = new URLSearchParams(previous);
                  next.delete('scenarioId');
                  next.delete('scenarioVersionId');
                  if (e.target.value) next.set('scenarioGroupId', e.target.value);
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
            {groups.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {groups.error ? (
        <QueryError message="그룹을 불러오지 못했습니다." retry={() => void groups.refetch()} />
      ) : !selected ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50/60 p-8 text-center">
          <GitBranch className="mb-4 h-9 w-9 text-slate-400" />
          <h3 className="text-base font-semibold">먼저 속성 그룹을 선택하세요</h3>
          <p className="mt-2 text-sm text-slate-500">선택한 그룹의 시나리오를 불러옵니다.</p>
        </div>
      ) : null}
      {groups.data?.map((group) => (
        <div key={group.id} hidden={group.id !== selected?.id}>
          <ScenarioGroup groupId={group.id} active={group.id === selected?.id && !groups.error} />
        </div>
      ))}
    </div>
  );
}

function ScenarioGroup({ groupId, active }: { groupId: number; active: boolean }) {
  const query = useAlcoholScenarios(groupId, active);
  const create = useAlcoholScenarioCreate(groupId);
  const [params, setParams] = useSearchParams();
  const [localId, setLocalId] = useState<number | null>(null);
  const items = [...(query.data ?? [])].sort((a, b) => a.slot - b.slot);
  const requested = active ? Number(params.get('scenarioId')) || localId : localId;
  const current = items.find((s) => s.id === requested) ?? items[0];
  function select(id: number) {
    setLocalId(id);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('scenarioId', String(id));
        next.delete('scenarioVersionId');
        return next;
      },
      { replace: true }
    );
  }
  function add() {
    const slot = [1, 2, 3].find((slot) => !items.some((s) => s.slot === slot));
    if (!slot || create.isPending) return;
    create.mutate(
      { slot, title: `시나리오 ${slot}` },
      { onSuccess: (data) => select(data.scenario.id) }
    );
  }
  if (!active && !query.data) return null;
  if (query.isPending)
    return (
      <p role="status" className="p-8">
        시나리오를 불러오는 중입니다.
      </p>
    );
  if (query.error)
    return (
      <QueryError message="시나리오를 불러오지 못했습니다." retry={() => void query.refetch()} />
    );
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border bg-white px-4 pt-2"
        onKeyDown={(e) => {
          if (
            !(e.target instanceof HTMLElement) ||
            e.target.getAttribute('role') !== 'tab' ||
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
          )
            return;
          e.preventDefault();
          const i = items.findIndex((s) => s.id === current?.id);
          const next =
            items[
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? items.length - 1
                  : (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
            ];
          if (next) {
            select(next.id);
            document.getElementById(`tab-scenario-${groupId}-${next.id}`)?.focus();
          }
        }}
      >
        <TabBar
          ariaLabel="그룹 시나리오"
          tabs={items.map((s) => ({ value: `scenario-${groupId}-${s.id}`, label: s.title }))}
          value={current ? `scenario-${groupId}-${current.id}` : ''}
          onChange={(value) => {
            const s = items.find((s) => value === `scenario-${groupId}-${s.id}`);
            if (s) select(s.id);
          }}
          tools={
            <Button
              size="sm"
              variant="ghost"
              disabled={items.length >= 3 || create.isPending || query.isFetching}
              onClick={() => void add()}
            >
              <Plus className="h-4 w-4" />
              {create.isPending ? '추가 중…' : '시나리오 추가'}
            </Button>
          }
        />
        <p className="py-2 text-xs text-slate-500">
          그룹당 최대 3개 · 저장한 설정은 다시 불러올 수 있습니다.
        </p>
        {create.error && (
          <p role="alert" className="pb-3 text-sm text-red-700">
            {create.error.message}
          </p>
        )}
      </div>
      {!items.length && (
        <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
          아직 등록된 시나리오가 없습니다.
        </p>
      )}
      {items.map((s) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`panel-scenario-${groupId}-${s.id}`}
          aria-labelledby={`tab-scenario-${groupId}-${s.id}`}
          hidden={s.id !== current?.id}
        >
          <ScenarioSession groupId={groupId} scenario={s} active={active && s.id === current?.id} />
        </div>
      ))}
    </div>
  );
}

function ScenarioSession({
  groupId,
  scenario,
  active,
}: {
  groupId: number;
  scenario: AlcoholScenario;
  active: boolean;
}) {
  const detail = useAlcoholScenarioDetail(groupId, scenario.id, active);
  const [params, setParams] = useSearchParams();
  const [localVersion, setLocalVersion] = useState<number | null>(null);
  const versions = detail.data?.versions ?? [];
  const requested = active ? Number(params.get('scenarioVersionId')) || localVersion : localVersion;
  const selected =
    versions.find((v) => v.id === requested) ??
    [...versions].reverse().find((v) => v.status === 'DRAFT') ??
    versions[versions.length - 1];
  if (!active && !detail.data) return null;
  if (detail.isPending)
    return (
      <p role="status" className="p-8">
        시나리오를 불러오는 중입니다.
      </p>
    );
  if (detail.error)
    return (
      <QueryError
        message="시나리오 상세를 불러오지 못했습니다."
        retry={() => void detail.refetch()}
      />
    );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-sm text-slate-500">{scenario.title}</span>
        <label className="flex items-center gap-2 text-sm">
          버전
          <select
            aria-label="시나리오 버전"
            className="rounded-md border bg-white px-3 py-2"
            value={selected?.id ?? ''}
            onChange={(e) => {
              setLocalVersion(Number(e.target.value));
              setParams(
                (previous) => {
                  const next = new URLSearchParams(previous);
                  next.set('scenarioVersionId', e.target.value);
                  return next;
                },
                { replace: true }
              );
            }}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.versionNo} · {v.status === 'DRAFT' ? '초안' : '게시됨'}
              </option>
            ))}
          </select>
        </label>
      </div>
      {versions.map((v) => (
        <ScenarioVersion
          key={v.id}
          groupId={groupId}
          scenarioId={scenario.id}
          versionId={v.id}
          active={active && selected?.id === v.id}
        />
      ))}
      {!versions.length && <p role="alert">저장된 버전이 없습니다.</p>}
    </div>
  );
}

function ScenarioVersion({
  groupId,
  scenarioId,
  versionId,
  active,
}: {
  groupId: number;
  scenarioId: number;
  versionId: number;
  active: boolean;
}) {
  const query = useAlcoholScenarioVersion(groupId, scenarioId, versionId, active);
  if (!active && !query.data) return null;
  return (
    <div hidden={!active}>
      {query.isPending ? (
        <p role="status">질문을 불러오는 중입니다.</p>
      ) : query.error ? (
        <QueryError message="질문을 불러오지 못했습니다." retry={() => void query.refetch()} />
      ) : query.data ? (
        <ScenarioWorkspace
          groupId={groupId}
          scenarioId={scenarioId}
          data={query.data}
          active={active}
        />
      ) : null}
    </div>
  );
}

function ScenarioWorkspace({
  groupId,
  scenarioId,
  data,
  active,
}: {
  groupId: number;
  scenarioId: number;
  data: ScenarioVersionDetail;
  active: boolean;
}) {
  const definitions = useAttributeDefinitions();
  const save = useAlcoholScenarioSave(groupId, scenarioId, data.version.id);
  const [editing, setEditing] = useState(data.definition.questions.length === 0);
  const [snapshot, setSnapshot] = useState(data.definition);
  const [editingRevision, setEditingRevision] = useState(data.version.lockVersion);
  const [input, setInput] = useState<{ answers: ScenarioAnswer[]; changedQuestionId?: number }>({
    answers: [],
  });
  const [width, setWidth] = useState(60);
  const container = useRef<HTMLDivElement>(null);
  const version = data.version;
  const definition = data.definition;
  const attributes = (definitions.data ?? []).filter((a) => a.groupId === groupId);
  const canPreview =
    active && !editing && definition.startQuestionId !== null && definition.questions.length > 0;
  const preview = useAlcoholScenarioPreview(
    groupId,
    scenarioId,
    version.id,
    { expectedLockVersion: version.lockVersion, ...input },
    canPreview
  );
  const result = canPreview ? preview.data?.pages[0]?.data : undefined;
  const answers = result?.answers ?? [];
  const stages = [...definition.stages].sort((a, b) => a.position - b.position);
  const path =
    result?.path ?? (definition.startQuestionId === null ? [] : [definition.startQuestionId]);
  const edges = definition.transitions.map((t) => ({
    id: String(t.id),
    from: String(t.fromQuestionId),
    to: t.targetQuestionId === null ? null : String(t.targetQuestionId),
    label:
      t.predicate.operator === 'ALWAYS'
        ? '그 외 답변'
        : t.predicate.operator === 'EQ'
          ? (definition.questions
              .find((q) => q.id === t.fromQuestionId)
              ?.inputConfig.choices?.find((c) => c.id === t.predicate.value)?.label ?? '')
          : `${t.predicate.value} ${t.predicate.operator === 'GTE' ? '이상' : '이하'}`,
  }));
  function store(next: ScenarioDefinition) {
    save.mutate(
      { expectedLockVersion: editingRevision, definition: next },
      {
        onSuccess: (saved) => {
          setSnapshot(saved.definition);
          setEditingRevision(saved.version.lockVersion);
          setInput({ answers: [] });
          setEditing(false);
        },
      }
    );
  }
  function answer(value: ScenarioAnswer) {
    const index = answers.findIndex((a) => a.questionId === value.questionId);
    const submitted =
      index < 0 ? [...answers, value] : answers.map((a, i) => (i === index ? value : a));
    setInput({ answers: submitted, changedQuestionId: index < 0 ? undefined : value.questionId });
  }
  const resize = (value: number) => setWidth(Math.max(35, Math.min(75, value)));
  if (definitions.isPending) return <p role="status">그룹 속성을 불러오는 중입니다.</p>;
  if (definitions.error)
    return (
      <QueryError
        message="그룹 속성을 불러오지 못했습니다."
        retry={() => void definitions.refetch()}
      />
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
          <div className="flex gap-2">
            {!editing && version.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSnapshot(definition);
                  setEditingRevision(version.lockVersion);
                  save.reset();
                  setEditing(true);
                }}
              >
                질문 설정
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={!input.answers.length || preview.isFetching}
              onClick={() => setInput({ answers: [] })}
            >
              처음부터
            </Button>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          {version.status === 'PUBLISHED' && (
            <p className="mb-4 text-sm text-slate-500">게시된 버전은 읽기 전용입니다.</p>
          )}
          {editing && version.status === 'DRAFT' ? (
            <ScenarioQuestionEditor
              definition={snapshot}
              attributes={attributes}
              onSave={(d) => void store(d)}
              saving={save.isPending}
              error={save.error?.message}
              onCancel={definition.questions.length ? () => setEditing(false) : undefined}
            />
          ) : (
            <>
              <p className="mb-5 text-xs text-slate-500">
                질문에 순서대로 답해주세요. 앞 답변을 바꾸면 이후 답변이 초기화됩니다.
              </p>
              {preview.isError && (
                <QueryError
                  message={`미리보기를 불러오지 못했습니다. ${preview.error.message}`}
                  retry={() => void preview.refetch()}
                />
              )}
              <div className="space-y-5">
                {stages.map((stage) => {
                  const questions = definition.questions
                    .filter((q) => q.stageId === stage.id)
                    .sort((a, b) => a.branchOrder - b.branchOrder)
                    .map((q) => ({ ...q, id: String(q.id), serverId: q.id }));
                  return (
                    <ScenarioQuestionStage
                      key={stage.id}
                      stage={stage.position}
                      questions={questions}
                      edges={edges}
                      selectedId={String(
                        questions.find((q) => path.includes(q.serverId))?.serverId ?? ''
                      )}
                      renderQuestion={(q, label) => (
                        <QuestionCard
                          key={q.serverId}
                          question={{ ...q, id: q.serverId }}
                          label={label}
                          groupId={groupId}
                          scenarioId={scenarioId}
                          versionId={version.id}
                          revision={version.lockVersion}
                          answers={answers}
                          inactiveReason={
                            preview.isFetching
                              ? '답변에 맞는 경로를 확인하고 있습니다.'
                              : !path.includes(q.serverId) &&
                                  (result?.completed ||
                                    stages.some(
                                      (s) =>
                                        s.position >= stage.position &&
                                        definition.questions.some(
                                          (candidate) =>
                                            candidate.stageId === s.id &&
                                            path.includes(candidate.id)
                                        )
                                    ))
                                ? '현재 답변에 따라 건너뛴 질문입니다.'
                                : '앞 질문에 답하면 진행할 수 있습니다.'
                          }
                          active={
                            canPreview &&
                            path.includes(q.serverId) &&
                            !!result &&
                            !preview.isFetching
                          }
                          onAnswer={answer}
                        />
                      )}
                    />
                  );
                })}
              </div>
              {result?.completed && (
                <p role="status" className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  시나리오가 완료되었습니다.
                </p>
              )}
              {!definition.questions.length && (
                <p className="p-8 text-center text-sm text-slate-500">
                  아직 설정한 속성과 질문이 없습니다.
                </p>
              )}
            </>
          )}
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
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            resize(
              e.key === 'Home'
                ? 35
                : e.key === 'End'
                  ? 75
                  : width + (e.key === 'ArrowLeft' ? -5 : 5)
            );
          }
        }}
        onPointerDown={(e) => {
          if (e.button === 0) {
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
          }
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const rect = container.current?.getBoundingClientRect();
          if (rect) resize(((e.clientX - rect.left) / rect.width) * 100);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
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
          {result && (
            <span
              role="status"
              className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
            >
              후보 {result.candidates.totalCount}개
            </span>
          )}
        </header>
        <div className="p-4 sm:p-5">
          {!canPreview ? (
            <p className="py-8 text-center text-sm text-slate-500">
              질문을 저장하면 추천 후보를 조회합니다.
            </p>
          ) : (
            <>
              {preview.isPending && <p role="status">추천 후보를 불러오는 중입니다.</p>}
              {preview.isError && (
                <div role="alert" className="mb-4 text-sm">
                  <p>
                    {preview.isFetchNextPageError
                      ? '추가 후보를 불러오지 못했습니다.'
                      : '추천 후보를 불러오지 못했습니다.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void (preview.isFetchNextPageError
                        ? preview.fetchNextPage()
                        : preview.refetch())
                    }
                  >
                    후보 다시 조회
                  </Button>
                </div>
              )}
              {result && (
                <CandidateList
                  pages={preview.data?.pages.map((p) => p.data.candidates) ?? []}
                  contributions={result.contributions}
                  questions={definition.questions}
                  answers={answers}
                />
              )}
              {preview.hasNextPage && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={preview.isFetching}
                  onClick={() => void preview.fetchNextPage()}
                >
                  {preview.isFetchingNextPage ? '추가 후보를 불러오는 중…' : '25개 더 보기'}
                </Button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function QuestionCard({
  question,
  label,
  groupId,
  scenarioId,
  versionId,
  revision,
  answers,
  active,
  inactiveReason,
  onAnswer,
}: {
  question: AlcoholScenarioQuestion;
  label: string;
  groupId: number;
  scenarioId: number;
  versionId: number;
  revision: number;
  answers: ScenarioAnswer[];
  active: boolean;
  inactiveReason: string;
  onAnswer: (answer: ScenarioAnswer) => void;
}) {
  // 뒤 질문의 답변이 바뀌어도 앞 질문의 선택지를 다시 조회하지 않는다.
  const answerIndex = answers.findIndex((a) => a.questionId === question.id);
  const precedingAnswers = answerIndex < 0 ? answers : answers.slice(0, answerIndex);
  const query = useAlcoholScenarioPreview(
    groupId,
    scenarioId,
    versionId,
    { expectedLockVersion: revision, answers: precedingAnswers, viewQuestionId: question.id },
    active
  );
  const current = answers.find((a) => a.questionId === question.id);
  const page = query.data?.pages[0]?.data;
  const facets = page?.candidates.facets;
  const disabled = !active || query.isPending;
  return (
    <fieldset
      disabled={disabled}
      className={`min-w-0 rounded-xl border bg-white p-4 sm:p-5 ${!active ? 'opacity-50' : ''}`}
    >
      <legend className="px-2 text-xs font-medium text-blue-700">질문 {label}</legend>
      <h4 className="mb-2 text-base font-semibold">{question.title}</h4>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        {question.sourceKind === 'ATTRIBUTE'
          ? '선택한 속성 그룹의 연결 값으로 찾습니다.'
          : question.sourceKind === 'TASTING_GROUP'
            ? '향 그룹의 대표 태그가 있는 위스키를 찾습니다.'
            : question.sourceKind === 'ABV'
              ? '설정한 도수 범위로 찾습니다.'
              : '위스키에 등록된 종류로 찾습니다.'}
      </p>
      {!active ? (
        <p className="text-xs text-slate-500">{inactiveReason}</p>
      ) : query.isPending ? (
        <p role="status" className="text-xs">
          선택지를 불러오는 중입니다.
        </p>
      ) : query.isError ? (
        <div role="alert">
          <p className="text-sm">선택지를 불러오지 못했습니다. {query.error.message}</p>
          <Button
            type="button"
            variant="outline"
            disabled={false}
            onClick={() => void query.refetch()}
          >
            선택지 다시 조회
          </Button>
        </div>
      ) : (
        <>
          {question.inputKind === 'NUMBER_RANGE' ? (
            <RangeAnswer
              key={`${question.id}:${JSON.stringify(current)}`}
              question={question}
              applied={current?.kind === 'NUMBER_RANGE' ? current : undefined}
              onAnswer={onAnswer}
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.inputConfig.choices?.map((choice) => {
                const option = facets?.options.find((o) => o.value === String(choice.value));
                const count = option?.count ?? (facets?.hasMoreOptions ? null : 0);
                const selected = current?.kind === 'CHOICE' && current.choiceId === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${choice.label} · ${count === null ? '집계 없음' : `${count}개`}`}
                    disabled={count === 0}
                    className={`flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm disabled:cursor-not-allowed disabled:text-slate-400 ${selected ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500' : 'bg-white hover:border-blue-300'}`}
                    onClick={() =>
                      onAnswer({ questionId: question.id, kind: 'CHOICE', choiceId: choice.id })
                    }
                  >
                    <span className="min-w-0 break-words">{choice.label}</span>
                    <span className="shrink-0 text-xs tabular-nums">
                      {count === null ? '—' : `${count}개`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {question.inputConfig.allowAny && (
            <Button
              type="button"
              size="sm"
              variant={current?.kind === 'ANY' ? 'default' : 'outline'}
              className="mt-3"
              aria-pressed={current?.kind === 'ANY'}
              onClick={() => onAnswer({ questionId: question.id, kind: 'ANY' })}
            >
              상관없어요
            </Button>
          )}
        </>
      )}
    </fieldset>
  );
}

function RangeAnswer({
  question,
  applied,
  onAnswer,
}: {
  question: AlcoholScenarioQuestion;
  applied?: Extract<ScenarioAnswer, { kind: 'NUMBER_RANGE' }>;
  onAnswer: (answer: ScenarioAnswer) => void;
}) {
  const config = question.inputConfig;
  const schema = z.object({ min: z.string().min(1), max: z.string().min(1) }).refine(
    ({ min, max }) => {
      const lo = Number(min),
        hi = Number(max),
        step = config.step;
      const aligned = (n: number) =>
        !!step &&
        Math.abs((n - (config.min ?? 0)) / step - Math.round((n - (config.min ?? 0)) / step)) <
          1e-7;
      return (
        Number.isFinite(lo) &&
        Number.isFinite(hi) &&
        lo <= hi &&
        lo >= (config.min ?? -Infinity) &&
        hi <= (config.max ?? Infinity) &&
        aligned(lo) &&
        aligned(hi)
      );
    },
    { message: '설정한 범위와 간격을 확인하세요.' }
  );
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<{ min: string; max: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      min: String(applied?.min ?? config.min ?? ''),
      max: String(applied?.max ?? config.max ?? ''),
    },
  });
  const range = useWatch({ control });
  return (
    <form
      aria-label={`${question.title} 범위`}
      className="space-y-3"
      onSubmit={handleSubmit(({ min, max }) =>
        onAnswer({
          questionId: question.id,
          kind: 'NUMBER_RANGE',
          min: Number(min),
          max: Number(max),
        })
      )}
    >
      <p className="text-xs text-slate-500">
        {config.min}~{config.max}
        {config.unit} · {config.step}
        {config.unit} 간격
      </p>
      {config.min != null &&
        config.max != null &&
        config.step != null &&
        config.min < config.max && (
          <div className="scenario-price-range relative mx-3 h-9">
            <div className="absolute inset-x-0 top-4 h-1 rounded bg-slate-200" />
            <input
              type="range"
              aria-label={`${question.title} 최솟값 조절`}
              min={config.min}
              max={config.max}
              step={config.step}
              value={Number(range.min) || config.min}
              style={{ zIndex: Number(range.min) >= config.max ? 4 : 2 }}
              onChange={(event) =>
                setValue('min', String(Math.min(Number(event.target.value), Number(range.max))), {
                  shouldDirty: true,
                })
              }
            />
            <input
              type="range"
              aria-label={`${question.title} 최댓값 조절`}
              min={config.min}
              max={config.max}
              step={config.step}
              value={range.max === '' ? config.max : Number(range.max)}
              style={{ zIndex: 3 }}
              onChange={(event) =>
                setValue('max', String(Math.max(Number(event.target.value), Number(range.min))), {
                  shouldDirty: true,
                })
              }
            />
          </div>
        )}
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 text-xs">
          최솟값
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            step={config.step ?? 'any'}
            min={config.min ?? undefined}
            max={config.max ?? undefined}
            aria-label={`${question.title} 최솟값`}
            {...register('min')}
          />
        </label>
        <label className="min-w-0 text-xs">
          최댓값
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            step={config.step ?? 'any'}
            min={config.min ?? undefined}
            max={config.max ?? undefined}
            aria-label={`${question.title} 최댓값`}
            {...register('max')}
          />
        </label>
      </div>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-red-700">
          설정한 범위와 간격에 맞는 숫자를 입력하세요.
        </p>
      )}
      <Button type="submit" size="sm">
        범위 적용
      </Button>
    </form>
  );
}

function CandidateList({
  pages,
  contributions,
  questions,
  answers,
}: {
  pages: ScenarioCandidates[];
  contributions: ScenarioPreview['contributions'];
  questions: AlcoholScenarioQuestion[];
  answers: ScenarioAnswer[];
}) {
  const first = pages[0];
  const items = [
    ...new Map(pages.flatMap((p) => p.items).map((row) => [row.alcoholId, row])).values(),
  ];
  return (
    <>
      {answers.some((a) => a.kind !== 'ANY') && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs">
          <p className="mb-2 font-medium">적용한 답변</p>
          <ul className="space-y-1 text-slate-600">
            {answers
              .filter((a) => a.kind !== 'ANY')
              .map((a) => {
                const q = questions.find((q) => q.id === a.questionId);
                if (!q) return null;
                const value =
                  a.kind === 'CHOICE'
                    ? q.inputConfig.choices?.find((c) => c.id === a.choiceId)?.label
                    : a.kind === 'NUMBER_RANGE'
                      ? `${a.min.toLocaleString('ko-KR')} ~ ${a.max.toLocaleString('ko-KR')}${q.inputConfig.unit ?? ''}`
                      : '';
                return (
                  <li key={a.questionId}>
                    {q.title}: {value}
                  </li>
                );
              })}
          </ul>
          <p className="mt-2 text-slate-500">
            모든 답변을 함께 적용합니다. 같은 속성의 범위도 함께 적용합니다.
          </p>
        </div>
      )}
      {first?.totalCount === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          <p>조건에 맞는 위스키가 없습니다.</p>
          <p className="mt-2">
            가격·도수 범위를 넓히거나 앞 질문의 답변을 바꿔보세요. ‘상관없어요’를 선택하면 해당
            조건을 제외할 수 있습니다.
          </p>
        </div>
      ) : (
        <p className="mb-4 text-xs text-slate-500">
          전체 {first?.totalCount}개 중 {items.length}개 표시
        </p>
      )}
      <ul className="divide-y">
        {items.map((row) => (
          <li key={row.alcoholId} className="py-3 first:pt-0">
            <p className="break-words text-sm font-semibold">
              {row.korName || row.engName || `위스키 #${row.alcoholId}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {CATEGORY_GROUP_LABELS[row.categoryGroup] ?? row.korCategory}
              {row.abv !== null ? ` · ${row.abv}%` : row.abvRaw ? ` · ${row.abvRaw}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {row.attributes.flatMap((a) => {
                const conditions = contributions.filter(
                  (c) => c.source === 'ATTRIBUTE' && c.attributeId === a.attributeId
                );
                if (!conditions.length) return [];
                const equalities = conditions.filter((c) => c.operator === 'EQ');
                const ranges = conditions.filter(
                  (c) => c.operator === 'GTE' || c.operator === 'LTE'
                );
                const definition = first?.attributeDefinitions.find(
                  (d) => d.attributeId === a.attributeId
                );
                return a.values
                  .filter(
                    (value) =>
                      (!equalities.length || equalities.some((c) => c.value === value)) &&
                      ranges.every((c) =>
                        c.operator === 'GTE'
                          ? Number(value) >= Number(c.value)
                          : Number(value) <= Number(c.value)
                      )
                  )
                  .map((value) => (
                    <span
                      key={`${a.attributeId}:${value}`}
                      className="max-w-full break-words rounded bg-blue-50 px-2 py-1 text-xs text-blue-800"
                    >
                      {definition?.displayName ?? `속성 #${a.attributeId}`}:{' '}
                      {definition?.unit && Number.isFinite(Number(value))
                        ? Number(value).toLocaleString('ko-KR')
                        : value}
                      {definition?.unit ?? ''}
                    </span>
                  ));
              })}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
function QueryError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border bg-white p-6 text-sm">
      <p>{message}</p>
      <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
        다시 조회
      </Button>
    </div>
  );
}
