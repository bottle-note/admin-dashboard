import type { FieldErrors, FieldValues } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { focusFirstFormError } from '../focusFirstFormError';

describe('focusFirstFormError', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('error 객체 순서가 아니라 화면에 먼저 배치된 필드로 이동한다', () => {
    document.body.innerHTML = `
      <input name="name" />
      <input name="exposureStartDate" />
    `;
    const nameInput = document.querySelector<HTMLInputElement>('[name="name"]')!;
    const scrollIntoViewSpy = vi.spyOn(nameInput, 'scrollIntoView');
    const errors = {
      exposureStartDate: { type: 'required', message: '시작일은 필수입니다.' },
      name: { type: 'required', message: '이름은 필수입니다.' },
    } as FieldErrors<FieldValues>;

    focusFirstFormError(errors);

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(nameInput).toHaveFocus();
  });

  it('직접 포커스할 input이 없으면 필드 컨테이너의 첫 버튼으로 이동한다', () => {
    document.body.innerHTML = `
      <section data-form-field-name="alcohols">
        <button type="button">시음 위스키 추가</button>
      </section>
    `;
    const fieldContainer = document.querySelector<HTMLElement>(
      '[data-form-field-name="alcohols"]'
    )!;
    const addButton = fieldContainer.querySelector<HTMLButtonElement>('button')!;
    const scrollIntoViewSpy = vi.spyOn(fieldContainer, 'scrollIntoView');
    const errors = {
      alcohols: { type: 'too_small', message: '시음 위스키를 추가해주세요.' },
    } as FieldErrors<FieldValues>;

    focusFirstFormError(errors);

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(addButton).toHaveFocus();
  });
});
