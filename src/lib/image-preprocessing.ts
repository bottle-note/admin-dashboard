export const DEFAULT_IMAGE_QUALITY = 70;
export const MIN_IMAGE_QUALITY = 40;
export const MAX_IMAGE_QUALITY = 95;
export const IMAGE_QUALITY_STEP = 5;
export const WEBP_MIME_TYPE = 'image/webp';

export interface CropPixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImagePreprocessingOptions {
  /** 소스 이미지 좌표계 기준 크롭 영역 */
  crop: CropPixelArea;
  /** 결과 이미지의 최대 긴 변. 작은 이미지는 확대하지 않는다. */
  maxOutputLongEdge: number;
  /** 40~95 범위에서 5 단위로 지정하는 WebP 품질 */
  quality?: number;
  /** 호출자가 허용할 입력 MIME 목록. 생략하면 decode 가능한 모든 형식을 허용한다. */
  allowedMimeTypes?: readonly string[];
  /** 호출자가 정하는 최대 입력 크기(byte) */
  maxInputBytes?: number;
  /** 호출자가 정하는 최대 결과 크기(byte) */
  maxOutputBytes?: number;
  /** 결과 파일명. 확장자는 항상 .webp로 정규화한다. */
  outputFileName?: string;
}

export interface PreparedImageMetadata {
  original: {
    width: number;
    height: number;
    byteSize: number;
    mimeType: string;
  };
  output: {
    width: number;
    height: number;
    byteSize: number;
    mimeType: typeof WEBP_MIME_TYPE;
    quality: number;
  };
}

/** 향후 presign 업로드에 직접 전달할 수 있는 UI 비종속 전처리 결과 */
export interface PreparedImage {
  file: File;
  metadata: PreparedImageMetadata;
}

export type ImagePreprocessingErrorCode =
  | 'INVALID_QUALITY'
  | 'INVALID_CROP'
  | 'INVALID_MAX_OUTPUT_LONG_EDGE'
  | 'INVALID_BYTE_LIMIT'
  | 'UNSUPPORTED_MIME_TYPE'
  | 'INPUT_TOO_LARGE'
  | 'DECODE_FAILED'
  | 'CANVAS_UNAVAILABLE'
  | 'CANVAS_DRAW_FAILED'
  | 'ENCODING_FAILED'
  | 'WEBP_UNSUPPORTED'
  | 'OUTPUT_TOO_LARGE';

export class ImagePreprocessingError extends Error {
  readonly code: ImagePreprocessingErrorCode;
  readonly cause?: unknown;

  constructor(code: ImagePreprocessingErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ImagePreprocessingError';
    this.code = code;
    this.cause = cause;
  }
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

function validateQuality(quality: number) {
  if (
    !Number.isInteger(quality) ||
    quality < MIN_IMAGE_QUALITY ||
    quality > MAX_IMAGE_QUALITY ||
    quality % IMAGE_QUALITY_STEP !== 0
  ) {
    throw new ImagePreprocessingError(
      'INVALID_QUALITY',
      `이미지 품질은 ${MIN_IMAGE_QUALITY}~${MAX_IMAGE_QUALITY} 범위에서 ${IMAGE_QUALITY_STEP} 단위여야 합니다.`
    );
  }
}

function validateCropShape(crop: CropPixelArea) {
  const values = [crop.x, crop.y, crop.width, crop.height];
  if (
    values.some((value) => !Number.isFinite(value)) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width <= 0 ||
    crop.height <= 0
  ) {
    throw new ImagePreprocessingError(
      'INVALID_CROP',
      '크롭 좌표는 0 이상이고 크롭 너비와 높이는 0보다 큰 유한수여야 합니다.'
    );
  }
}

function validatePositiveInteger(value: number | undefined, label: string) {
  if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
    throw new ImagePreprocessingError('INVALID_BYTE_LIMIT', `${label}은 0보다 큰 정수여야 합니다.`);
  }
}

function validateOptions(input: Blob, options: ImagePreprocessingOptions) {
  const quality = options.quality ?? DEFAULT_IMAGE_QUALITY;
  validateQuality(quality);
  validateCropShape(options.crop);

  if (!Number.isInteger(options.maxOutputLongEdge) || options.maxOutputLongEdge <= 0) {
    throw new ImagePreprocessingError(
      'INVALID_MAX_OUTPUT_LONG_EDGE',
      '최대 출력 긴 변은 0보다 큰 정수여야 합니다.'
    );
  }

  validatePositiveInteger(options.maxInputBytes, '최대 입력 byte');
  validatePositiveInteger(options.maxOutputBytes, '최대 출력 byte');

  if (
    options.allowedMimeTypes &&
    !options.allowedMimeTypes.some(
      (mimeType) => mimeType.toLowerCase() === input.type.toLowerCase()
    )
  ) {
    throw new ImagePreprocessingError(
      'UNSUPPORTED_MIME_TYPE',
      `허용되지 않은 이미지 MIME 타입입니다: ${input.type || '(없음)'}`
    );
  }

  if (options.maxInputBytes !== undefined && input.size > options.maxInputBytes) {
    throw new ImagePreprocessingError(
      'INPUT_TOO_LARGE',
      `입력 이미지가 최대 크기(${options.maxInputBytes} byte)를 초과했습니다.`
    );
  }

  return quality;
}

