/**
 * 밑줄형 탭 줄. 왼쪽에 탭, 오른쪽에 탭별 도구를 둔다.
 * 패널은 호출하는 쪽에서 `id="panel-{value}"`, `aria-labelledby="tab-{value}"`로 연결한다.
 */

import type { ReactNode } from 'react';

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
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b">
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
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
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tools && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-1.5">{tools}</div>}
    </div>
  );
}
