export interface ImageAspectRatioOption {
  label: string;
  /** null이면 크롭 영역의 가로·세로 비율을 고정하지 않는다. */
  value: number | null;
}

export interface ImageProcessingPolicy {
  allowedMimeTypes: readonly string[];
  aspectRatios: readonly ImageAspectRatioOption[];
  defaultAspectRatio: number | null;
  defaultQuality: number;
  maxInputBytes?: number;
  maxOutputBytes?: number;
  maxOutputLongEdge: number;
}

const COMMON_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const COMMON_ASPECT_RATIOS: readonly ImageAspectRatioOption[] = [
  { label: '자유 비율', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

export const DEFAULT_IMAGE_PROCESSING_POLICY: ImageProcessingPolicy = {
  allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
  aspectRatios: COMMON_ASPECT_RATIOS,
  defaultAspectRatio: null,
  defaultQuality: 70,
  maxOutputLongEdge: 1600,
};

export const CURATION_IMAGE_PROCESSING_POLICY: ImageProcessingPolicy = {
  ...DEFAULT_IMAGE_PROCESSING_POLICY,
  defaultAspectRatio: 16 / 9,
};

/** Product 홈 배너의 468 × 227px 표시 비율. */
export const BANNER_IMAGE_PROCESSING_POLICY: ImageProcessingPolicy = {
  ...DEFAULT_IMAGE_PROCESSING_POLICY,
  aspectRatios: [{ label: '배너 468:227', value: 468 / 227 }],
  defaultAspectRatio: 468 / 227,
};
