import { z } from 'zod';

import type { JsonSchemaNode } from '@/types/api';

const schemaType = z.enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);

const schemaNodeShape = {
  type: z.union([schemaType, z.array(schemaType)]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  nullable: z.boolean().optional(),
  example: z.unknown().optional(),
  required: z.array(z.string()).optional(),
  enum: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  default: z.unknown().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  'x-container': z.string().optional(),
  'x-form-style': z.string().optional(),
  'x-field-style': z.string().optional(),
  'x-display-name': z.string().optional(),
  'x-upload-path': z.string().optional(),
  'x-read-only': z.boolean().optional(),
  'x-place-search-targets': z.record(z.string(), z.enum(['placeName', 'id', 'address'])).optional(),
};

const schemaNode = z.looseObject(schemaNodeShape);

const selectedTagsSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('array'),
  items: schemaNode,
  maxItems: z.number(),
});

const alcoholSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    alcoholId: schemaNode.default({}),
    korName: schemaNode,
    engName: schemaNode.default({}),
    imageUrl: schemaNode.default({}),
    abv: schemaNode.default({}),
    cask: schemaNode.default({}),
    volume: schemaNode.default({}),
    regionName: schemaNode.default({}),
    korCategory: schemaNode.default({}),
    selectedTags: selectedTagsSchema,
  }),
});

const alcoholItemSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    source: schemaNode,
    alcohol: alcoholSchema,
    comment: schemaNode,
  }),
});

const pairingItemSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    itemName: schemaNode,
    pairingNote: schemaNode,
    itemImageUrl: schemaNode.optional(),
  }),
});

const pairingListSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('array'),
  items: pairingItemSchema,
  minItems: z.number(),
  maxItems: z.number(),
  'x-field-style': z.literal('pairing-food-list'),
});

export const whiskyCurationRequestSpecSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    source: schemaNode,
    alcohol: alcoholSchema,
    comment: schemaNode.default({}),
    pairings: pairingListSchema.optional(),
  }),
  minItems: z.number().default(1),
  maxItems: z.number().optional(),
  'x-container': z.literal('array'),
  'x-form-style': z.enum(['alcohol-list', 'pairing-list']).optional(),
  'x-field-style': z.literal('alcohol-card').optional(),
});

export const whiskyTastingEventAlcoholListSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('array'),
  items: alcoholItemSchema,
  minItems: z.number(),
  maxItems: z.number(),
  'x-field-style': z.literal('alcohol-card-list'),
});

export const whiskyTastingEventRequestSpecSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    eventDate: schemaNode,
    eventTime: schemaNode,
    placeName: schemaNode,
    kakaoPlaceId: schemaNode,
    barAddress: schemaNode,
    detailAddress: schemaNode,
    capacity: schemaNode,
    entryFee: schemaNode,
    isRecruiting: schemaNode,
    is_tbc: schemaNode,
    guideText: schemaNode,
    applicationLink: schemaNode,
    alcohols: whiskyTastingEventAlcoholListSchema,
  }),
});

const tastingEventAlcoholPayloadSchema = z.looseObject({
  alcoholId: z.number().nullable().optional(),
  korName: z.string(),
  engName: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  abv: z.string().optional(),
  cask: z.string().optional(),
  volume: z.string().optional(),
  regionName: z.string().optional(),
  korCategory: z.string().optional(),
  selectedTags: z.array(z.string()).default([]),
});

