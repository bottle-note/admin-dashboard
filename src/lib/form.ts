/** 폼 입력 공용 도우미 */

/** 오류가 있을 때만 입력 요소에 접근성 속성을 붙인다. `FormField`의 `htmlFor`와 같은 id를 준다 */
export function fieldErrorProps(id: string, message?: string) {
  return message ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` } : {};
}
