import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/test-utils';

import { ImageCropDialog } from '../ImageCropDialog';

const { preprocessImageToWebP } = vi.hoisted(() => ({
  preprocessImageToWebP: vi.fn(),
}));

vi.mock('react-image-crop', () => ({
  default: ({
    aspect,
    children,
    onComplete,
    renderSelectionAddon,
  }: {
    aspect?: number;
    children: React.ReactNode;
    onComplete: (crop: { unit: 'px'; x: number; y: number; width: number; height: number }) => void;
    renderSelectionAddon?: () => React.ReactNode;
  }) => (
    <div data-testid="crop-editor" data-aspect={aspect === undefined ? 'free' : String(aspect)}>
      <button
        type="button"
        onClick={() => onComplete({ unit: 'px', x: 10, y: 20, width: 300, height: 150 })}
      >
        크롭 영역 변경
      </button>
      {children}
      {renderSelectionAddon?.()}
    </div>
  ),
  centerCrop: <T,>(crop: T) => crop,
  makeAspectCrop: <T,>(crop: T) => crop,
}));

vi.mock('@/lib/image-preprocessing', () => ({
  ImagePreprocessingError: class ImagePreprocessingError extends Error {},
  preprocessImageToWebP,
}));

const policy = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  aspectRatios: [
    { label: '자유 비율', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
  ],
  defaultAspectRatio: 1,
  defaultQuality: 70,
  maxInputBytes: 20 * 1024 * 1024,
  maxOutputBytes: 5 * 1024 * 1024,
  maxOutputLongEdge: 1600,
} as const;

afterEach(() => {
  vi.restoreAllMocks();
  preprocessImageToWebP.mockReset();
});

describe('ImageCropDialog', () => {
  it('자유 비율에서 크롭 영역을 드래그·리사이즈한 픽셀 좌표를 원본 좌표계로 변환한다', async () => {
    const user = userEvent.setup();
    const file = new File(['source'], 'region.jpg', { type: 'image/jpeg' });
    const preparedImage = {
      file: new File(['output'], 'region.webp', { type: 'image/webp' }),
      metadata: {
        original: { width: 1000, height: 500, byteSize: 1_000_000, mimeType: 'image/jpeg' },
        output: {
          width: 1000,
          height: 500,
          byteSize: 250_000,
          mimeType: 'image/webp' as const,
          quality: 70,
        },
      },
    };
    const onPrepared = vi.fn();
    const onOpenChange = vi.fn();
    preprocessImageToWebP.mockResolvedValue(preparedImage);

    render(
      <ImageCropDialog
        file={file}
        open
        policy={policy}
        onOpenChange={onOpenChange}
        onPrepared={onPrepared}
      />
    );

    const image = await screen.findByAltText('크롭할 원본 이미지');
    Object.defineProperties(image, {
      width: { configurable: true, value: 500 },
      height: { configurable: true, value: 250 },
      naturalWidth: { configurable: true, value: 1000 },
      naturalHeight: { configurable: true, value: 500 },
    });
    fireEvent.load(image);

    expect(screen.getByTestId('crop-editor')).toHaveAttribute('data-aspect', '1');

    await user.selectOptions(screen.getByLabelText('크롭 비율'), 'free');
    expect(screen.getByTestId('crop-editor')).toHaveAttribute('data-aspect', 'free');
    expect(await screen.findByLabelText('원본 기준 크롭 900 × 450px')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '크롭 영역 변경' }));
    expect(await screen.findByLabelText('원본 기준 크롭 600 × 300px')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '크롭 적용' }));

    await waitFor(() => {
      expect(preprocessImageToWebP).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          crop: { x: 20, y: 40, width: 600, height: 300 },
          quality: 70,
        })
      );
    });
    expect(onPrepared).toHaveBeenCalledWith(preparedImage);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
