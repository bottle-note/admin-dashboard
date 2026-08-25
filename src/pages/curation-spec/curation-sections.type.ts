import type { JsonSchemaNode } from '@/types/api';

export type AlcoholSectionConfig = {
  itemLabel: string;
  emptyMessage: string;
  fields: Partial<
    Record<
      | 'korName'
      | 'engName'
      | 'imageUrl'
      | 'abv'
      | 'volume'
      | 'cask'
      | 'regionName'
      | 'korCategory'
      | 'selectedTags'
      | 'comment',
      {
        label?: string;
      }
    >
  >;
};

export type CurationSpecSections = Record<
  string,
  {
    subtitle: string;
    contentClassName: string;
    fields: Record<
      string,
      {
        schema: JsonSchemaNode;
        required: boolean;
        label?: string;
        className?: string;
        disabledWhen?: {
          field: string;
          equals: unknown;
        };
        requiredWhen?: {
          field: string;
          equals: unknown;
        };
        setValueWhenChecked?: {
          field: string;
          value: unknown;
        };
        optionLabels?: Record<string, string>;
        alcohol?: AlcoholSectionConfig;
        pairing?: {
          itemLabel: string;
          addButtonLabel: string;
          fields: Partial<
            Record<
              'itemName' | 'pairingNote' | 'itemImageUrl',
              {
                label?: string;
                placeholder?: string;
              }
            >
          >;
        };
        program?: {
          itemLabel: string;
          addButtonLabel: string;
          fields: Record<
            string,
            {
              className?: string;
              optionLabels?: Record<string, string>;
              title?: string;
              subtitle?: string;
              alcohol?: AlcoholSectionConfig;
            }
          >;
        };
      }
    >;
  }
>;
