/**
 * 밑줄형 탭 줄. 왼쪽에 탭, 오른쪽에 탭별 도구를 둔다.
 * 패널은 호출하는 쪽에서 `id="panel-{value}"`, `aria-labelledby="tab-{value}"`로 연결한다.
 */

import { useLayoutEffect, useRef, type ReactNode } from 'react';

export interface TabBarItem<T extends string> {
  value: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: ReadonlyArray<TabBarItem<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** 탭 줄 오른쪽에 두는 도구 */
  tools?: ReactNode;
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  tools,
}: TabBarProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const keyboardFocusTarget = useRef<T | null>(null);

  // 이전 패널이 제거된 뒤 초점을 옮겨 폼의 지연된 오류 focus와 경쟁하지 않는다.
  useLayoutEffect(() => {
    if (keyboardFocusTarget.current !== value) return;
    keyboardFocusTarget.current = null;
    const index = tabs.findIndex((tab) => tab.value === value);
    tabRefs.current[index]?.focus();
  }, [tabs, value]);

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b">
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1">
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.value}`}
            aria-controls={`panel-${tab.value}`}
            aria-selected={value === tab.value}
            tabIndex={value === tab.value ? 0 : -1}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              value === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              keyboardFocusTarget.current = null;
              onChange(tab.value);
            }}
            onKeyDown={(event) => {
              if (event.altKey || event.ctrlKey || event.metaKey) return;
              let nextIndex: number;
              switch (event.key) {
                case 'ArrowRight':
                  nextIndex = (index + 1) % tabs.length;
                  break;
                case 'ArrowLeft':
                  nextIndex = (index - 1 + tabs.length) % tabs.length;
                  break;
                case 'Home':
                  nextIndex = 0;
                  break;
                case 'End':
                  nextIndex = tabs.length - 1;
                  break;
                default:
                  return;
              }
              const next = tabs[nextIndex];
              if (!next) return;
              event.preventDefault();
              if (next.value === value) {
                tabRefs.current[nextIndex]?.focus();
                return;
              }
              keyboardFocusTarget.current = next.value;
              onChange(next.value);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tools && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-1.5">{tools}</div>}
    </div>
  );
}
