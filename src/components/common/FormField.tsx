/**
 * 폼 필드 래퍼 컴포넌트
 * - 라벨, 필수 표시, 에러 메시지를 포함한 폼 필드 레이아웃
 * - React Hook Form과 함께 사용
 */

/**
 * FormField 컴포넌트의 props
 * @param label - 필드 라벨
 * @param required - 필수 필드 여부
 * @param error - 에러 메시지
 * @param children - 폼 입력 요소
 * @param className - 추가 CSS 클래스
 */
export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
