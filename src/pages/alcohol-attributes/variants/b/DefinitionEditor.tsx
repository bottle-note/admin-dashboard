import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { categories, definitionValue, type Attribute } from './catalog';

const schema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(
        /^[a-z][a-z0-9_]{0,63}$/,
        '영문 소문자로 시작하는 64자 이내의 영문·숫자·밑줄을 입력하세요.'
      ),
    displayName: z.string().trim().min(1, '표시명을 입력하세요.').max(100),
    type: z.enum(['KEYWORD', 'PRICE', 'POPULARITY', 'FLAG', 'IDENTITY', 'NOTE']),
    datatype: z.enum(['STRING', 'INT', 'DOUBLE']),
    operator: z.enum(['EQ', 'GTE']),
    value: z.string().trim().min(1, '값을 입력하세요.').max(255),
    unit: z.string().trim().max(20),
    description: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    if (value.datatype === 'STRING' && value.operator === 'GTE')
      context.addIssue({
        code: 'custom',
        path: ['operator'],
        message: '이상 조건은 숫자 형식에서만 사용할 수 있습니다.',
      });
    if (
      value.datatype !== 'STRING' &&
      (value.datatype === 'INT'
        ? !/^-?\d{1,18}$/.test(value.value)
        : !/^-?\d{1,15}(\.\d{1,6})?$/.test(value.value))
    )
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: '선택한 값 형식에 맞는 숫자를 입력하세요.',
      });
  });

type Definition = z.infer<typeof schema>;
const empty: Definition = {
  key: '',
  displayName: '',
  type: 'KEYWORD',
  datatype: 'STRING',
  operator: 'EQ',
  value: '',
  unit: '',
  description: '',
};

export function DefinitionEditor({
  attribute,
  attributes,
  connectionCount,
  onSave,
  onCancel,
}: {
  attribute?: Attribute;
  attributes: Attribute[];
  connectionCount: (id: number) => number;
  onSave: (value: Attribute) => void;
  onCancel: () => void;
}) {
  const [preview, setPreview] = useState<Attribute | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<Definition>({ resolver: zodResolver(schema), defaultValues: attribute ?? empty });
  const datatype = useWatch({ control, name: 'datatype' });

  function review(value: Definition) {
    const existing = attribute ?? attributes.find((item) => item.key === value.key);
    if (
      attributes.some((item) => item.id !== existing?.id && item.displayName === value.displayName)
    ) {
      setError('displayName', {
        message: '같은 표시명의 속성이 있습니다. 다른 이름을 입력하세요.',
      });
      return;
    }
    setPreview({
      ...value,
      id: existing?.id ?? Math.max(100, ...attributes.map((item) => item.id)) + 1,
    });
  }

  const previous = attributes.find((item) => item.id === preview?.id);
  const selectClass =
    'h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';

  return (
    <form onSubmit={handleSubmit(review)} className="space-y-5" noValidate>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{attribute ? '정의 편집' : '새 속성 정의'}</h3>
        <span className="text-xs text-muted-foreground">* 필수 입력</span>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        표시명 *
        <Input
          {...register('displayName')}
          aria-invalid={!!errors.displayName}
          placeholder="예: 스모키"
          className="mt-2"
        />
        {errors.displayName && (
          <span role="alert" className="text-xs text-red-600">
            {errors.displayName.message}
          </span>
        )}
      </label>
      <label className="block space-y-2 text-sm font-medium">
        고유 키 *
        <Input
          {...register('key')}
          readOnly={!!attribute}
          aria-invalid={!!errors.key}
          className="mt-2 font-mono text-xs read-only:bg-muted"
          placeholder="예: smoky"
        />
        <span className="block text-xs font-normal text-muted-foreground">
          {attribute
            ? '고유 키는 변경할 수 없습니다.'
            : '기존 키를 입력하면 해당 속성을 갱신합니다.'}
        </span>
        {errors.key && (
          <span role="alert" className="text-xs text-red-600">
            {errors.key.message}
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-2 text-sm font-medium">
          분류 *
          <select {...register('type')} className={selectClass}>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          값 형식 *
          <select {...register('datatype')} className={selectClass}>
            <option value="STRING">문자열</option>
            <option value="INT">정수</option>
            <option value="DOUBLE">소수</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-2 text-sm font-medium">
          비교 조건 *
          <select {...register('operator')} className={selectClass}>
            <option value="EQ">같음</option>
            <option value="GTE" disabled={datatype === 'STRING'}>
              이상
            </option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          값 *<Input {...register('value')} aria-invalid={!!errors.value} placeholder="smoky" />
        </label>
        <label className="space-y-2 text-sm font-medium">
          단위
          <Input {...register('unit')} placeholder="예: 원" maxLength={20} />
        </label>
      </div>
      {(errors.value || errors.operator) && (
        <p role="alert" className="text-xs text-red-600">
          {errors.value?.message ?? errors.operator?.message}
        </p>
      )}
      <label className="block space-y-2 text-sm font-medium">
        의미와 사용 기준
        <Textarea
          {...register('description')}
          maxLength={500}
          rows={4}
          placeholder="어떤 위스키에 사용하는 속성인지 적어 주세요."
        />
        <span className="text-xs font-normal text-muted-foreground">
          다른 운영자도 같은 기준으로 연결할 수 있도록 작성하세요.
        </span>
      </label>
      <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          값과 조건은 이 속성의 공통 정의입니다. 조건에 맞는 위스키가 자동으로 연결되지는 않습니다.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          정의 미리보기
          <ArrowRight />
        </Button>
      </div>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>{previous ? '공통 정의 변경 확인' : '새 속성 등록 확인'}</DialogTitle>
          <DialogDescription>변경 내용을 확인한 뒤 모의 데이터에 저장합니다.</DialogDescription>
          {preview && (
            <>
              <div className="rounded-xl border bg-slate-50 p-5">
                <p className="text-xs text-slate-500">
                  {categories.find((item) => item.value === preview.type)?.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{preview.displayName}</p>
                <p className="mt-2 font-mono text-sm text-blue-700">{definitionValue(preview)}</p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {preview.description || '사용 기준이 작성되지 않았습니다.'}
                </p>
              </div>
              {previous && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  <strong>
                    연결된 위스키 {connectionCount(previous.id)}개의 공통 의미가 바뀝니다.
                  </strong>
                  <p>
                    기존 연결은 유지됩니다. 이름·값·조건을 바꿨다면 연결된 위스키가 새 정의에도
                    맞는지 검토하세요.
                  </p>
                  <p className="mt-2">
                    이전 정의: {previous.displayName} · {definitionValue(previous)}
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                  다시 편집
                </Button>
                <Button type="button" onClick={() => onSave(preview)}>
                  {previous ? '변경 저장' : '속성 등록'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
