import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { attributeMeaning, attributeTypes, type Attribute } from './mock-data';

const schema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(
        /^[a-z][a-z0-9_]{0,63}$/,
        '영문 소문자로 시작하는 64자 이내의 소문자·숫자·밑줄을 입력하세요.'
      ),
    displayName: z.string().trim().min(1, '표시 이름을 입력하세요.').max(100),
    type: z.enum(['KEYWORD', 'PRICE', 'POPULARITY', 'FLAG', 'IDENTITY', 'NOTE']),
    datatype: z.enum(['STRING', 'INT', 'DOUBLE', 'BOOLEAN']),
    operator: z.enum(['EQ', 'GTE']),
    value: z.string().trim().min(1, '값을 입력하세요.').max(255),
    unit: z.string().trim().max(20),
    description: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    if (value.operator === 'GTE' && !['INT', 'DOUBLE'].includes(value.datatype)) {
      context.addIssue({
        code: 'custom',
        path: ['operator'],
        message: '이상 조건은 숫자 형식에서만 사용할 수 있습니다.',
      });
    }
    if (
      ['INT', 'DOUBLE'].includes(value.datatype) &&
      (!Number.isFinite(Number(value.value)) || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(value.value))
    ) {
      context.addIssue({ code: 'custom', path: ['value'], message: '숫자를 입력하세요.' });
    }
    if (value.datatype === 'INT' && !/^-?\d{1,18}$/.test(value.value)) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: '18자리 이내의 정수를 입력하세요.',
      });
    }
    if (value.datatype === 'DOUBLE' && !/^-?\d{1,15}(\.\d{1,6})?$/.test(value.value)) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: '정수부 15자리, 소수부 6자리 이내의 숫자를 입력하세요.',
      });
    }
    if (value.datatype === 'BOOLEAN' && !/^(true|false)$/.test(value.value)) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'true 또는 false를 입력하세요.',
      });
    }
  });

type Definition = z.infer<typeof schema>;

export function AttributeDefinitionDialog({
  attribute,
  count,
  onClose,
  onSave,
}: {
  attribute: Attribute | null;
  count: number;
  onClose: () => void;
  onSave: (values: Definition) => string | undefined;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Definition>({
    resolver: zodResolver(schema),
    defaultValues: attribute ?? {
      key: '',
      displayName: '',
      type: 'KEYWORD',
      datatype: 'STRING',
      operator: 'EQ',
      value: '',
      unit: '',
      description: '',
    },
  });
  const values = useWatch({ control });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="attribute-c c-definition-dialog">
        <DialogHeader>
          <DialogTitle>{attribute ? '공통 속성 편집' : '새 속성 정의'}</DialogTitle>
          <DialogDescription>
            이름과 조건을 정의하고 연결망에서 함께 사용할 위스키를 고르세요.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((value) => {
            const error = onSave(value);
            if (error) setError('root', { message: error });
          })}
        >
          <div className="c-form-grid">
            <label className="c-field">
              표시 이름
              <Input {...register('displayName')} maxLength={100} placeholder="예: 셰리 입문용" />
            </label>
            <label className="c-field">
              고정 key
              <Input
                {...register('key')}
                readOnly={!!attribute}
                maxLength={64}
                placeholder="예: sherry_starter"
              />
              <small>
                {attribute
                  ? '생성한 key는 변경할 수 없습니다.'
                  : '영문 소문자·숫자·밑줄을 사용하세요.'}
              </small>
            </label>
            <label className="c-field">
              분류
              <select {...register('type')}>
                {Object.entries(attributeTypes).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              값 형식
              <select {...register('datatype')}>
                <option value="STRING">문자열 · STRING</option>
                <option value="INT">정수 · INT</option>
                <option value="DOUBLE">소수 · DOUBLE</option>
                <option value="BOOLEAN">예/아니오 · BOOLEAN</option>
              </select>
            </label>
            <label className="c-field">
              비교 조건
              <select {...register('operator')}>
                <option value="EQ">같음 · EQ</option>
                <option
                  value="GTE"
                  disabled={!['INT', 'DOUBLE'].includes(values.datatype ?? 'STRING')}
                >
                  이상 · GTE
                </option>
              </select>
            </label>
            <div className="c-form-grid">
              <label className="c-field">
                값<Input {...register('value')} maxLength={255} />
              </label>
              <label className="c-field">
                단위
                <Input {...register('unit')} placeholder="원, 점" maxLength={20} />
              </label>
            </div>
            <label className="c-field c-full">
              설명
              <textarea
                {...register('description')}
                rows={3}
                maxLength={500}
                placeholder="어떤 위스키를 연결할지 판단할 기준을 남기세요."
              />
            </label>
          </div>
          <div className="c-definition-preview">
            <span className="c-eyebrow">정의 미리보기</span>
            <strong>{values.displayName || '새 속성'}</strong>
            <span>
              {values.value
                ? attributeMeaning({
                    datatype: values.datatype ?? 'STRING',
                    value: values.value ?? '',
                    unit: values.unit ?? '',
                    operator: values.operator ?? 'EQ',
                  })
                : '값을 입력하세요.'}
            </span>
          </div>
          <p className="c-warning">
            {attribute
              ? `연결된 위스키 ${count}개의 공통 의미가 함께 바뀝니다. 기존 연결은 유지됩니다.`
              : '연결이 없는 속성으로 생성합니다. 위스키는 생성 후 직접 연결하세요.'}{' '}
            조건을 바꿔도 자동으로 연결하거나 해제하지 않습니다.
          </p>
          {Object.keys(errors).length > 0 && (
            <div role="alert" className="c-error">
              {Object.values(errors)
                .map((error) => error.message)
                .filter(Boolean)
                .join(' ')}
            </div>
          )}
          <div className="c-dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{attribute ? '공통 정의 저장' : '속성 생성'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
