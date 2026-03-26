import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BannerImageCard } from '../components/BannerImageCard';
import { ToastContext, useToastState } from '@/hooks/useToast';
import type { MediaType } from '@/types/api';

// BannerImageCard는 useToast를 사용하므로 ToastProvider 래핑 필요
function Wrapper({ children }: { children: React.ReactNode }) {
  const toastState = useToastState();
  return (
    <ToastContext.Provider value={toastState}>
      {children}
    </ToastContext.Provider>
  );
}

function renderWithToast(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

// ============================================
// 2. mediaType 자동 판별 테스트
// ============================================

describe('BannerImageCard', () => {
  const createFile = (name: string, type: string) =>
    new File(['test'], name, { type });

  const defaultProps = {
    imagePreviewUrl: null,
    onImageChange: vi.fn(),
    onMediaTypeChange: vi.fn(),
    isUploading: false,
  };

  describe('mediaType 자동 판별', () => {
    it('이미지 파일 업로드 시 onMediaTypeChange("IMAGE")가 호출된다', () => {
      const onMediaTypeChange = vi.fn<(mediaType: MediaType) => void>();

      renderWithToast(
        <BannerImageCard
          {...defaultProps}
          onMediaTypeChange={onMediaTypeChange}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const imgFile = createFile('test.jpg', 'image/jpeg');
      fireEvent.change(input, { target: { files: [imgFile] } });

      expect(onMediaTypeChange).toHaveBeenCalledWith('IMAGE');
    });

    it('동영상 파일 업로드 시 onMediaTypeChange("VIDEO")가 호출된다', () => {
      const onMediaTypeChange = vi.fn<(mediaType: MediaType) => void>();

      renderWithToast(
        <BannerImageCard
          {...defaultProps}
          onMediaTypeChange={onMediaTypeChange}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const mp4File = createFile('banner.mp4', 'video/mp4');
      fireEvent.change(input, { target: { files: [mp4File] } });

      expect(onMediaTypeChange).toHaveBeenCalledWith('VIDEO');
    });

    it('WebP 파일 업로드 시 onMediaTypeChange("IMAGE")가 호출된다', () => {
      const onMediaTypeChange = vi.fn<(mediaType: MediaType) => void>();

      renderWithToast(
        <BannerImageCard
          {...defaultProps}
          onMediaTypeChange={onMediaTypeChange}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const webpFile = createFile('banner.webp', 'image/webp');
      fireEvent.change(input, { target: { files: [webpFile] } });

      expect(onMediaTypeChange).toHaveBeenCalledWith('IMAGE');
    });
  });

  describe('파일 거부', () => {
    it('허용되지 않은 파일은 업로드되지 않는다', () => {
      const onImageChange = vi.fn();
      const onMediaTypeChange = vi.fn();

      renderWithToast(
        <BannerImageCard
          {...defaultProps}
          onImageChange={onImageChange}
          onMediaTypeChange={onMediaTypeChange}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const pdfFile = createFile('document.pdf', 'application/pdf');
      fireEvent.change(input, { target: { files: [pdfFile] } });

      expect(onImageChange).not.toHaveBeenCalled();
      expect(onMediaTypeChange).not.toHaveBeenCalled();
    });
  });

  describe('accept 속성', () => {
    it('이미지와 video/mp4를 허용한다', () => {
      renderWithToast(<BannerImageCard {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input?.getAttribute('accept')).toBe('image/*,video/mp4');
    });
  });

  describe('UI 상태', () => {
    it('업로드 중 상태를 표시한다', () => {
      renderWithToast(
        <BannerImageCard {...defaultProps} isUploading={true} />
      );

      expect(screen.getByText('파일 업로드 중...')).toBeInTheDocument();
    });

    it('에러 메시지를 표시한다', () => {
      renderWithToast(
        <BannerImageCard {...defaultProps} error="미디어 파일을 업로드해주세요" />
      );

      expect(screen.getByText('미디어 파일을 업로드해주세요')).toBeInTheDocument();
    });

    it('카드 타이틀이 "배너 미디어"로 표시된다', () => {
      renderWithToast(<BannerImageCard {...defaultProps} />);

      expect(screen.getByText('배너 미디어 *')).toBeInTheDocument();
    });
  });
});
