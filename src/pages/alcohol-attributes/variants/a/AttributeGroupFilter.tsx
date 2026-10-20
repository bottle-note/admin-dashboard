import { readGroupIds } from './attribute-search';
import { useSearchParams } from 'react-router';
import { useAttributeGroups } from '@/hooks/useAlcoholAttributes';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-error';

export function AttributeGroupFilter({ prefix = '' }: { prefix?: string }) {
  const [params, setParams] = useSearchParams();
  const groups = useAttributeGroups();
  const selected = readGroupIds(params, prefix);
  const apply = (ids: number[]) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete(`${prefix}groupIds`);
      ids.forEach((id) => next.append(`${prefix}groupIds`, String(id)));
      next.delete(prefix ? `${prefix}Page` : 'page');
      return next;
    });
  return (
    <fieldset className="min-w-0 space-y-2 rounded-md border bg-white px-3 pb-3 text-xs">
      <legend className="px-1 font-medium text-slate-600">
        {prefix ? '그래프 검색 그룹' : '검색 그룹'}
      </legend>
      {groups.isPending && <p role="status">그룹을 불러오는 중입니다.</p>}
      {groups.error && (
        <div role="alert">
          {getErrorMessage(groups.error)}{' '}
          <Button variant="ghost" size="sm" onClick={() => void groups.refetch()}>
            그룹 다시 조회
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {groups.data?.map((group) => (
          <label key={group.id} className="flex min-w-0 cursor-pointer items-center gap-2">
            <Checkbox
              aria-label={`${prefix ? '그래프 ' : ''}검색 그룹 ${group.name}`}
              checked={selected.includes(group.id)}
              disabled={selected.length >= 100 && !selected.includes(group.id)}
              onCheckedChange={(checked) =>
                apply(checked ? [...selected, group.id] : selected.filter((id) => id !== group.id))
              }
            />
            <span className="break-words">{group.name}</span>
          </label>
        ))}
        {selected.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => apply([])}>
            그룹 선택 해제 ({selected.length})
          </Button>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        {selected.length
          ? '선택한 그룹 중 하나에 속한 속성으로 검색합니다. 속성 조건과 함께 적용됩니다.'
          : groups.isSuccess && !groups.data.length
            ? '등록된 그룹이 없습니다. 속성 그룹 탭에서 만들어 보세요.'
            : '선택하지 않으면 미분류를 포함한 모든 그룹을 검색합니다.'}
      </p>
    </fieldset>
  );
}
