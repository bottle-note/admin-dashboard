export type CurationWhiskySource = 'BOTTLE_NOTE' | 'MANUAL';

export interface CurationWhiskyMirror {
  alcoholId: number | null;
  korName: string;
  engName?: string;
  imageUrl?: string | null;
  abv?: string;
  cask?: string;
  volume?: string;
  regionName?: string;
  korCategory?: string;
  selectedTags: string[];
}

export interface CurationWhiskyCardValue {
  source: CurationWhiskySource;
  alcohol: CurationWhiskyMirror;
  comment?: string | null;
}

export interface CurationWhiskyCardListFormValues {
  alcohols: CurationWhiskyCardValue[];
}

export interface CurationWhiskyCardListFieldModel {
  key: string;
  kind: 'alcohol-card-list';
  label: string;
  required: boolean;
  minItems: number;
  maxItems: number;
  selectedTags: {
    label: string;
    required: boolean;
    minItems: number;
    maxItems: number;
  };
  comment: {
    label: string;
    required: boolean;
    maxLength: number;
  };
}
