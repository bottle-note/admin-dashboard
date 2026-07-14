import type { FieldErrors, FieldValues } from 'react-hook-form';

const ERROR_METADATA_KEYS = new Set(['message', 'type', 'types', 'ref']);
const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusFirstFormError<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>
) {
  const errorPaths = collectErrorPaths(errors);
  const target = findFirstErrorTarget(errorPaths);

  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const focusTarget = target.matches(FOCUSABLE_SELECTOR)
    ? target
    : target.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  focusTarget?.focus({ preventScroll: true });
}

function collectErrorPaths(node: unknown, path = ''): string[] {
  if (!node || typeof node !== 'object') return [];

  const record = node as Record<string, unknown>;
  if (typeof record.message === 'string') {
    return path ? [path] : [];
  }

  return Object.entries(record).flatMap(([key, value]) => {
    if (ERROR_METADATA_KEYS.has(key)) return [];

    if (key === 'root') {
      return collectErrorPaths(value, path);
    }

    return collectErrorPaths(value, path ? `${path}.${key}` : key);
  });
}

function findFirstErrorTarget(errorPaths: string[]): HTMLElement | undefined {
  const namedElements = Array.from(
    document.querySelectorAll<HTMLElement>('[name]:not([type="hidden"])')
  );
  const fieldContainers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-form-field-name]')
  );

  const targets = errorPaths
    .map((path) => {
      const exactInput = namedElements.find((element) => element.getAttribute('name') === path);
      if (exactInput) return exactInput;

      return fieldContainers.find((element) => {
        const fieldName = element.dataset.formFieldName;
        return fieldName === path || Boolean(fieldName && path.startsWith(`${fieldName}.`));
      });
    })
    .filter((element): element is HTMLElement => Boolean(element));

  return targets.sort(compareDocumentOrder)[0];
}

function compareDocumentOrder(left: HTMLElement, right: HTMLElement) {
  if (left === right) return 0;

  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
