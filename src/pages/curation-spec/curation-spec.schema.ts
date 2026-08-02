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

const tastingEventAlcoholItemPayloadSchema = z.looseObject({
  source: z.enum(['BOTTLE_NOTE', 'MANUAL']),
  alcohol: tastingEventAlcoholPayloadSchema,
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

export type WhiskyTastingEventRequestSpec = z.infer<typeof whiskyTastingEventRequestSpecSchema>;

export type WhiskyTastingEventAlcoholListSchema = z.infer<
  typeof whiskyTastingEventAlcoholListSchema
>;

export type WhiskyTastingEventAlcoholItemSchema = z.infer<typeof alcoholItemSchema>;

export type WhiskyTastingEventPayload = z.infer<typeof whiskyTastingEventPayloadSchema>;
