import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Folder, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAttributeGroups,
  useAttributeDefinitions,
  useAttributeGroupCreate,
  useAttributeGroupUpdate,
  useAttributeGroupDelete,
  useAlcoholAttributeUpdate,
} from '@/hooks/useAlcoholAttributes';
import type { AttributeGroup } from '@/types/api/alcohol-attribute.api';
import { getErrorMessage } from '@/lib/api-error';
import { TYPE_LABELS } from './attribute-model';

const schema = z.object({
  name: z.string().trim().min(1, '그룹 이름을 입력하세요.').max(100, '100자 이내로 입력하세요.'),
  description: z.string().trim().max(500, '500자 이내로 입력하세요.'),
  displayOrder: z.number().int().min(0, '0 이상의 정수를 입력하세요.').max(2147483647),
});
type Values = z.infer<typeof schema>;
function GroupEditor({
  group,
  onClose,
  onSave,
}: {
  group: Pick<AttributeGroup, 'id' | 'name' | 'description' | 'displayOrder'>;
  onClose: () => void;
  onSave: (values: Values) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ...group, description: group.description ?? '' },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group.id ? '그룹 편집' : '그룹 만들기'}</DialogTitle>
          <DialogDescription>
            속성을 묶어 관리합니다. 속성의 분류와 값 형식은 유지됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setError('');
            try {
              await onSave(values);
            } catch (cause) {
              setError(getErrorMessage(cause));
            }
          })}
        >
          <label className="block space-y-2 text-sm">
            그룹 이름
            <Input {...register('name')} maxLength={100} autoFocus />
          </label>
          <label className="block space-y-2 text-sm">
            설명
            <Input {...register('description')} maxLength={500} />
          </label>
          <label className="block space-y-2 text-sm">
            표시 순서
            <Input type="number" min={0} {...register('displayOrder', { valueAsNumber: true })} />
            <span className="text-xs text-slate-500">
              작은 숫자부터 표시합니다. 같은 순서에서는 먼저 만든 그룹이 앞에 표시됩니다.
            </span>
          </label>
          {Object.values(errors).map((item, index) => (
            <p key={index} role="alert" className="text-sm text-red-700">
              {item.message}
            </p>
          ))}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onClose}>
              취소
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '저장 중…' : '그룹 저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const ungrouped = {
  id: 'ungrouped',
  name: '미분류',
  description: '아직 그룹을 지정하지 않은 속성입니다.',
  displayOrder: 0,
};
export function AttributeGroupsPanel() {
  const [params, setParams] = useSearchParams();
  const groupQuery = useAttributeGroups();
  const attributeQuery = useAttributeDefinitions();
  const create = useAttributeGroupCreate();
  const update = useAttributeGroupUpdate();
  const remove = useAttributeGroupDelete();
  const move = useAlcoholAttributeUpdate();
  const [editor, setEditor] = useState<Pick<
    AttributeGroup,
    'id' | 'name' | 'description' | 'displayOrder'
  > | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [destination, setDestination] = useState('');
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const groups = groupQuery.data ?? [];
  const attributes = attributeQuery.data ?? [];
  const allGroups = [...groups.map((group) => ({ ...group, id: String(group.id) })), ungrouped];
  const active =
    allGroups.find((group) => group.id === params.get('attributeGroup')) ?? allGroups[0]!;
  const search = params.get('groupSearch') ?? '';
  const members = attributes.filter(
    (attribute) =>
      String(attribute.groupId ?? 'ungrouped') === active.id &&
      `${attribute.displayName} ${attribute.key}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase())
  );
  const pending = moving || remove.isPending;
  const setParam = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  function selectGroup(id: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('attributeGroup', id);
      next.delete('groupSearch');
      return next;
    });
    setSelected([]);
    setDestination('');
    setError('');
    setNotice('');
  }
  if (groupQuery.isPending || attributeQuery.isPending)
    return (
      <p role="status" className="p-6 text-sm text-slate-500">
        그룹과 속성을 불러오는 중입니다.
      </p>
    );
  if (groupQuery.error || attributeQuery.error)
    return (
      <div role="alert" className="rounded-lg border p-5 text-sm">
        {getErrorMessage(groupQuery.error ?? attributeQuery.error)}
        <p className="mt-2 text-slate-500">그룹 API가 배포 중이면 완료 후 다시 조회하세요.</p>
        <Button
          variant="outline"
          onClick={() => {
            void groupQuery.refetch();
            void attributeQuery.refetch();
          }}
        >
          다시 조회
        </Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">속성을 그룹으로 정리하세요</p>
          <p className="mt-1 text-xs text-slate-500">
            그룹을 선택하고 속성을 이동하세요. 그룹은 위스키 검색 필터에서도 사용할 수 있습니다.
          </p>
        </div>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => setEditor({ id: 0, name: '', description: '', displayOrder: 0 })}
        >
          <Plus className="h-4 w-4" />
          그룹 만들기
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-teal-800">
          {notice}
        </p>
      )}
      <div className="grid min-w-0 items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="속성 그룹 목록" className="overflow-hidden rounded-lg border bg-white">
          <div className="flex justify-between border-b p-4 font-semibold">
            <span>속성 그룹</span>
            <span className="text-slate-500">{groups.length}개</span>
          </div>
          <div className="space-y-1 p-2">
            {allGroups.map((group) => (
              <button
                key={group.id}
                disabled={pending}
                aria-pressed={active.id === group.id}
                onClick={() => selectGroup(group.id)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-700 disabled:opacity-50 aria-pressed:bg-teal-50 aria-pressed:text-teal-900"
              >
                {active.id === group.id ? (
                  <FolderOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 break-words">{group.name}</span>
                <span>
                  {
                    attributes.filter(
                      (attribute) => String(attribute.groupId ?? 'ungrouped') === group.id
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <p className="border-t p-4 text-xs leading-5 text-slate-500">
            속성 하나는 하나의 그룹에 속합니다. 그룹을 해제하면 미분류로 이동합니다.
          </p>
        </nav>
        <section
          aria-label="그룹 속성 관리"
          className="min-w-0 overflow-hidden rounded-lg border bg-white"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
            <div className="min-w-0">
              <p className="text-xs text-teal-700">속성 그룹</p>
              <h2 className="mt-1 break-words text-lg font-semibold">{active.name}</h2>
              <p className="mt-2 break-words text-xs text-slate-500">
                {active.description || '설명이 없는 그룹입니다.'}
              </p>
            </div>
            {active.id !== ungrouped.id && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditor({ ...active, id: Number(active.id) })}
                >
                  <Pencil className="h-4 w-4" />
                  그룹 편집
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setError('');
                    setDeleting(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  그룹 삭제
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 border-b p-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                aria-label="그룹 안에서 속성 검색"
                value={search}
                disabled={pending}
                onChange={(event) => {
                  setParam('groupSearch', event.target.value);
                  setSelected([]);
                }}
                placeholder="속성 이름 또는 키 검색"
                className="pl-9"
              />
            </div>
            <span className="shrink-0 text-xs text-slate-500">{members.length}개 속성</span>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b bg-teal-50 p-3 text-sm">
              <strong>{selected.length}개 선택</strong>
              <select
                aria-label="이동할 그룹"
                disabled={pending}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="h-9 max-w-full rounded-md border bg-white px-2"
              >
                <option value="">이동할 그룹 선택</option>
                {allGroups
                  .filter((group) => group.id !== active.id)
                  .map((group) => (
                    <option value={group.id} key={group.id}>
                      {group.name}
                    </option>
                  ))}
              </select>
              <Button
                size="sm"
                disabled={!destination || pending}
                onClick={async () => {
                  setMoving(true);
                  setError('');
                  setNotice('');
                  const failed: number[] = [];
                  let moved = 0;
                  for (const id of selected) {
                    const attribute = attributes.find((item) => item.id === id);
                    if (!attribute) {
                      failed.push(id);
                      continue;
                    }
                    try {
                      await move.mutateAsync({
                        id,
                        data: {
                          displayName: attribute.displayName,
                          type: attribute.type,
                          datatype: attribute.datatype,
                          unit: attribute.unit,
                          description: attribute.description,
                          groupId: destination === 'ungrouped' ? null : Number(destination),
                        },
                      });
                      moved++;
                    } catch {
                      failed.push(id);
                    }
                  }
                  setSelected(failed);
                  setMoving(false);
                  setNotice(`${moved}개 속성을 이동했습니다.`);
                  if (failed.length)
                    setError(
                      `${failed.length}개 속성을 이동하지 못했습니다. 선택된 속성을 확인하고 다시 시도하세요.`
                    );
                  else setDestination('');
                }}
              >
                {moving ? '이동 중…' : '선택 속성 이동'}
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setSelected([])}>
                선택 해제
              </Button>
            </div>
          )}
          <div className="divide-y">
            {members.map((attribute) => (
              <label
                key={attribute.id}
                className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <Checkbox
                  disabled={pending}
                  aria-label={`${attribute.displayName} 선택`}
                  checked={selected.includes(attribute.id)}
                  onCheckedChange={(checked) =>
                    setSelected((previous) =>
                      checked
                        ? [...previous, attribute.id]
                        : previous.filter((id) => id !== attribute.id)
                    )
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-medium">{attribute.displayName}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px]">
                      {TYPE_LABELS[attribute.type]}
                    </span>
                  </span>
                  <span className="mt-1 block break-all font-mono text-[11px] text-slate-400">
                    {attribute.key}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {!members.length && (
            <p className="px-5 py-14 text-center text-sm text-slate-500">
              {search
                ? '검색 조건에 맞는 속성이 없습니다.'
                : '아직 이 그룹에 속성이 없습니다. 다른 그룹이나 미분류에서 속성을 이동하세요.'}
            </p>
          )}
        </section>
      </div>
      {editor && (
        <GroupEditor
          group={editor}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            const data = { ...values, description: values.description || null };
            const saved = editor.id
              ? await update.mutateAsync({ id: editor.id, data })
              : await create.mutateAsync(data);
            setEditor(null);
            selectGroup(String(saved.id));
          }}
        />
      )}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !remove.isPending) setDeleting(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>그룹을 삭제할까요?</DialogTitle>
              <DialogDescription>
                “{active.name}” 그룹을 삭제합니다. 속성이 남아 있으면 먼저 다른 그룹이나 미분류로
                이동해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                disabled={remove.isPending}
                onClick={() => setDeleting(false)}
              >
                취소
              </Button>
              <Button
                disabled={remove.isPending}
                onClick={async () => {
                  try {
                    await remove.mutateAsync(Number(active.id));
                    setDeleting(false);
                    selectGroup('ungrouped');
                  } catch (cause) {
                    setDeleting(false);
                    setError(getErrorMessage(cause));
                  }
                }}
              >
                삭제 확인
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