const tastingEventAlcoholStatsPayloadSchema = z
  .looseObject({
    rating: z.number().nullable().optional(),
    totalRatingsCount: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

const tastingEventAlcoholItemPayloadSchema = z.looseObject({
  source: z.enum(['BOTTLE_NOTE', 'MANUAL']),
  alcohol: tastingEventAlcoholPayloadSchema,
  stats: tastingEventAlcoholStatsPayloadSchema,
  comment: z.string().nullable().optional(),
});

const pairingItemPayloadSchema = z.looseObject({
  itemName: z.string(),
  pairingNote: z.string(),
  itemImageUrl: z.string().nullable().optional(),
});

export const whiskyCurationPayloadItemSchema = tastingEventAlcoholItemPayloadSchema.extend({
  pairings: z.array(pairingItemPayloadSchema).optional(),
});

export const whiskyCurationPayloadSchema = z.array(whiskyCurationPayloadItemSchema);

export const whiskyCurationDetailPayloadSchema = z
  .union([whiskyCurationPayloadSchema, whiskyCurationPayloadItemSchema])
  .transform((payload) => (Array.isArray(payload) ? payload : [payload]));

export const whiskyCurationFormSchema = z.looseObject({
  name: z.string().min(1, '큐레이션명은 필수입니다.'),
  description: z.string(),
  imageUrls: z.array(z.string()).max(3, '이미지는 최대 3개까지 등록할 수 있습니다.'),
  exposureStartDate: z.string(),
  exposureEndDate: z.string(),
  displayOrder: z.number().int().min(0, '노출 순서는 0 이상이어야 합니다.'),
  isActive: z.boolean(),
  alcohols: whiskyCurationPayloadSchema,
});

export const whiskyTastingEventPayloadSchema = z.looseObject({
  eventDate: z.string(),
  eventTime: z.string(),
  placeName: z.string().optional(),
  kakaoPlaceId: z.string().optional(),
  barAddress: z.string(),
  detailAddress: z.string(),
  capacity: z.number(),
  entryFee: z.number(),
  isRecruiting: z.boolean().optional(),
  is_tbc: z.boolean().optional(),
  guideText: z.string(),
  applicationLink: z.string().optional(),
  alcohols: z.array(tastingEventAlcoholItemPayloadSchema),
});

export const whiskyTastingEventFormSchema = whiskyTastingEventPayloadSchema.extend({
  name: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()),
  exposureStartDate: z.string(),
  exposureEndDate: z.string(),
  displayOrder: z.number(),
  isActive: z.boolean(),
});

const programWhiskyListSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('array'),
  items: alcoholItemSchema,
  minItems: z.number().default(0),
  maxItems: z.number(),
  'x-field-style': z.literal('alcohol-card-list'),
});

const programItemRequestSpecSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    name: schemaNode,
    type: schemaNode,
    programDate: schemaNode,
    startTime: schemaNode,
    endTime: schemaNode,
    venue: schemaNode,
    host: schemaNode,
    description: schemaNode,
    applicationUrl: schemaNode,
    whiskies: programWhiskyListSchema,
  }),
});

export const programListRequestSpecSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('array'),
  items: programItemRequestSpecSchema,
  minItems: z.number(),
  maxItems: z.number(),
});

export const programRequestSpecSchema = z.looseObject({
  ...schemaNodeShape,
  type: z.literal('object'),
  required: z.array(z.string()),
  properties: z.looseObject({
    eventStartDate: schemaNode,
    eventEndDate: schemaNode,
    placeName: schemaNode,
    kakaoPlaceId: schemaNode,
    address: schemaNode,
    detailAddress: schemaNode,
    detailLocation: schemaNode,
    organizer: schemaNode,
    sponsor: schemaNode,
    entryFee: schemaNode,
    is_tbc: schemaNode,
    officialUrl: schemaNode,
    registrationUrl: schemaNode,
    programTags: schemaNode,
    programs: programListRequestSpecSchema,
  }),
});

const programItemPayloadSchema = z.looseObject({
  name: z.string(),
  type: z.enum(['MASTER_CLASS', 'TASTING', 'SEMINAR', 'BOOTH_EVENT', 'OTHER']),
  programDate: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  host: z.string().nullable().optional(),
  description: z.string(),
  applicationUrl: z.string().nullable().optional(),
  whiskies: z.array(tastingEventAlcoholItemPayloadSchema).optional(),
});

