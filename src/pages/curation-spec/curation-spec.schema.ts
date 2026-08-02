import { z } from 'zod';

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
  'x-field-style': z.string().optional(),
  'x-display-name': z.string().optional(),
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
    alcoholId: schemaNode,
    korName: schemaNode,
    engName: schemaNode,
    imageUrl: schemaNode,
    abv: schemaNode,
    cask: schemaNode,
    volume: schemaNode,
    regionName: schemaNode,
    korCategory: schemaNode,
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
  selectedTags: z.array(z.string()),
});

const tastingEventAlcoholStatsPayloadSchema = z
  .looseObject({
    rating: z.number().nullable().optional(),
    totalRatingsCount: z.number().optional(),
  })
  .nullable()
  .optional();

const tastingEventAlcoholItemPayloadSchema = z.looseObject({
  source: z.enum(['BOTTLE_NOTE', 'MANUAL']),
  alcohol: tastingEventAlcoholPayloadSchema,
  stats: tastingEventAlcoholStatsPayloadSchema,
  comment: z.string().nullable().optional(),
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

export type WhiskyTastingEventRequestSpec = z.infer<typeof whiskyTastingEventRequestSpecSchema>;

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
