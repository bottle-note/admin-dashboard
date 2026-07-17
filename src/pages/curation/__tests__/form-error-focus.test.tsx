import { createRef } from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { focusFirstFormError, type CurationFormErrorFocusRegistry } from '../form-error-focus';

describe('focusFirstFormError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('error 객체 순서가 아니라 ref가 가리키는 화면 순서의 첫 필드로 이동한다', () => {
    const nameRef = createRef<HTMLInputElement>();
    const exposureStartDateRef = createRef<HTMLInputElement>();

    render(
      <>
        <input ref={nameRef} aria-label="이름" />
        <input ref={exposureStartDateRef} aria-label="시작일" />
      </>
    );

    const scrollIntoViewSpy = vi.spyOn(nameRef.current!, 'scrollIntoView');
    const errors = {
      exposureStartDate: {
        type: 'required',
        message: '시작일은 필수입니다.',
        ref: exposureStartDateRef.current,
      },
      name: {
        type: 'required',
        message: '이름은 필수입니다.',
        ref: nameRef.current,
      },
    } as FieldErrors<FieldValues>;

    focusFirstFormError(errors, new Map());

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(nameRef.current).toHaveFocus();
  });

  it('RHF ref가 없는 복합 필드는 등록된 스크롤·포커스 ref를 사용한다', () => {
    const sectionRef = createRef<HTMLElement>();
    const addButtonRef = createRef<HTMLButtonElement>();

    render(
      <section ref={sectionRef}>
        <button ref={addButtonRef} type="button">
          시음 위스키 추가
        </button>
      </section>
    );

    const scrollIntoViewSpy = vi.spyOn(sectionRef.current!, 'scrollIntoView');
    const registry: CurationFormErrorFocusRegistry = new Map([
      [
        'alcohols',
        {
          scrollElement: sectionRef.current!,
          focusElement: addButtonRef.current!,
        },
      ],
    ]);
    const errors = {
      alcohols: { type: 'too_small', message: '시음 위스키를 추가해주세요.' },
    } as FieldErrors<FieldValues>;

    focusFirstFormError(errors, registry);

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(addButtonRef.current).toHaveFocus();
  });

  it('등록된 포커스 대상이 disabled여도 스크롤은 수행한다', () => {
    const sectionRef = createRef<HTMLElement>();
    const addButtonRef = createRef<HTMLButtonElement>();

    render(
      <section ref={sectionRef}>
        <button ref={addButtonRef} type="button" disabled>
          시음 위스키 추가
        </button>
      </section>
    );

    const scrollIntoViewSpy = vi.spyOn(sectionRef.current!, 'scrollIntoView');
    const registry: CurationFormErrorFocusRegistry = new Map([
      [
        'alcohols',
        {
          scrollElement: sectionRef.current!,
          focusElement: addButtonRef.current!,
        },
      ],
    ]);
    const errors = {
      alcohols: {
        0: {
          alcohol: {
            selectedTags: { type: 'too_small', message: '태그를 추가해주세요.' },
          },
        },
      },
    } as unknown as FieldErrors<FieldValues>;

    focusFirstFormError(errors, registry);

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(addButtonRef.current).not.toHaveFocus();
  });
});