export const programPayloadSchema = z.looseObject({
  eventStartDate: z.string(),
  eventEndDate: z.string(),
  placeName: z.string(),
  kakaoPlaceId: z.string().optional(),
  address: z.string(),
  detailAddress: z.string().nullable().optional(),
  detailLocation: z.string().nullable().optional(),
  organizer: z.string().nullable().optional(),
  sponsor: z.string().nullable().optional(),
  entryFee: z.number().nullable().optional(),
  is_tbc: z.boolean().optional(),
  officialUrl: z.string().nullable().optional(),
  registrationUrl: z.string().nullable().optional(),
  programTags: z.array(z.string()).optional(),
  programs: z.array(programItemPayloadSchema),
});

export const programFormSchema = programPayloadSchema.extend({
  name: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()),
  exposureStartDate: z.string(),
  exposureEndDate: z.string(),
  displayOrder: z.number(),
  isActive: z.boolean(),
});

function getArrayDisplayName(spec: { 'x-display-name'?: string }, fallback: string) {
  return spec['x-display-name'] ?? fallback;
}

function addRequiredStringIssues(
  values: Record<string, unknown>,
  requiredKeys: string[] | undefined,
  properties: Record<string, unknown>,
  context: z.RefinementCtx,
  pathPrefix: Array<string | number> = []
) {
  requiredKeys?.forEach((key) => {
    const value = values[key];
    if (typeof value !== 'string' || value.trim().length > 0) return;

    const property = properties[key];
    const displayName =
      property && typeof property === 'object' && 'x-display-name' in property
        ? String(property['x-display-name'])
        : key;
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [...pathPrefix, key],
      message: `${displayName}은(는) 필수입니다.`,
    });
  });
}

function addAlcoholRequiredStringIssues(
  alcohols: WhiskyTastingEventPayload['alcohols'],
  spec: WhiskyTastingEventAlcoholListSchema,
  context: z.RefinementCtx,
  pathPrefix: Array<string | number>
) {
  alcohols.forEach((item, index) => {
    addRequiredStringIssues(
      item as Record<string, unknown>,
      spec.items.required,
      spec.items.properties,
      context,
      [...pathPrefix, index]
    );
    addRequiredStringIssues(
      item.alcohol as Record<string, unknown>,
      spec.items.properties.alcohol.required,
      spec.items.properties.alcohol.properties,
      context,
      [...pathPrefix, index, 'alcohol']
    );
  });
}

function createAlcoholListValidationSchema(
  spec: WhiskyTastingEventAlcoholListSchema,
  fallbackDisplayName: string
) {
  const displayName = getArrayDisplayName(spec, fallbackDisplayName);
  const selectedTagsSpec = spec.items.properties.alcohol.properties.selectedTags;
  const selectedTagsDisplayName = getArrayDisplayName(selectedTagsSpec, '테이스팅 태그');
  const alcoholItemValidationSchema = tastingEventAlcoholItemPayloadSchema.extend({
    alcohol: tastingEventAlcoholPayloadSchema.extend({
      selectedTags: z
        .array(z.string())
        .max(
          selectedTagsSpec.maxItems,
          `${selectedTagsDisplayName}는 최대 ${selectedTagsSpec.maxItems}개까지 추가할 수 있습니다.`
        ),
    }),
  });

  return z
    .array(alcoholItemValidationSchema)
    .min(spec.minItems, `${displayName}는 최소 ${spec.minItems}개 이상 추가해야 합니다.`)
    .max(spec.maxItems, `${displayName}는 최대 ${spec.maxItems}개까지 추가할 수 있습니다.`);
}

