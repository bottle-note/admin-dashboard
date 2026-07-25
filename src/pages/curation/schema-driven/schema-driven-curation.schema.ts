import { z } from 'zod';

import { compareDateInputValues } from '@/lib/date-validation';

import {
  createCurationFieldValueSchema,
  createDefaultCurationFieldValue,
} from '../curation-form-schema';
import type { SchemaDrivenCurationFormModel } from './schema-driven-curation.form-model';

export interface SchemaDrivenCurationFormState {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
  [key: string]: unknown;
}

export function createDefaultSchemaDrivenCurationFormState(
  formModel: SchemaDrivenCurationFormModel
): SchemaDrivenCurationFormState {
  const formState: SchemaDrivenCurationFormState = {
    name: '',
    description: '',
    imageUrls: [],
    exposureStartDate: '',
    exposureEndDate: '',
    displayOrder: 0,
    isActive: true,
  };

  for (const field of formModel.payloadFields) {
    formState[field.key] = createDefaultCurationFieldValue(field);
  }

  return formState;
}

export function createSchemaDrivenCurationFormSchema(
  formModel: SchemaDrivenCurationFormModel,
  options: { mode?: 'create' | 'edit' } = {}
): z.ZodType<SchemaDrivenCurationFormState> {
  const isEditMode = options.mode === 'edit';
  const payloadShape = formModel.payloadFields.reduce<Record<string, z.ZodType<unknown>>>(
    (shape, field) => {
      shape[field.key] = createCurationFieldValueSchema(field);
      return shape;
    },
    {}
  );

  return z
    .object({
      name: z.string().min(1, '큐레이션명은 필수입니다.'),
      description: isEditMode ? z.string() : z.string().min(1, '설명은 필수입니다.'),
      imageUrls: z.array(z.string()).max(3, '이미지는 최대 3개까지 등록할 수 있습니다.'),
      exposureStartDate: isEditMode
        ? z.string()
        : z.string().min(1, '광고노출 시작일은 필수입니다.'),
      exposureEndDate: isEditMode ? z.string() : z.string().min(1, '광고노출 종료일은 필수입니다.'),
      displayOrder: z
        .number()
        .int('노출 순서는 정수로 입력해주세요.')
        .min(0, '노출 순서는 0 이상이어야 합니다.'),
      isActive: z.boolean(),
      ...payloadShape,
    })
    .superRefine((values, context) => {
      const formValues = values as Record<string, unknown>;
      addDateOrderIssue(
        values.exposureStartDate,
        values.exposureEndDate,
        ['exposureEndDate'],
        '광고노출 종료일은 광고노출 시작일보다 빠를 수 없습니다.',
        context
      );

      const eventStartDate =
        typeof formValues.eventStartDate === 'string' ? formValues.eventStartDate : '';
      const eventEndDate =
        typeof formValues.eventEndDate === 'string' ? formValues.eventEndDate : '';
      addDateOrderIssue(
        eventStartDate,
        eventEndDate,
        ['eventEndDate'],
        '행사 종료일은 행사 시작일보다 빠를 수 없습니다.',
        context
      );

      if (!Array.isArray(formValues.programs)) return;

      formValues.programs.forEach((program: unknown, index: number) => {
        if (!program || typeof program !== 'object' || Array.isArray(program)) return;

        const record = program as Record<string, unknown>;
        const startTime = typeof record.startTime === 'string' ? record.startTime : '';
        const endTime = typeof record.endTime === 'string' ? record.endTime : '';
        addDateOrderIssue(
          startTime,
          endTime,
          ['programs', index, 'endTime'],
          '종료 시간은 시작 시간보다 빠를 수 없습니다.',
          context
        );
      });
    }) as unknown as z.ZodType<SchemaDrivenCurationFormState>;
}

function addDateOrderIssue(
  start: string,
  end: string,
  path: Array<string | number>,
  message: string,
  context: z.RefinementCtx
) {
  if (!start || !end || compareDateInputValues(end, start) >= 0) return;

  context.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}
