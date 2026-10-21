import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> & {
  allowedValues?: string[] | null;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLSelectElement>;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export const AttributeValueInput = forwardRef<HTMLInputElement | HTMLSelectElement, Props>(
  ({ allowedValues, ...props }, ref) => {
    if (allowedValues?.length) {
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          name={props.name}
          value={props.value}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={props.disabled}
          aria-label={props['aria-label']}
          className={`w-full rounded-md border border-input px-3 py-1 ${props.className ?? ''}`}
        >
          <option value="">값 선택</option>
          {allowedValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      );
    }
    return <Input {...props} ref={ref as React.Ref<HTMLInputElement>} />;
  }
);
AttributeValueInput.displayName = 'AttributeValueInput';