export function createWhiskyCurationFormValidationSchema(
  requestSpec: WhiskyCurationRequestSpec
) {
  const alcoholDisplayName =
    requestSpec.properties.alcohol['x-display-name'] ?? requestSpec['x-display-name'] ?? '라인업';
  const selectedTagsSpec = requestSpec.properties.alcohol.properties.selectedTags;
  const commentSpec = requestSpec.properties.comment;
  const pairingsSpec = requestSpec.properties.pairings;

  return whiskyCurationFormSchema.superRefine((values, context) => {
    if (values.alcohols.length < requestSpec.minItems) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alcohols'],
        message: `${alcoholDisplayName}은 최소 ${requestSpec.minItems}개 이상 추가해야 합니다.`,
      });
    }

    if (requestSpec.maxItems !== undefined && values.alcohols.length > requestSpec.maxItems) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alcohols'],
        message: `${alcoholDisplayName}은 최대 ${requestSpec.maxItems}개까지 추가할 수 있습니다.`,
      });
    }

    values.alcohols.forEach((item, index) => {
      addRequiredStringIssues(
        item as Record<string, unknown>,
        requestSpec.required,
        requestSpec.properties,
        context,
        ['alcohols', index]
      );
      addRequiredStringIssues(
        item.alcohol as Record<string, unknown>,
        requestSpec.properties.alcohol.required,
        requestSpec.properties.alcohol.properties,
        context,
        ['alcohols', index, 'alcohol']
      );

      if (item.alcohol.selectedTags.length > selectedTagsSpec.maxItems) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcohols', index, 'alcohol', 'selectedTags'],
          message: `테이스팅 태그는 최대 ${selectedTagsSpec.maxItems}개까지 추가할 수 있습니다.`,
        });
      }

      if (commentSpec.maxLength !== undefined && (item.comment?.length ?? 0) > commentSpec.maxLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcohols', index, 'comment'],
          message: `코멘트는 최대 ${commentSpec.maxLength}자까지 입력할 수 있습니다.`,
        });
      }

      if (!pairingsSpec) return;

      const pairings = item.pairings ?? [];
      if (pairings.length < pairingsSpec.minItems || pairings.length > pairingsSpec.maxItems) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcohols', index, 'pairings'],
          message: `페어링 음식은 ${pairingsSpec.minItems}-${pairingsSpec.maxItems}개까지 추가할 수 있습니다.`,
        });
      }

      pairings.forEach((pairing, pairingIndex) => {
        addRequiredStringIssues(
          pairing as Record<string, unknown>,
          pairingsSpec.items.required,
          pairingsSpec.items.properties,
          context,
          ['alcohols', index, 'pairings', pairingIndex]
        );

        (
          Object.entries(pairingsSpec.items.properties) as Array<
            [string, JsonSchemaNode | undefined]
          >
        ).forEach(([key, fieldSpec]) => {
          const value = pairing[key];
          if (
            fieldSpec?.maxLength === undefined ||
            typeof value !== 'string' ||
            value.length <= fieldSpec.maxLength
          ) {
            return;
          }

          const displayName = fieldSpec['x-display-name'] ?? key;
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['alcohols', index, 'pairings', pairingIndex, key],
            message: `${displayName}은 최대 ${fieldSpec.maxLength}자까지 입력할 수 있습니다.`,
          });
        });
      });
    });
  });
}

export function createWhiskyTastingEventFormValidationSchema(
  requestSpec: WhiskyTastingEventRequestSpec
) {
  return whiskyTastingEventFormSchema
    .extend({
      alcohols: createAlcoholListValidationSchema(requestSpec.properties.alcohols, '시음 위스키'),
    })
    .superRefine((values, context) => {
      addRequiredStringIssues(values, requestSpec.required, requestSpec.properties, context);
      addAlcoholRequiredStringIssues(values.alcohols, requestSpec.properties.alcohols, context, [
        'alcohols',
      ]);

      if (values.isRecruiting === true && !values.applicationLink?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['applicationLink'],
          message: '신청 링크은(는) 필수입니다.',
        });
      }
    });
}

