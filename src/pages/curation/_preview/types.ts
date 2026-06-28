export interface TastingEventPreviewAlcoholItem {
  stats?: {
    rating?: number | null;
    totalRatingsCount?: number;
  } | null;
  source?: string;
  alcohol: {
    alcoholId?: number | null;
    korName: string;
    engName?: string;
    imageUrl?: string;
    regionName?: string;
    korCategory?: string;
    selectedTags?: string[];
    abv?: string;
  };
  comment?: string | null;
}

export interface TastingEventPreviewPayload {
  capacity: number;
  entryFee: number;
  eventDate: string;
  eventTime: string;
  guideText?: string;
  placeName?: string;
  barAddress: string;
  detailAddress?: string;
  isRecruiting: boolean;
  applicationLink?: string;
  alcohols?: TastingEventPreviewAlcoholItem[];
}

export interface TastingEventPreviewData {
  name: string;
  description: string;
  coverImageUrl: string;
  imageUrls: string[];
  payload: TastingEventPreviewPayload;
}

export type TastingEventPreviewCta =
  | {
      type: 'apply';
      label: '시음회 신청하기';
      href: string;
    }
  | {
      type: 'closed';
      label: '모집 마감';
    }
  | {
      type: 'hidden';
    };

export interface TastingEventPreviewModel {
  title: string;
  description: string;
  coverImageUrl: string;
  imageUrls: string[];
  eventDateLabel: string;
  eventTimeLabel: string;
  eventDateTimeLabel: string;
  placeLabel: string;
  fullAddress: string;
  capacityLabel: string;
  entryFeeLabel: string;
  mapSearchUrl: string;
  guideText?: string;
  alcohols: TastingEventPreviewAlcoholItem[];
  cta: TastingEventPreviewCta;
}
