import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/test-utils';
import type { PreparedImage } from '@/lib/image-preprocessing';

import { PreparedImageField, type ImageProcessingPolicy } from '../PreparedImageField';

vi.mock('../ImageCropDialog', () => ({
  ImageCropDialog: ({
    open,
    onPrepared,
  }: {
    open: boolean;
    onPrepared: (preparedImage: PreparedImage) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() =>
          onPrepared({
            file: new File(['processed-image'], 'region.webp', { type: 'image/webp' }),
            metadata: {
              original: {
                width: 2400,
                height: 1600,
                byteSize: 1_000_000,
                mimeType: 'image/jpeg',
              },
              output: {
                width: 1600,
                height: 1067,
                byteSize: 250_000,
                mimeType: 'image/webp',
                quality: 70,
              },
            },
          })
        }
      >
        크롭 적용
      </button>
    ) : null,
}));

const policy: ImageProcessingPolicy = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  aspectRatios: [
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
  ],
  defaultAspectRatio: 1,
  defaultQuality: 70,
  maxInputBytes: 20 * 1024 * 1024,
  maxOutputBytes: 5 * 1024 * 1024,
  maxOutputLongEdge: 1600,
};

describe('PreparedImageField', () => {
  it('기존 서버 이미지를 미리보기로 표시한다', () => {
    render(
      <PreparedImageField
        currentImageUrl="https://cdn.example.com/regions/scotland.webp"
        preparedImage={null}
        policy={policy}
        onPreparedImageChange={vi.fn()}
        onCancelPreparedImage={vi.fn()}
        onRemoveImage={vi.fn()}
      />
    );

    expect(screen.getByAltText('선택한 이미지 미리보기')).toHaveAttribute(
      'src',
      'https://cdn.example.com/regions/scotland.webp'
    );
    expect(screen.getByText('현재 저장된 이미지')).toBeInTheDocument();
  });

  it('허용되지 않은 MIME 타입은 크롭 다이얼로그를 열지 않는다', async () => {
    const user = userEvent.setup({ applyAccept: false });

    render(
      <PreparedImageField
        currentImageUrl={null}
        preparedImage={null}
        policy={policy}
        onPreparedImageChange={vi.fn()}
        onCancelPreparedImage={vi.fn()}
        onRemoveImage={vi.fn()}
      />
    );

    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['video'], 'region.mp4', { type: 'video/mp4' })
    );

    expect(screen.getByText('JPG, PNG, WEBP 이미지만 선택할 수 있습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '크롭 적용' })).not.toBeInTheDocument();
  });

  it('크롭 적용 후 실제 결과 metadata를 표시하고 PreparedImage를 부모에 전달한다', async () => {
    const user = userEvent.setup();
    const onPreparedImageChange = vi.fn();

    const { rerender } = render(
      <PreparedImageField
        currentImageUrl="https://cdn.example.com/regions/scotland.webp"
        preparedImage={null}
        policy={policy}
        onPreparedImageChange={onPreparedImageChange}
        onCancelPreparedImage={vi.fn()}
        onRemoveImage={vi.fn()}
      />
    );

    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['source-image'], 'region.jpg', { type: 'image/jpeg' })
    );
    await user.click(screen.getByRole('button', { name: '크롭 적용' }));

    expect(onPreparedImageChange).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ name: 'region.webp', type: 'image/webp' }),
      })
    );

    const preparedImage = onPreparedImageChange.mock.calls[0]![0] as PreparedImage;
    rerender(
      <PreparedImageField
        currentImageUrl="https://cdn.example.com/regions/scotland.webp"
        preparedImage={preparedImage}
        policy={policy}
        onPreparedImageChange={onPreparedImageChange}
        onCancelPreparedImage={vi.fn()}
        onRemoveImage={vi.fn()}
      />
    );

    expect(screen.getByText('새 이미지 (저장 전)')).toBeInTheDocument();
    expect(screen.getByText(/원본 2400 × 1600 · 1 MB/)).toBeInTheDocument();
    expect(screen.getByText(/결과 1600 × 1067 · 250 KB · -75.0%/)).toBeInTheDocument();
    expect(screen.getByText('WebP 품질 70%')).toBeInTheDocument();
  });

  it('삭제 의도는 부모에 위임한다', async () => {
    const user = userEvent.setup();
    const onRemoveImage = vi.fn();

    render(
      <PreparedImageField
        currentImageUrl="https://cdn.example.com/regions/scotland.webp"
        preparedImage={null}
        policy={policy}
        onPreparedImageChange={vi.fn()}
        onCancelPreparedImage={vi.fn()}
        onRemoveImage={onRemoveImage}
      />
    );

    await user.click(screen.getByRole('button', { name: '이미지 삭제' }));

    expect(onRemoveImage).toHaveBeenCalledOnce();
  });
});
