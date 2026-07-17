import { createContext, useCallback, useContext, useEffect, useState, type RefObject } from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';

const ERROR_METADATA_KEYS = new Set(['message', 'type', 'types', 'ref']);

interface CurationFormErrorFocusTarget {
  scrollElement: HTMLElement;
  focusElement: HTMLElement;
}

export type CurationFormErrorFocusRegistry = Map<string, CurationFormErrorFocusTarget>;

interface ResolvedErrorFocusTarget {
  scrollElement: HTMLElement;
  focusElement?: HTMLElement;
}

export const CurationFormErrorFocusContext = createContext<CurationFormErrorFocusRegistry | null>(
  null
);

export function useCurationFormErrorFocus<TFieldValues extends FieldValues>() {
  const [registry] = useState<CurationFormErrorFocusRegistry>(() => new Map());
  const focusFirstError = useCallback(
    (errors: FieldErrors<TFieldValues>) => {
      focusFirstFormError(errors, registry);
    },
    [registry]
  );

  return { focusFirstError, registry };
}

export function useRegisterCurationFormErrorFocusTarget<
  TScrollElement extends HTMLElement,
  TFocusElement extends HTMLElement,
>(fieldName: string, scrollRef: RefObject<TScrollElement>, focusRef: RefObject<TFocusElement>) {
  const registry = useContext(CurationFormErrorFocusContext);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    const focusElement = focusRef.current;
    if (!registry || !scrollElement || !focusElement) return;

    const target = { scrollElement, focusElement };
    registry.set(fieldName, target);

    return () => {
      if (registry.get(fieldName) === target) {
        registry.delete(fieldName);
      }
    };
  }, [fieldName, focusRef, registry, scrollRef]);
}

export function focusFirstFormError<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  registry: CurationFormErrorFocusRegistry
) {
  const target = collectErrorLeaves(errors)
    .map(({ path, ref }) => resolveErrorFocusTarget(path, ref, registry))
    .filter((candidate): candidate is ResolvedErrorFocusTarget => Boolean(candidate))
    .sort(compareTargetOrder)[0];

  if (!target) return;

  target.scrollElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focusElement?.focus({ preventScroll: true });
}

interface ErrorLeaf {
  path: string;
  ref?: unknown;
}

function collectErrorLeaves(node: unknown, path = ''): ErrorLeaf[] {
  if (!node || typeof node !== 'object') return [];

  const record = node as Record<string, unknown>;
  if (typeof record.message === 'string' || typeof record.type === 'string') {
    return path ? [{ path, ref: record.ref }] : [];
  }

  return Object.entries(record).flatMap(([key, value]) => {
    if (ERROR_METADATA_KEYS.has(key)) return [];

    if (key === 'root') {
      return collectErrorLeaves(value, path);
    }

    return collectErrorLeaves(value, path ? `${path}.${key}` : key);
  });
}

function resolveErrorFocusTarget(
  path: string,
  ref: unknown,
  registry: CurationFormErrorFocusRegistry
): ResolvedErrorFocusTarget | undefined {
  if (ref instanceof HTMLElement && isUsableFocusElement(ref)) {
    return { scrollElement: ref, focusElement: ref };
  }

  const registeredTarget = findRegisteredTarget(path, registry);
  if (!registeredTarget || !registeredTarget.scrollElement.isConnected) {
    return undefined;
  }

  if (!isUsableFocusElement(registeredTarget.focusElement)) {
    return { scrollElement: registeredTarget.scrollElement };
  }

  return registeredTarget;
}

function findRegisteredTarget(
  path: string,
  registry: CurationFormErrorFocusRegistry
): CurationFormErrorFocusTarget | undefined {
  let matchedFieldName = '';
  let matchedTarget: CurationFormErrorFocusTarget | undefined;

  for (const [fieldName, target] of registry) {
    if (
      (path === fieldName || path.startsWith(`${fieldName}.`)) &&
      fieldName.length > matchedFieldName.length
    ) {
      matchedFieldName = fieldName;
      matchedTarget = target;
    }
  }

  return matchedTarget;
}

function isUsableFocusElement(element: HTMLElement) {
  if (!element.isConnected) return false;
  if (element instanceof HTMLInputElement && element.type === 'hidden') return false;
  if ('disabled' in element && element.disabled === true) return false;

  return typeof element.focus === 'function';
}

function compareTargetOrder(left: ResolvedErrorFocusTarget, right: ResolvedErrorFocusTarget) {
  if (left.scrollElement === right.scrollElement) return 0;

  const position = left.scrollElement.compareDocumentPosition(right.scrollElement);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

  return 0;
}