export function createProgramFormValidationSchema(requestSpec: ProgramRequestSpec) {
  const programTagsSpec = requestSpec.properties.programTags;
  const programsSpec = requestSpec.properties.programs;
  const whiskiesSpec = programsSpec.items.properties.whiskies;
  const programTagsDisplayName = getArrayDisplayName(programTagsSpec, '프로그램 태그');
  const programsDisplayName = getArrayDisplayName(programsSpec, '프로그램');
  let programTagsValidationSchema = z.array(z.string());

  if (programTagsSpec.minItems !== undefined) {
    programTagsValidationSchema = programTagsValidationSchema.min(
      programTagsSpec.minItems,
      `${programTagsDisplayName}는 최소 ${programTagsSpec.minItems}개 이상 추가해야 합니다.`
    );
  }

  if (programTagsSpec.maxItems !== undefined) {
    programTagsValidationSchema = programTagsValidationSchema.max(
      programTagsSpec.maxItems,
      `${programTagsDisplayName}는 최대 ${programTagsSpec.maxItems}개까지 추가할 수 있습니다.`
    );
  }

  const whiskyListValidationSchema = createAlcoholListValidationSchema(whiskiesSpec, '시음 위스키');
  const programItemValidationSchema = programItemPayloadSchema.extend({
    whiskies: programsSpec.items.required.includes('whiskies')
      ? whiskyListValidationSchema
      : whiskyListValidationSchema.optional(),
  });
  const programsValidationSchema = z
    .array(programItemValidationSchema)
    .min(
      programsSpec.minItems,
      `${programsDisplayName}은 최소 ${programsSpec.minItems}개 이상 추가해야 합니다.`
    )
    .max(
      programsSpec.maxItems,
      `${programsDisplayName}은 최대 ${programsSpec.maxItems}개까지 추가할 수 있습니다.`
    );

  return programFormSchema
    .extend({
      programTags: requestSpec.required?.includes('programTags')
        ? programTagsValidationSchema
        : programTagsValidationSchema.optional(),
      programs: programsValidationSchema,
    })
    .superRefine((values, context) => {
      addRequiredStringIssues(values, requestSpec.required, requestSpec.properties, context);

      values.programs.forEach((program, index) => {
        addRequiredStringIssues(
          program as Record<string, unknown>,
          programsSpec.items.required,
          programsSpec.items.properties,
          context,
          ['programs', index]
        );

        if (program.whiskies) {
          addAlcoholRequiredStringIssues(program.whiskies, whiskiesSpec, context, [
            'programs',
            index,
            'whiskies',
          ]);
        }
      });
    });
}

export type WhiskyTastingEventRequestSpec = z.infer<typeof whiskyTastingEventRequestSpecSchema>;

export type WhiskyCurationRequestSpec = z.infer<typeof whiskyCurationRequestSpecSchema>;

export type WhiskyCurationPairingListSchema = z.infer<typeof pairingListSchema>;

export type WhiskyCurationPayload = z.infer<typeof whiskyCurationPayloadSchema>;

export type WhiskyCurationFormValues = z.infer<typeof whiskyCurationFormSchema>;

export type WhiskyTastingEventAlcoholListSchema = z.infer<
  typeof whiskyTastingEventAlcoholListSchema
>;

export type WhiskyTastingEventAlcoholItemSchema = z.infer<typeof alcoholItemSchema>;

export type WhiskyTastingEventPayload = z.infer<typeof whiskyTastingEventPayloadSchema>;

export type WhiskyTastingEventFormValues = z.infer<typeof whiskyTastingEventFormSchema>;

export type ProgramRequestSpec = z.infer<typeof programRequestSpecSchema>;

export type ProgramListRequestSpec = z.infer<typeof programListRequestSpecSchema>;

export type ProgramItemRequestSpec = z.infer<typeof programItemRequestSpecSchema>;

export type ProgramPayload = z.infer<typeof programPayloadSchema>;

export type ProgramFormValues = z.infer<typeof programFormSchema>;
