import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ToastContext, useToastState } from '@/hooks/useToast';

import { BannerMediaCard } from '../components/BannerMediaCard';

function Wrapper({ children }: { children: React.ReactNode }) {
  const toastState = useToastState();
  return <ToastContext.Provider value={toastState}>{children}</ToastContext.Provider>;
}

function renderWithToast(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

describe('BannerMediaCard', () => {
  const createFile = (name: string, type: string) => new File(['test'], name, { type });

  const defaultProps = {
    mediaPreviewUrl: null,
    posterPreviewUrl: null,
    mediaType: 'IMAGE' as const,
    onMediaChange: vi.fn(),
    isExtractingPoster: false,
    isUploading: false,
  };

  it('선택한 미디어 파일을 상위로 전달한다', () => {
    const onMediaChange = vi.fn();

    renderWithToast(<BannerMediaCard {...defaultProps} onMediaChange={onMediaChange} />);

    const input = document.querySelector('input[type="file"]')!;
    const videoFile = createFile('banner.mp4', 'video/mp4');
    fireEvent.change(input, { target: { files: [videoFile] } });

    expect(onMediaChange).toHaveBeenCalledWith(videoFile, expect.any(String));
  });

  it('허용되지 않은 파일은 상위로 전달하지 않는다', () => {
    const onMediaChange = vi.fn();

    renderWithToast(<BannerMediaCard {...defaultProps} onMediaChange={onMediaChange} />);

    const input = document.querySelector('input[type="file"]')!;
    const pdfFile = createFile('document.pdf', 'application/pdf');
    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(onMediaChange).not.toHaveBeenCalled();
  });

  it('이미지와 video/mp4를 허용한다', () => {
    renderWithToast(<BannerMediaCard {...defaultProps} />);

    const input = document.querySelector('input[type="file"]');
    expect(input?.getAttribute('accept')).toBe('image/*,video/mp4');
  });

  it('추출한 동영상 대표 이미지를 표시한다', () => {
    renderWithToast(
      <BannerMediaCard {...defaultProps} mediaType="VIDEO" posterPreviewUrl="blob:poster" />
    );

    expect(screen.getByAltText('추출된 동영상 대표 이미지')).toHaveAttribute('src', 'blob:poster');
  });

  it('동영상 대표 이미지 추출 상태를 표시한다', () => {
    renderWithToast(<BannerMediaCard {...defaultProps} isExtractingPoster={true} />);

    expect(screen.getByText('동영상 대표 이미지 추출 중...')).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeDisabled();
  });

  it('업로드 중 상태를 표시한다', () => {
    renderWithToast(<BannerMediaCard {...defaultProps} isUploading={true} />);

    expect(screen.getByText('파일 업로드 중...')).toBeInTheDocument();
  });

  it('에러 메시지를 표시한다', () => {
    renderWithToast(<BannerMediaCard {...defaultProps} error="미디어 파일을 업로드해주세요" />);

    expect(screen.getByText('미디어 파일을 업로드해주세요')).toBeInTheDocument();
  });
});
