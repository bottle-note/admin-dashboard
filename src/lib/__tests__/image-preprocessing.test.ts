import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ImagePreprocessingError,
  preprocessImageToWebP,
  type ImagePreprocessingErrorCode,
} from '../image-preprocessing';

const createBitmap = (width = 1200, height = 800) => ({
  width,
  height,
  close: vi.fn(),
});

async function expectPreprocessingError(
  promise: Promise<unknown>,
  code: ImagePreprocessingErrorCode
) {
  try {
    await promise;
    throw new Error('이미지 전처리가 실패해야 합니다.');
  } catch (error) {
    expect(error).toBeInstanceOf(ImagePreprocessingError);
    expect((error as ImagePreprocessingError).code).toBe(code);
  }
}

describe('preprocessImageToWebP', () => {
  const drawImage = vi.fn();

  beforeEach(() => {
    drawImage.mockReset();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(createBitmap()));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => {
      callback(new Blob(['encoded-webp'], { type: type ?? 'image/webp' }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('크롭 영역을 긴 변 기준으로 축소하고 기본 품질 70의 WebP File을 반환한다', async () => {
    const bitmap = createBitmap();
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap as unknown as ImageBitmap);
    const input = new File(['source'], 'region.png', { type: 'image/png' });

    const result = await preprocessImageToWebP(input, {
      crop: { x: 100, y: 50, width: 800, height: 400 },
      maxOutputLongEdge: 400,
    });

    expect(createImageBitmap).toHaveBeenCalledWith(input, {
      imageOrientation: 'from-image',
    });
    expect(drawImage).toHaveBeenCalledWith(bitmap, 100, 50, 800, 400, 0, 0, 400, 200);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/webp',
      0.7
    );
    expect(result.file).toBeInstanceOf(File);
    expect(result.file.name).toBe('region.webp');
    expect(result.file.type).toBe('image/webp');
    expect(result.metadata).toEqual({
      original: {
        width: 1200,
        height: 800,
        byteSize: input.size,
        mimeType: 'image/png',
      },
      output: {
        width: 400,
        height: 200,
        byteSize: result.file.size,
        mimeType: 'image/webp',
        quality: 70,
      },
    });
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('원본 크롭 영역이 최대 긴 변보다 작으면 확대하지 않고 지정 품질을 적용한다', async () => {
    const result = await preprocessImageToWebP(
      new File(['source'], 'small.jpeg', { type: 'image/jpeg' }),
      {
        crop: { x: 0, y: 0, width: 200, height: 100 },
        maxOutputLongEdge: 500,
        quality: 85,
        outputFileName: 'prepared.webp',
      }
    );

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 200, 100, 0, 0, 200, 100);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/webp',
      0.85
    );
    expect(result.file.name).toBe('prepared.webp');
    expect(result.metadata.output.width).toBe(200);
    expect(result.metadata.output.height).toBe(100);
  });

  it('createImageBitmap 실패 시 HTMLImageElement.decode로 폴백하고 내부 object URL을 정리한다', async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error('bitmap decode failed'));
    const decode = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.fn().mockReturnValue('blob:fallback-source');
    const revokeObjectURL = vi.fn();
    const OriginalURL = URL;

    class MockImage {
      naturalWidth = 640;
      naturalHeight = 480;
      src = '';
      decode = decode;
    }

    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal(
      'URL',
      class extends OriginalURL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      }
    );

    await preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
      crop: { x: 0, y: 0, width: 320, height: 240 },
      maxOutputLongEdge: 320,
    });

    expect(decode).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fallback-source');
  });

  it('두 decode 경로가 모두 실패하면 object URL을 정리하고 DECODE_FAILED를 반환한다', async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error('bitmap decode failed'));
    const decode = vi.fn().mockRejectedValue(new Error('image decode failed'));
    const revokeObjectURL = vi.fn();
    const OriginalURL = URL;

    class MockImage {
      naturalWidth = 0;
      naturalHeight = 0;
      src = '';
      decode = decode;
    }

    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal(
      'URL',
      class extends OriginalURL {
        static createObjectURL = vi.fn().mockReturnValue('blob:invalid-source');
        static revokeObjectURL = revokeObjectURL;
      }
    );

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['invalid'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'DECODE_FAILED'
    );

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:invalid-source');
    expect(drawImage).not.toHaveBeenCalled();
  });

  it.each([39, 42, 100])('허용 단계가 아닌 품질 %s를 거부한다', async (quality) => {
    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
        quality,
      }),
      'INVALID_QUALITY'
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('소스 범위를 벗어난 크롭 영역을 거부하고 ImageBitmap을 정리한다', async () => {
    const bitmap = createBitmap(300, 200);
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap as unknown as ImageBitmap);

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 250, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'INVALID_CROP'
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('0 이하인 크롭 크기와 최대 긴 변을 decode 전에 거부한다', async () => {
    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 0, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'INVALID_CROP'
    );
    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 0,
      }),
      'INVALID_MAX_OUTPUT_LONG_EDGE'
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('caller가 제공한 MIME과 입력 byte 제한을 적용한다', async () => {
    const input = new Blob(['12345'], { type: 'image/gif' });

    await expectPreprocessingError(
      preprocessImageToWebP(input, {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
      }),
      'UNSUPPORTED_MIME_TYPE'
    );
    await expectPreprocessingError(
      preprocessImageToWebP(input, {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
        maxInputBytes: 4,
      }),
      'INPUT_TOO_LARGE'
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('caller가 제공한 출력 byte 제한을 초과하면 실패한다', async () => {
    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
        maxOutputBytes: 3,
      }),
      'OUTPUT_TOO_LARGE'
    );
  });

  it('Canvas context 생성 실패를 구분 가능한 에러로 반환하고 ImageBitmap을 정리한다', async () => {
    const bitmap = createBitmap();
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap as unknown as ImageBitmap);
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'CANVAS_UNAVAILABLE'
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('Canvas draw와 WebP encode 실패를 각각 구분 가능한 에러로 반환한다', async () => {
    drawImage.mockImplementationOnce(() => {
      throw new Error('draw failed');
    });

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'CANVAS_DRAW_FAILED'
    );

    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementationOnce((callback) => {
      callback(null);
    });

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'ENCODING_FAILED'
    );
  });

  it('Canvas가 WebP가 아닌 MIME으로 encode하면 WEBP_UNSUPPORTED를 반환한다', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementationOnce((callback) => {
      callback(new Blob(['encoded-png'], { type: 'image/png' }));
    });

    await expectPreprocessingError(
      preprocessImageToWebP(new Blob(['source'], { type: 'image/png' }), {
        crop: { x: 0, y: 0, width: 100, height: 100 },
        maxOutputLongEdge: 100,
      }),
      'WEBP_UNSUPPORTED'
    );
  });
});
