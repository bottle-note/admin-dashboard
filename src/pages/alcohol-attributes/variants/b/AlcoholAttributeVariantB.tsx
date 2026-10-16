import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Info,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { TabBar } from '@/components/common/TabBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  categories,
  definitionValue,
  initialAttributes,
  initialMappings,
  whiskies,
  type Attribute,
  type Mapping,
} from './catalog';
import { DefinitionEditor } from './DefinitionEditor';
import { LinkingWizard } from './LinkingWizard';

const tabs = [
  { value: 'attributes', label: '속성관리' },
  { value: 'mappings', label: '속성 연결' },
] as const;

export function AlcoholAttributeVariantB() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'mappings' ? 'mappings' : 'attributes';
  const category = params.get('category') ?? 'ALL';
  const query = params.get('q') ?? '';
  const [attributes, setAttributes] = useState(initialAttributes);
  const [mappings, setMappings] = useState(initialMappings);
  const [selectedId, setSelectedId] = useState(101);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [danger, setDanger] = useState<
    { kind: 'attribute'; attribute: Attribute } | { kind: 'mapping'; mapping: Mapping } | null
  >(null);
  const selected = attributes.find((item) => item.id === selectedId);
  const connected = mappings.filter((item) => item.attributeId === selectedId);
  const count = (id: number) => mappings.filter((item) => item.attributeId === id).length;
  const filtered = attributes.filter(
    (item) =>
      (category === 'ALL' || item.type === category) &&
      `${item.displayName} ${item.key}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  function updateParam(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  }

  function save(value: Attribute) {
    setAttributes((current) =>
      current.some((item) => item.id === value.id)
        ? current.map((item) => (item.id === value.id ? value : item))
        : [...current, value]
    );
    setSelectedId(value.id);
    setEditing(false);
    setCreating(false);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('q');
        next.delete('category');
        return next;
      },
      { replace: true }
    );
    setNotice(`‘${value.displayName}’ 정의를 모의 데이터에 저장했습니다.`);
  }

  function applyLinks(attributeId: number, alcoholIds: number[]) {
    setMappings((current) => {
      const fresh = [...new Set(alcoholIds)].filter(
        (id) => !current.some((item) => item.alcoholId === id && item.attributeId === attributeId)
      );
      const nextId = Math.max(1000, ...current.map((item) => item.id)) + 1;
      return [
        ...current,
        ...fresh.map((alcoholId, index) => ({ id: nextId + index, alcoholId, attributeId })),
      ];
    });
    setNotice('선택한 위스키의 연결을 모의 데이터에 적용했습니다.');
  }

  function remove() {
    if (danger?.kind === 'attribute') {
      const id = danger.attribute.id;
      setAttributes((current) => current.filter((item) => item.id !== id));
      setMappings((current) => current.filter((item) => item.attributeId !== id));
      setSelectedId(attributes.find((item) => item.id !== id)?.id ?? 0);
      setNotice('속성과 관련 연결을 모의 데이터에서 삭제했습니다.');
    } else if (danger?.kind === 'mapping') {
      setMappings((current) => current.filter((item) => item.id !== danger.mapping.id));
      setNotice('연결을 해제했습니다. 공통 사전의 속성은 유지됩니다.');
    }
    setDanger(null);
  }

  function openLinks() {
    setEditing(false);
    updateParam('tab', 'mappings');
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2 font-medium text-blue-700">
          <BookOpen className="h-4 w-4" />B · 속성 사전
        </span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-800">
          디자인 시안 · 모의 데이터 · 새로고침 시 초기화
        </span>
      </div>
      <PageHeader
        title="하나의 이름, 같은 의미"
        description="위스키를 설명하는 공통 언어를 정의하고, 같은 기준으로 연결합니다."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />새 속성
          </Button>
        }
      />
      <TabBar
        tabs={tabs}
        value={tab}
        onChange={(value) => updateParam('tab', value)}
        ariaLabel="속성 사전 작업"
        tools={
          <span className="text-xs text-muted-foreground">
            사전 {attributes.length}개 · 연결 {mappings.length}건
          </span>
        }
      />
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto shrink-0"
            onClick={() => setNotice('')}
          >
            닫기
          </Button>
        </div>
      )}
      {tab === 'attributes' ? (
        <section
          id="panel-attributes"
          role="tabpanel"
          aria-labelledby="tab-attributes"
          className="grid gap-5 xl:grid-cols-[164px_minmax(240px,0.85fr)_minmax(340px,1.15fr)]"
        >
          <nav aria-label="속성 분류" className="space-y-5">
            <div>
              <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground">
                사전 분류
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-1">
                <button
                  className={`flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm focus-visible:ring-2 focus-visible:ring-blue-600 ${category === 'ALL' ? 'bg-slate-900 font-semibold text-white' : 'hover:bg-muted'}`}
                  onClick={() => updateParam('category', 'ALL')}
                  aria-pressed={category === 'ALL'}
                >
                  <span>전체 속성</span>
                  <span className="text-xs opacity-70">{attributes.length}</span>
                </button>
                {categories.map((item) => (
                  <button
                    key={item.value}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-sm focus-visible:ring-2 focus-visible:ring-blue-600 ${category === item.value ? 'bg-slate-900 font-semibold text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    aria-pressed={category === item.value}
                    onClick={() => updateParam('category', item.value)}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs opacity-70">
                      {attributes.filter((attribute) => attribute.type === item.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden rounded-lg bg-slate-100 p-4 xl:block">
              <BookOpen className="h-5 w-5 text-slate-500" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800">정의가 먼저입니다</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                표시명은 짧고 명확하게,
                <br />
                사용 기준은 구체적으로.
                <br />
                함께 쓰는 의미를 관리하세요.
              </p>
            </div>
          </nav>
          <div className="min-w-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="속성 검색"
                placeholder="표시명 또는 고유 키 검색"
                className="h-10 bg-background pl-9"
                value={query}
                onChange={(event) => updateParam('q', event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>
                {category === 'ALL'
                  ? '전체 속성'
                  : categories.find((item) => item.value === category)?.label}{' '}
                {filtered.length}개
              </span>
              <span>이름과 정의로 탐색</span>
            </div>
            <div className="space-y-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selectedId === item.id ? 'border-blue-400 bg-blue-50/80 shadow-sm' : 'bg-card hover:border-blue-200 hover:bg-muted/20'}`}
                  aria-pressed={selectedId === item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setEditing(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs ${selectedId === item.id ? 'text-blue-700' : 'text-muted-foreground'}`}
                    >
                      {categories.find((category) => category.value === item.type)?.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Link2 className="h-3 w-3" />
                      {count(item.id)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{item.displayName}</h3>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${selectedId === item.id ? 'text-blue-600' : 'text-muted-foreground/50'}`}
                    />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.description || '사용 기준을 작성해 주세요.'}
                  </p>
                </button>
              ))}
            </div>
            {!filtered.length && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <FolderOpen className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-sm">조건에 맞는 속성이 없습니다.</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateParam('q', '');
                    updateParam('category', 'ALL');
                  }}
                >
                  전체 속성 보기
                </Button>
              </div>
            )}
          </div>
          <article className="min-w-0 self-start rounded-xl border bg-card shadow-sm">
            {selected ? (
              editing ? (
                <div className="p-6">
                  <DefinitionEditor
                    key={selected.id}
                    attribute={selected}
                    attributes={attributes}
                    connectionCount={count}
                    onSave={save}
                    onCancel={() => setEditing(false)}
                  />
                </div>
              ) : (
                <>
                  <div className="border-b p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {categories.find((item) => item.value === selected.type)?.label}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                        <Pencil />
                        정의 편집
                      </Button>
                    </div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                      {selected.displayName}
                    </h2>
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                      {selected.key}
                    </p>
                    <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {selected.description || '사용 기준이 작성되지 않았습니다.'}
                    </p>
                  </div>
                  <div className="space-y-6 p-6 sm:p-7">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground">
                        정의된 값과 조건
                      </h3>
                      <div className="mt-3 rounded-xl bg-slate-50 p-5">
                        <p className="break-words text-xl font-semibold text-slate-900">
                          {definitionValue(selected)}
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
                          <div>
                            <dt className="text-slate-500">값 형식</dt>
                            <dd className="mt-1 text-slate-800">
                              {selected.datatype === 'STRING'
                                ? '문자열'
                                : selected.datatype === 'INT'
                                  ? '정수'
                                  : '소수'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">비교 조건</dt>
                            <dd className="mt-1 text-slate-800">
                              {selected.operator === 'EQ' ? '같음' : '이상'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">
                          같은 정의를 공유하는 위스키{' '}
                          <span className="ml-1 text-blue-700">{connected.length}</span>
                        </h3>
                        <Button variant="ghost" size="sm" onClick={openLinks}>
                          연결 관리
                          <ArrowRight />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {connected.map((mapping) => (
                          <span
                            key={mapping.id}
                            className="rounded-md border px-2.5 py-1.5 text-xs"
                          >
                            {whiskies.find((item) => item.id === mapping.alcoholId)?.name}
                          </span>
                        ))}
                      </div>
                      {!connected.length && (
                        <p className="mt-3 text-xs leading-6 text-muted-foreground">
                          아직 연결된 위스키가 없습니다. 정의를 준비한 뒤 연결할 수 있습니다.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        정의를 바꾸면 연결된 위스키 모두에 반영됩니다. 연결은 유지되므로 새 기준에도
                        맞는지 확인하세요.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-600"
                        onClick={() => setDanger({ kind: 'attribute', attribute: selected })}
                      >
                        <Trash2 />
                        속성 삭제
                      </Button>
                    </div>
                  </div>
                </>
              )
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                새 속성을 등록하면 이곳에서 정의를 확인할 수 있습니다.
              </div>
            )}
          </article>
        </section>
      ) : (
        <section id="panel-mappings" role="tabpanel" aria-labelledby="tab-mappings">
          <LinkingWizard
            attributes={attributes}
            mappings={mappings}
            initialAttributeId={selectedId}
            onApply={applyLinks}
            onUnlink={(mapping) => setDanger({ kind: 'mapping', mapping })}
          />
        </section>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>공통 사전에 속성 추가</DialogTitle>
          <DialogDescription>
            이름과 사용 기준을 먼저 정의하세요. 위스키 연결은 나중에 할 수 있습니다.
          </DialogDescription>
          <DefinitionEditor
            attributes={attributes}
            connectionCount={count}
            onSave={save}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!danger}
        onOpenChange={(open) => {
          if (!open) setDanger(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {danger?.kind === 'attribute'
              ? '속성과 전체 연결을 삭제할까요?'
              : '이 위스키의 연결을 해제할까요?'}
          </DialogTitle>
          <DialogDescription>
            {danger?.kind === 'attribute'
              ? `‘${danger.attribute.displayName}’과 연결 ${count(danger.attribute.id)}건을 함께 삭제합니다. 다른 위스키에서도 이 속성이 사라집니다.`
              : danger?.kind === 'mapping'
                ? `‘${whiskies.find((item) => item.id === danger.mapping.alcoholId)?.name}’의 연결만 해제합니다. 공통 사전의 속성과 다른 위스키의 연결은 유지됩니다.`
                : ''}
          </DialogDescription>
          <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            디자인 시안에서는 모의 데이터에만 반영됩니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDanger(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={remove}>
              {danger?.kind === 'attribute' ? '속성과 연결 삭제' : '연결 해제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
