import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, LockKeyhole, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type Attribute, TYPE_LABELS } from './mock-data';

const schema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9_]{0,63}$/, '소문자로 시작하는 영문·숫자·밑줄 64자 이내로 입력하세요.'),
    displayName: z.string().trim().min(1, '속성 이름을 입력하세요.').max(100),
    type: z.enum(['KEYWORD', 'PRICE', 'POPULARITY', 'FLAG', 'IDENTITY', 'NOTE']),
    datatype: z.enum(['STRING', 'INT', 'DOUBLE', 'BOOLEAN']),
    operator: z.enum(['EQ', 'GTE']),
    value: z.string().trim().min(1, '값을 입력하세요.').max(255),
    unit: z.string().trim().max(20),
    description: z.string().trim().max(500),
  })
  .superRefine((data, context) => {
    const numeric = data.datatype === 'INT' || data.datatype === 'DOUBLE';
    if (data.operator === 'GTE' && !numeric)
      context.addIssue({
        code: 'custom',
        path: ['operator'],
        message: '이상 조건은 숫자 형식에서만 사용합니다.',
      });
    if (data.datatype === 'INT' && !/^-?\d+$/.test(data.value))
      context.addIssue({ code: 'custom', path: ['value'], message: '정수를 입력하세요.' });
    if (data.datatype === 'DOUBLE' && !/^-?\d+(\.\d{1,6})?$/.test(data.value))
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: '소수점 6자리 이내 숫자를 입력하세요.',
      });
    if (data.datatype === 'BOOLEAN' && !['true', 'false'].includes(data.value))
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'true 또는 false를 입력하세요.',
      });
  });

type FormValues = z.infer<typeof schema>;
const selectClass =
  'h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700';

