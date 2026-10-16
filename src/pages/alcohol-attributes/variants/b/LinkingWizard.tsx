import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Link2, Search, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categories, definitionValue, whiskies, type Attribute, type Mapping } from './catalog';

export function LinkingWizard({
  attributes,
  mappings,
  initialAttributeId,
  onApply,
  onUnlink,
}: {
  attributes: Attribute[];
  mappings: Mapping[];
  initialAttributeId: number;
  onApply: (attributeId: number, alcoholIds: number[]) => void;
  onUnlink: (mapping: Mapping) => void;
}) {
  const [step, setStep] = useState(1);
  const [attributeId, setAttributeId] = useState(initialAttributeId);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const attribute = attributes.find((item) => item.id === attributeId);
  const existing = mappings.filter((item) => item.attributeId === attributeId);
  const filtered = whiskies.filter((item) =>
    `${item.name} ${item.english} ${item.region}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  const available = filtered.filter(
    (item) => !existing.some((mapping) => mapping.alcoholId === item.id)
  );
  const selectedWhiskies = whiskies.filter((item) => selected.includes(item.id));

  function changeAttribute(id: number) {
    setAttributeId(id);
    setSelected([]);
    setComplete(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
      <div className="min-w-0 rounded-xl border bg-card">
        <ol
          aria-label="속성 연결 단계"
          className="grid grid-cols-3 border-b bg-muted/30 p-4 sm:p-6"
        >
          {['속성 선택', '위스키 선택', '검토 후 적용'].map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? 'step' : undefined}
              className={`flex items-center gap-2 text-xs sm:text-sm ${step === index + 1 ? 'font-semibold text-blue-700' : 'text-muted-foreground'}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step === index + 1 ? 'bg-blue-700 text-white' : 'border bg-background'}`}
              >
                {step > index + 1 ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <div className="space-y-6 p-5 sm:p-7">
          {complete ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="mt-4 text-xl font-semibold">연결을 적용했습니다</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selected.length}개 위스키에 ‘{attribute?.displayName}’을 연결했습니다.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">모의 데이터에만 반영됩니다.</p>
              <Button
                className="mt-6"
                onClick={() => {
                  setComplete(false);
                  setSelected([]);
                  setStep(1);
                }}
              >
                다른 속성 연결하기
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-xl font-semibold">
                  {step === 1
                    ? '어떤 의미를 연결할까요?'
                    : step === 2
                      ? '이 정의에 맞는 위스키를 고르세요'
                      : '선택한 연결을 확인하세요'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step === 1
                    ? '공통 사전에서 속성 하나를 선택합니다. 값과 사용 기준을 먼저 확인하세요.'
                    : step === 2
                      ? '연결 여부는 운영자가 판단합니다. 가격이나 조건으로 자동 선택하지 않습니다.'
                      : '아래 위스키에 같은 속성 정의를 적용합니다. 검토가 끝나면 연결하세요.'}
                </p>
              </div>
              {step === 1 && (
                <>
                  <label className="block space-y-2 text-sm font-medium">
                    연결할 속성
                    <select
                      className="h-11 w-full rounded-md border bg-background px-3 focus-visible:ring-2 focus-visible:ring-blue-600"
                      value={attributeId}
                      onChange={(event) => changeAttribute(Number(event.target.value))}
                    >
                      {attributes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.displayName} ·{' '}
                          {categories.find((category) => category.value === item.type)?.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {attribute ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-6">
                      <p className="text-xs font-medium tracking-wide text-blue-700">
                        연결 기준이 되는 정의
                      </p>
                      <h4 className="mt-3 text-2xl font-semibold">{attribute.displayName}</h4>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {attribute.description ||
                          '사용 기준이 작성되지 않았습니다. 정의를 확인하고 연결하세요.'}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-md border bg-white px-3 py-1.5 font-mono text-xs text-blue-800">
                          {definitionValue(attribute)}
                        </span>
                        <span className="rounded-md border bg-white px-3 py-1.5 text-xs text-slate-600">
                          현재 {existing.length}개 연결
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-muted p-5 text-sm">
                      속성관리 탭에서 속성을 먼저 등록하세요.
                    </p>
                  )}
                </>
              )}
              {step === 2 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      aria-label="위스키 검색"
                      className="h-10 pl-10"
                      placeholder="위스키 이름 또는 지역으로 검색"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p>
                      검색 결과 {filtered.length}개{' '}
                      <span className="ml-2 font-semibold text-blue-700">
                        선택 {selected.length}개
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!available.length}
                      onClick={() =>
                        setSelected((current) => [
                          ...new Set([...current, ...available.map((item) => item.id)]),
                        ])
                      }
                    >
                      검색 결과 모두 선택
                    </Button>
                  </div>
                  <div className="divide-y rounded-lg border">
                    {filtered.map((item) => {
                      const linked = existing.some((mapping) => mapping.alcoholId === item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-4 px-4 py-4 ${linked ? 'bg-muted/40 text-muted-foreground' : selected.includes(item.id) ? 'bg-blue-50/70' : 'hover:bg-muted/30'}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-700"
                            aria-label={`${item.name} 선택`}
                            checked={linked || selected.includes(item.id)}
                            disabled={linked}
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id)
                              )
                            }
                          />
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background font-mono text-xs text-slate-500">
                            {item.initials}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{item.name}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {item.region} · {item.category} · {item.abv}
                            </span>
                          </span>
                          {linked && <span className="text-xs">이미 연결됨</span>}
                        </label>
                      );
                    })}
                    {!filtered.length && (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        검색 결과가 없습니다. 다른 위스키 이름으로 검색하세요.
                      </p>
                    )}
                  </div>
                </>
              )}
              {step === 3 && attribute && (
                <>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 p-4 text-blue-900">
                    <Link2 className="h-5 w-5" />
                    <strong>{attribute.displayName}</strong>
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm">새 위스키 {selected.length}개</span>
                  </div>
                  <div className="divide-y rounded-lg border">
                    {selectedWhiskies.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.english}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                          새 연결
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    기존 연결 {existing.length}개는 그대로 유지합니다. 위스키마다 다른 값이나 조건을
                    입력하지 않으며 공통 정의를 함께 사용합니다.
                  </p>
                </>
              )}
              <div className="flex items-center justify-between gap-3 border-t pt-5">
                <Button
                  variant="ghost"
                  disabled={step === 1}
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ArrowLeft />
                  이전
                </Button>
                {step < 3 ? (
                  <Button
                    disabled={!attribute || (step === 2 && !selected.length)}
                    onClick={() => setStep((current) => current + 1)}
                  >
                    {step === 1 ? '위스키 선택하기' : `${selected.length}개 연결 검토`}
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button
                    disabled={!selected.length || !attribute}
                    onClick={() => {
                      onApply(attributeId, selected);
                      setComplete(true);
                    }}
                  >
                    <Link2 />
                    {selected.length}개 연결 적용
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <aside className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold">현재 연결된 위스키</h3>
            <span className="ml-auto text-sm text-muted-foreground">{existing.length}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {attribute?.displayName ?? '속성 선택 필요'}의 연결 현황입니다.
          </p>
          <div className="mt-4 divide-y">
            {existing.map((mapping) => (
              <div key={mapping.id} className="flex items-center justify-between gap-2 py-3">
                <span className="text-xs font-medium">
                  {whiskies.find((item) => item.id === mapping.alcoholId)?.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                  aria-label={`${whiskies.find((item) => item.id === mapping.alcoholId)?.name} 연결 해제`}
                  onClick={() => onUnlink(mapping)}
                >
                  <Unlink />
                </Button>
              </div>
            ))}
          </div>
          {!existing.length && (
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              아직 연결된 위스키가 없습니다. 왼쪽에서 첫 연결을 만들어 보세요.
            </p>
          )}
        </div>
        <div className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-800">연결 전 확인하세요</h3>
          <ul className="mt-3 list-disc space-y-3 pl-4 text-xs leading-6">
            <li>속성의 설명과 사용 기준에 맞는 위스키를 선택하세요.</li>
            <li>이미 연결된 위스키는 중복 등록하지 않습니다.</li>
            <li>연결을 해제해도 사전의 속성은 유지됩니다.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
