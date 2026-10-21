import { X } from 'lucide-react';
import { useAttributeDefinitions } from '@/hooks/useAlcoholAttributes';
import { GraphFilterPopover } from './GraphFilterPopover';
import { GraphConditionForm } from './GraphConditionForm';
import { displayValue } from './attribute-model';
import { searchOperators, type AttributeSearch } from './attribute-search';

export function AttributeConditionTokens({
  search,
  onChange,
  disabled = false,
}: {
  search: AttributeSearch;
  onChange: (value: AttributeSearch) => void;
  disabled?: boolean;
}) {
  const definitions = useAttributeDefinitions();
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
      {search.conditions.length > 0 && (
        <span className="text-sm text-slate-500">
          {search.match === 'AND' ? '모든 조건 충족' : '하나 이상 충족'}
        </span>
      )}
      {search.conditions.map((condition, index) => {
        const attribute = definitions.data?.find((a) => a.key === condition.key);
        const label = `${attribute?.displayName ?? condition.key} ${condition.operator === 'EQ' ? '=' : searchOperators[condition.operator]}${condition.value === undefined ? '' : ` ${attribute ? displayValue({ ...attribute, unit: attribute.unit ?? '', description: attribute.description ?? '' }, condition.value) : condition.value}`}`;
        return (
          <span key={`${index}-${condition.key}`} className="attribute-token">
            <GraphFilterPopover label={label} compact triggerClassName="!h-auto text-left">
              {(close) => (
                <GraphConditionForm
                  attributes={definitions.data ?? []}
                  initialCondition={condition}
                  conditionCount={search.conditions.length - 1}
                  disabled={disabled || !definitions.isSuccess}
                  onAdd={(conditions) => {
                    onChange({
                      ...search,
                      conditions: search.conditions.flatMap((item, i) =>
                        i === index ? conditions : [item]
                      ),
                    });
                    close();
                  }}
                />
              )}
            </GraphFilterPopover>
            <button
              aria-label={`${label} 조건 제거`}
              disabled={disabled}
              className="shrink-0 rounded-r-lg text-slate-500 disabled:opacity-50"
              onClick={() =>
                onChange({ ...search, conditions: search.conditions.filter((_, i) => i !== index) })
              }
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
