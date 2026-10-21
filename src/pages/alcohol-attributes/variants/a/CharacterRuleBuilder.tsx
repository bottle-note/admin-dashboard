import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildInputPattern,
  characterGroups,
  defaultInputRule,
  inputRuleError,
  parseInputPattern,
  type InputRule,
} from './string-input-rules';

export function CharacterRuleBuilder({
  pattern,
  onChange,
  onError,
}: {
  pattern: string;
  onChange: (pattern: string) => void;
  onError: (error: string) => void;
}) {
  const [rule, setRule] = useState<InputRule>(() => parseInputPattern(pattern) ?? defaultInputRule);
  const [min, setMin] = useState(String(rule.min));
  const [max, setMax] = useState(String(rule.max));
  const [enabled, setEnabled] = useState(Boolean(pattern && parseInputPattern(pattern)));
  const [custom, setCustom] = useState(Boolean(pattern && !parseInputPattern(pattern)));
  const [sample, setSample] = useState('');
  const [error, setError] = useState('');
  const update = (next: InputRule) => {
    setRule(next);
    const message = inputRuleError(next) ?? '';
    setError(message);
    onError(message);
    if (!message) onChange(buildInputPattern(next));
  };
  const enable = () => {
    setCustom(false);
    setEnabled(true);
    update(rule);
  };
  const clear = () => {
    setEnabled(false);
    setCustom(false);
    setError('');
    onError('');
    onChange('');
  };
  const sampleValid =
    enabled &&
    !error &&
    sample.trim() &&
    new RegExp(`^(?:${buildInputPattern(rule)})$`).test(sample.trim());
  return (
    <section aria-label="허용 문자 조합" className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">허용 문자와 길이</h3>
        {(enabled || custom) && (
          <Button type="button" variant="ghost" onClick={clear}>
            제한 해제
          </Button>
        )}
      </div>
      {custom ? (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-medium">기존 맞춤 형식 유지</p>
          <p className="text-xs text-slate-500">
            현재 규칙은 그대로 저장됩니다. 조합으로 바꾸면 기존 형식을 교체합니다.
          </p>
          <Button type="button" variant="outline" onClick={enable}>
            문자 조합으로 바꾸기
          </Button>
        </div>
      ) : !enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">문자 종류 제한 없이 입력할 수 있어요.</p>
          <Button type="button" variant="outline" onClick={enable}>
            허용 문자 설정
          </Button>
        </div>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">사용할 문자</legend>
            <div className="grid grid-cols-2 gap-2">
              {characterGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    aria-label={group.label}
                    checked={rule.characters.includes(group.id)}
                    className="h-4 !min-h-0 w-4 shrink-0 accent-blue-600"
                    onChange={(event) => {
                      const characters = event.target.checked
                        ? [...rule.characters, group.id]
                        : rule.characters.filter((item) => item !== group.id);
                      update({
                        ...rule,
                        characters,
                        first:
                          rule.first !== 'any' && !characters.includes(rule.first)
                            ? 'any'
                            : rule.first,
                      });
                    }}
                  />
                  <span className="min-w-0 text-xs">
                    {group.label}
                    <span className="ml-1 text-slate-400">{group.sample}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-1 text-sm font-medium">
            첫 글자
            <select
              aria-label="첫 글자"
              className="h-10 w-full rounded-lg border bg-white px-3 font-normal"
              value={rule.first}
              onChange={(event) =>
                update({ ...rule, first: event.target.value as InputRule['first'] })
              }
            >
              <option value="any">선택한 문자 모두 허용</option>
              {characterGroups
                .filter((group) => group.id !== 'space' && rule.characters.includes(group.id))
                .map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}로 시작
                  </option>
                ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-medium">
              최소 글자 수
              <Input
                aria-label="최소 글자 수"
                type="number"
                min={1}
                max={255}
                value={min}
                onChange={(event) => {
                  setMin(event.target.value);
                  update({ ...rule, min: Number(event.target.value) });
                }}
              />
            </label>
            <label className="space-y-1 text-xs font-medium">
              최대 글자 수
              <Input
                aria-label="최대 글자 수"
                type="number"
                min={1}
                max={255}
                value={max}
                onChange={(event) => {
                  setMax(event.target.value);
                  update({ ...rule, max: Number(event.target.value) });
                }}
              />
            </label>
          </div>
          {error && (
            <p role="status" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <label className="block space-y-1 text-xs font-medium">
              입력해 보기
              <Input
                aria-label="입력해 보기"
                value={sample}
                onChange={(event) => setSample(event.target.value)}
                placeholder="예: tasting_note_01"
                maxLength={256}
              />
            </label>
            <p
              aria-live="polite"
              className={`text-xs ${!sample || error ? 'text-slate-500' : sampleValid ? 'text-green-700' : 'text-red-700'}`}
            >
              {error
                ? '위 설정을 먼저 확인하세요.'
                : !sample
                  ? '값을 입력하면 현재 형식에 맞는지 확인할 수 있어요.'
                  : sampleValid
                    ? '사용 가능한 형식이에요.'
                    : '선택한 문자, 첫 글자 또는 길이에 맞지 않아요.'}
            </p>
            <p className="text-xs text-slate-500">
              앞뒤 공백은 저장할 때 제거됩니다. 선택 목록의 값은 별도로 확인해 주세요.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
