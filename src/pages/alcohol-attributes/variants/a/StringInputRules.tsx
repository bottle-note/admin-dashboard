import { useEffect, useRef } from 'react';
import { ListChecks, TextCursorInput, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CharacterRuleBuilder } from './CharacterRuleBuilder';

export function StringInputRules({
  mode,
  values,
  pattern,
  onModeChange,
  onValuesChange,
  onPatternChange,
  onPatternError,
}: {
  mode: 'free' | 'list';
  values: string[];
  pattern: string;
  onModeChange: (mode: 'free' | 'list') => void;
  onValuesChange: (values: string[]) => void;
  onPatternChange: (pattern: string) => void;
  onPatternError: (error: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const previousLength = useRef(values.length);
  useEffect(() => {
    if (values.length > previousLength.current)
      listRef.current?.querySelector<HTMLInputElement>('li:last-child input')?.focus();
    previousLength.current = values.length;
  }, [values.length]);
  return (
    <section aria-label="값 입력 설정" className="space-y-4 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold">값 입력 방식</h3>
        <p className="mt-1 text-xs text-slate-500">위스키에 값을 연결할 때 사용할 방식이에요.</p>
      </div>
      <div role="group" aria-label="값 입력 방식" className="grid grid-cols-2 gap-2">
        {(
          [
            ['free', '직접 입력', TextCursorInput],
            ['list', '목록에서 선택', ListChecks],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onModeChange(value)}
            className="!h-auto rounded-lg border bg-white px-3 py-3 text-left transition-colors hover:bg-slate-50 aria-pressed:border-blue-500 aria-pressed:bg-blue-50 aria-pressed:text-blue-700"
          >
            <Icon aria-hidden="true" className="mb-2 h-4 w-4" />
            <span className="block font-medium">{label}</span>
          </button>
        ))}
      </div>
      {mode === 'list' && (
        <div ref={listRef} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">선택 항목</span>
            <span className="text-xs tabular-nums text-slate-500">{values.length} / 100</span>
          </div>
          {values.length > 0 ? (
            <ol className="max-h-64 space-y-2 overflow-y-auto p-1">
              {values.map((value, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Input
                    aria-label={`선택 항목 ${index + 1}`}
                    value={value}
                    maxLength={255}
                    placeholder="예: 부드러움"
                    className="!h-10 min-w-0 bg-white"
                    onChange={(event) =>
                      onValuesChange(
                        values.map((item, i) => (i === index ? event.target.value : item))
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        if (values.length < 100) onValuesChange([...values, '']);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="!h-9 w-9 shrink-0 text-slate-400 hover:text-red-600"
                    aria-label={`선택 항목 ${index + 1} 삭제`}
                    onClick={() => onValuesChange(values.filter((_, i) => i !== index))}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-500">
              선택할 값을 추가하세요. 예: 부드러움, 스모키, 달콤함
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            className="!h-9 w-full justify-start text-blue-600"
            disabled={values.length >= 100}
            onClick={() => onValuesChange([...values, ''])}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            항목 추가
          </Button>
        </div>
      )}
      <CharacterRuleBuilder pattern={pattern} onChange={onPatternChange} onError={onPatternError} />
    </section>
  );
}