function assertCropInsideSource(crop: CropPixelArea, sourceWidth: number, sourceHeight: number) {
  if (crop.x + crop.width > sourceWidth || crop.y + crop.height > sourceHeight) {
    throw new ImagePreprocessingError(
      'INVALID_CROP',
      `크롭 영역이 원본 이미지 범위(${sourceWidth}x${sourceHeight})를 벗어났습니다.`
    );
  }
}

function calculateOutputDimensions(crop: CropPixelArea, maxOutputLongEdge: number) {
  const scale = Math.min(1, maxOutputLongEdge / Math.max(crop.width, crop.height));
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
}

async function decodeWithHtmlImage(input: Blob, bitmapError?: unknown): Promise<DecodedImage> {
  let objectUrl: string | undefined;

  try {
    objectUrl = URL.createObjectURL(input);
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error('decode된 이미지의 크기가 유효하지 않습니다.');
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      // 이 함수에서 생성한 object URL만 이 함수가 소유하고 정리한다.
      cleanup: () => URL.revokeObjectURL(objectUrl!),
    };
  } catch (fallbackError) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new ImagePreprocessingError(
      'DECODE_FAILED',
      '이미지 파일을 decode하지 못했습니다.',
      bitmapError ?? fallbackError
    );
  }
}

async function decodeImage(input: Blob): Promise<DecodedImage> {
  let bitmapError: unknown;

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(input, { imageOrientation: 'from-image' });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        };
      }
      bitmap.close();
      bitmapError = new Error('decode된 ImageBitmap 크기가 유효하지 않습니다.');
    } catch (error) {
      bitmapError = error;
    }
  }

  return decodeWithHtmlImage(input, bitmapError);
}

function encodeCanvasToWebP(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new ImagePreprocessingError(
                'ENCODING_FAILED',
                'Canvas에서 WebP Blob을 생성하지 못했습니다.'
              )
            );
            return;
          }
          if (blob.type.toLowerCase() !== WEBP_MIME_TYPE) {
            reject(
              new ImagePreprocessingError(
                'WEBP_UNSUPPORTED',
                '현재 브라우저가 Canvas WebP encoding을 지원하지 않습니다.'
              )
            );
            return;
          }
          resolve(blob);
        },
        WEBP_MIME_TYPE,
        quality / 100
      );
    } catch (error) {
      reject(
        new ImagePreprocessingError(
          'ENCODING_FAILED',
          'Canvas WebP encoding 중 오류가 발생했습니다.',
          error
        )
      );
    }
  });
}

function toWebPFileName(input: Blob, outputFileName?: string) {
  const requestedName = outputFileName ?? (input instanceof File ? input.name : 'image');
  const baseName = requestedName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${baseName}.webp`;
}

/**
 * Blob/File을 decode한 뒤 지정 픽셀 영역을 crop·resize하고 WebP File로 반환한다.
 * 입력 Blob/File의 생명주기는 호출자가 소유하며, 내부 폴백용 object URL은 함수가 정리한다.
 */
export async function preprocessImageToWebP(
  input: File | Blob,
  options: ImagePreprocessingOptions
): Promise<PreparedImage> {
  const quality = validateOptions(input, options);
  const decoded = await decodeImage(input);

  try {
    assertCropInsideSource(options.crop, decoded.width, decoded.height);
    const dimensions = calculateOutputDimensions(options.crop, options.maxOutputLongEdge);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new ImagePreprocessingError(
        'CANVAS_UNAVAILABLE',
        '이미지 전처리를 위한 2D Canvas context를 생성하지 못했습니다.'
      );
    }

    try {
      context.drawImage(
        decoded.source,
        options.crop.x,
        options.crop.y,
        options.crop.width,
        options.crop.height,
        0,
        0,
        dimensions.width,
        dimensions.height
      );
    } catch (error) {
      throw new ImagePreprocessingError(
        'CANVAS_DRAW_FAILED',
        '이미지를 Canvas에 그리지 못했습니다.',
        error
      );
    }

    const encodedBlob = await encodeCanvasToWebP(canvas, quality);
    if (options.maxOutputBytes !== undefined && encodedBlob.size > options.maxOutputBytes) {
      throw new ImagePreprocessingError(
        'OUTPUT_TOO_LARGE',
        `결과 이미지가 최대 크기(${options.maxOutputBytes} byte)를 초과했습니다.`
      );
    }

    const file = new File([encodedBlob], toWebPFileName(input, options.outputFileName), {
      type: WEBP_MIME_TYPE,
    });

    return {
      file,
      metadata: {
        original: {
          width: decoded.width,
          height: decoded.height,
          byteSize: input.size,
          mimeType: input.type,
        },
        output: {
          width: dimensions.width,
          height: dimensions.height,
          byteSize: encodedBlob.size,
          mimeType: WEBP_MIME_TYPE,
          quality,
        },
      },
    };
  } finally {
    decoded.cleanup();
  }
}
