import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { TabBar } from '@/components/common/TabBar';

const TABS = [
  { value: 'attributes', label: '속성관리' },
  { value: 'mappings', label: '속성 연결' },
] as const;

export function AlcoholAttributePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'mappings' ? 'mappings' : 'attributes';

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader title="속성 관리" description="공통 속성을 관리하고 위스키와 연결합니다." />
      <TabBar
        tabs={TABS}
        value={tab}
        onChange={(value) =>
          setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set('tab', value);
            return next;
          })
        }
        ariaLabel="위스키 속성 관리"
      />
      {TABS.map((item) => (
        <section
          key={item.value}
          id={`panel-${item.value}`}
          role="tabpanel"
          aria-labelledby={`tab-${item.value}`}
          hidden={tab !== item.value}
          className="rounded-lg border bg-card p-6"
        >
          <h2 className="font-semibold">{item.label}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.value === 'attributes'
              ? '공통 속성을 등록하고 수정하는 화면을 준비 중입니다.'
              : '위스키에 속성을 연결하고 해제하는 화면을 준비 중입니다.'}
          </p>
        </section>
      ))}
    </div>
  );
}