export function AttributeEditor({
  attribute,
  linkedCount,
  onSave,
  onCancel,
}: {
  attribute: Attribute;
  linkedCount: number;
  onSave: (attribute: Attribute) => string | undefined;
  onCancel: () => void;
}) {
  const [preview, setPreview] = useState<Attribute | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: attribute });
  const datatype = useWatch({ control, name: 'datatype' });
  const numeric = datatype === 'INT' || datatype === 'DOUBLE';
  return (
    <form
      className="flex flex-col [&_button]:h-7 [&_button]:text-xs [&_input]:h-7 [&_input]:text-xs [&_input]:md:text-xs"
      onSubmit={handleSubmit((values) => {
        setPreview({ ...values, id: attribute.id });
      })}
    >
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{attribute.id ? '속성 상세 · 편집' : '새 속성'}</span>
          <span className="font-mono">{attribute.id ? `#${attribute.id}` : 'NEW'}</span>
        </div>
        <h2 className="text-sm font-semibold tracking-tight">
          {attribute.id ? attribute.displayName : '공통 속성 만들기'}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {attribute.id
            ? `현재 ${linkedCount}개 위스키가 이 속성을 공유합니다.`
            : '먼저 사전에 등록하고 필요한 위스키에 연결하세요.'}
        </p>
      </div>
      <div className="space-y-2.5 p-3">
        <label className="block space-y-1 text-xs font-medium">
          속성 이름 <span className="text-rose-600">*</span>
          <Input {...register('displayName')} placeholder="예: 선물용" maxLength={100} />
        </label>
        <label className="block space-y-1 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            고유 키 {attribute.id > 0 && <LockKeyhole className="h-3 w-3" />}
          </span>
          <Input
            {...register('key')}
            readOnly={attribute.id > 0}
            placeholder="예: gift"
            className="font-mono text-xs read-only:bg-slate-50 read-only:text-slate-500"
          />
          <span className="block font-normal text-muted-foreground">
            {attribute.id
              ? '등록한 키는 변경할 수 없습니다.'
              : '영문 소문자·숫자·밑줄을 사용합니다.'}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-medium">
            분류
            <select {...register('type')} className={selectClass}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            값 형식
            <select {...register('datatype')} className={selectClass}>
              <option value="STRING">문자</option>
              <option value="INT">정수</option>
              <option value="DOUBLE">소수</option>
              <option value="BOOLEAN">참 / 거짓</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <label className="space-y-1 text-xs font-medium">
            값 <span className="text-rose-600">*</span>
            <Input
              {...register('value')}
              placeholder={datatype === 'BOOLEAN' ? 'true 또는 false' : '속성이 갖는 값'}
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            단위
            <Input {...register('unit')} placeholder="원, 점" maxLength={20} />
          </label>
        </div>
        <label className="block space-y-1 text-xs font-medium">
          비교 조건
          <select {...register('operator')} className={selectClass}>
            <option value="EQ">같음 (=)</option>
            <option value="GTE" disabled={!numeric}>
              이상 (≥) · 숫자만
            </option>
          </select>
        </label>
        <p className="-mt-2 text-[11px] leading-relaxed text-muted-foreground">
          조건에 맞는 위스키가 자동으로 연결되지는 않습니다.
        </p>
        <label className="block space-y-1 text-xs font-medium">
          설명
          <Textarea
            {...register('description')}
            className="min-h-12 resize-y text-xs"
            placeholder="속성을 연결할 때 참고할 기준"
            maxLength={500}
          />
        </label>
        {attribute.id > 0 && linkedCount > 0 && (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              저장하면 연결된 <strong>{linkedCount}개 위스키</strong>에 바뀐 의미가 적용됩니다. 기존
              연결은 유지됩니다.
            </p>
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="space-y-1 text-xs text-red-700">
            {Object.entries(errors).map(([field, error]) => (
              <p key={field}>{error.message}</p>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-slate-50 p-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          편집 취소
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-teal-800 hover:bg-teal-900"
          disabled={attribute.id > 0 && !isDirty}
        >
          {attribute.id ? <Check /> : <Plus />}
          {attribute.id ? '변경 내용 확인' : '등록 내용 확인'}
        </Button>
      </div>
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{attribute.id ? '공통 속성 변경 확인' : '새 속성 등록 확인'}</DialogTitle>
            <DialogDescription>
              정의를 비교하고 연결된 위스키에 미치는 영향을 확인하세요.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3">항목</th>
                      <th className="p-3">변경 전</th>
                      <th className="p-3">변경 후</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ['displayName', '속성 이름'],
                        ['key', '고유 키'],
                        ['type', '분류'],
                        ['datatype', '값 형식'],
                        ['operator', '비교 조건'],
                        ['value', '값'],
                        ['unit', '단위'],
                        ['description', '설명'],
                      ] as const
                    ).map(([field, label]) => {
                      const format = (item: Attribute) =>
                        field === 'type'
                          ? TYPE_LABELS[item.type]
                          : field === 'operator'
                            ? item.operator === 'GTE'
                              ? '이상 (≥)'
                              : '같음 (=)'
                            : item[field] || '없음';
                      const changed = !attribute.id || attribute[field] !== preview[field];
                      return (
                        <tr key={field} className={`border-t ${changed ? 'bg-teal-50' : ''}`}>
                          <th scope="row" className="whitespace-nowrap p-3 align-top font-medium">
                            {label}
                            {changed && <span className="block text-xs text-teal-800">변경</span>}
                          </th>
                          <td className="max-w-56 whitespace-pre-wrap break-words p-3 align-top text-slate-600">
                            {attribute.id ? format(attribute) : '등록 전'}
                          </td>
                          <td className="max-w-56 whitespace-pre-wrap break-words p-3 align-top">
                            {format(preview)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <strong>연결된 위스키 {linkedCount}개의 공통 정의에 반영됩니다.</strong>
                <p className="mt-1">
                  기존 연결은 유지됩니다. 새 정의에도 연결된 위스키가 적합한지 확인하세요. 조건에
                  따른 자동 연결은 없습니다.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                  다시 편집
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const error = onSave(preview);
                    if (error) {
                      setPreview(null);
                      setError('root', { message: error });
                    }
                  }}
                >
                  {attribute.id ? '변경 저장' : '속성 등록'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
