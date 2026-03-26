import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { isFileTypeAllowed, isVideoFile, ImageUpload } from '../ImageUpload';

// ============================================
// 1. 파일 검증 유틸리티 테스트
// ============================================

describe('isFileTypeAllowed', () => {
  describe('와일드카드 매칭 (image/*)', () => {
    const accept = 'image/*';

    it('image/jpeg → 허용', () => {
      expect(isFileTypeAllowed('image/jpeg', accept)).toBe(true);
    });

    it('image/png → 허용', () => {
      expect(isFileTypeAllowed('image/png', accept)).toBe(true);
    });

    it('image/webp → 허용', () => {
      expect(isFileTypeAllowed('image/webp', accept)).toBe(true);
    });

    it('image/svg+xml → 허용', () => {
      expect(isFileTypeAllowed('image/svg+xml', accept)).toBe(true);
    });

    it('video/mp4 → 거부', () => {
      expect(isFileTypeAllowed('video/mp4', accept)).toBe(false);
    });

    it('application/pdf → 거부', () => {
      expect(isFileTypeAllowed('application/pdf', accept)).toBe(false);
    });
  });

  describe('복합 accept (image/*,video/mp4)', () => {
    const accept = 'image/*,video/mp4';

    it('image/jpeg → 허용', () => {
      expect(isFileTypeAllowed('image/jpeg', accept)).toBe(true);
    });

    it('video/mp4 → 허용', () => {
      expect(isFileTypeAllowed('video/mp4', accept)).toBe(true);
    });

    it('video/webm → 거부', () => {
      expect(isFileTypeAllowed('video/webm', accept)).toBe(false);
    });

    it('application/exe → 거부', () => {
      expect(isFileTypeAllowed('application/x-msdownload', accept)).toBe(false);
    });
  });

  describe('공백 포함 패턴', () => {
    it('쉼표 뒤 공백이 있어도 정상 동작한다', () => {
      expect(isFileTypeAllowed('video/mp4', 'image/*, video/mp4')).toBe(true);
    });
  });

  describe('빈 타입', () => {
    it('빈 문자열 MIME 타입은 거부된다', () => {
      expect(isFileTypeAllowed('', 'image/*')).toBe(false);
    });
  });
});

describe('isVideoFile', () => {
  describe('File 오버로드', () => {
    it('video/mp4 File → true', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      expect(isVideoFile(file)).toBe(true);
    });

    it('video/webm File → true', () => {
      const file = new File([''], 'test.webm', { type: 'video/webm' });
      expect(isVideoFile(file)).toBe(true);
    });

    it('image/png File → false', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(isVideoFile(file)).toBe(false);
    });

    it('null → false', () => {
      expect(isVideoFile(null as unknown as File)).toBe(false);
    });
  });

  describe('URL 오버로드', () => {
    it('.mp4 확장자 → true', () => {
      expect(isVideoFile('https://cdn.example.com/banner.mp4')).toBe(true);
    });

    it('.webm 확장자 → true', () => {
      expect(isVideoFile('https://cdn.example.com/banner.webm')).toBe(true);
    });

    it('.mov 확장자 → true', () => {
      expect(isVideoFile('https://cdn.example.com/banner.mov')).toBe(true);
    });

    it('쿼리 파라미터가 붙어도 정상 판별한다', () => {
      expect(isVideoFile('https://cdn.example.com/banner.mp4?token=abc123')).toBe(true);
    });

    it('대소문자 무관하게 판별한다', () => {
      expect(isVideoFile('https://cdn.example.com/banner.MP4')).toBe(true);
    });

    it('.jpg 확장자 → false', () => {
      expect(isVideoFile('https://cdn.example.com/banner.jpg')).toBe(false);
    });

    it('확장자 없는 URL → false', () => {
      expect(isVideoFile('https://cdn.example.com/banner')).toBe(false);
    });

    it('blob URL → false (확장자 없음)', () => {
      expect(isVideoFile('blob:http://localhost:5173/abc-123-def')).toBe(false);
    });

    it('null → false', () => {
      expect(isVideoFile(null as unknown as string)).toBe(false);
    });
  });
});

// ============================================
// 3. 파일 거부 + 4. 미리보기 렌더링 분기
// ============================================

describe('ImageUpload 컴포넌트', () => {
  const createFile = (name: string, type: string) =>
    new File(['test'], name, { type });

  describe('파일 거부 시 콜백', () => {
    it('허용되지 않은 파일은 onFileRejected를 호출한다', () => {
      const onImageChange = vi.fn();
      const onFileRejected = vi.fn();

      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={onImageChange}
          accept="image/*"
          onFileRejected={onFileRejected}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const pdfFile = createFile('test.pdf', 'application/pdf');

      fireEvent.change(input, { target: { files: [pdfFile] } });

      expect(onFileRejected).toHaveBeenCalledWith(pdfFile);
      expect(onImageChange).not.toHaveBeenCalled();
    });

    it('허용된 파일은 onImageChange를 호출한다', () => {
      const onImageChange = vi.fn();
      const onFileRejected = vi.fn();

      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={onImageChange}
          accept="image/*,video/mp4"
          onFileRejected={onFileRejected}
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const imgFile = createFile('test.jpg', 'image/jpeg');

      fireEvent.change(input, { target: { files: [imgFile] } });

      expect(onFileRejected).not.toHaveBeenCalled();
      expect(onImageChange).toHaveBeenCalledWith(imgFile, expect.any(String));
    });
  });

  describe('미리보기 렌더링 분기', () => {
    it('이미지 URL이면 <img> 태그를 렌더링한다', () => {
      render(
        <ImageUpload
          imageUrl="https://cdn.example.com/banner.jpg"
          onImageChange={vi.fn()}
        />
      );

      expect(screen.getByAltText('업로드된 이미지')).toBeInTheDocument();
      expect(document.querySelector('video')).toBeNull();
    });

    it('비디오 CDN URL이면 <video> 태그를 렌더링한다', () => {
      render(
        <ImageUpload
          imageUrl="https://cdn.example.com/banner.mp4"
          onImageChange={vi.fn()}
        />
      );

      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.getAttribute('src')).toBe('https://cdn.example.com/banner.mp4');
      expect(video.hasAttribute('controls')).toBe(true);
      expect(video.loop).toBe(true);
      // muted는 React에서 DOM property로 설정됨 (hasAttribute로 확인 불가)
      expect(video.muted).toBe(true);
    });

    it('비디오 파일 업로드 시 blob URL이어도 <video> 태그를 렌더링한다', () => {
      const onImageChange = vi.fn();

      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={onImageChange}
          accept="image/*,video/mp4"
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const mp4File = createFile('banner.mp4', 'video/mp4');

      fireEvent.change(input, { target: { files: [mp4File] } });

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(screen.queryByAltText('업로드된 이미지')).toBeNull();
    });

    it('비디오 파일 업로드 후 imageUrl prop이 blob URL로 변경되어도 <video>를 유지한다', () => {
      const onImageChange = vi.fn();

      const { rerender } = render(
        <ImageUpload
          imageUrl={null}
          onImageChange={onImageChange}
          accept="image/*,video/mp4"
        />
      );

      // 1. 비디오 파일 업로드
      const input = document.querySelector('input[type="file"]')!;
      const mp4File = createFile('banner.mp4', 'video/mp4');
      fireEvent.change(input, { target: { files: [mp4File] } });

      // 2. handleFile에서 blob URL이 생성되어 onImageChange로 전달됨
      const blobUrl = onImageChange.mock.calls[0][1] as string;
      expect(blobUrl).toMatch(/^blob:/);

      // 3. 부모가 imageUrl prop을 blob URL로 다시 내려줌 (실제 앱 동작)
      rerender(
        <ImageUpload
          imageUrl={blobUrl}
          onImageChange={onImageChange}
          accept="image/*,video/mp4"
        />
      );

      // 4. <video>가 유지되어야 함 (<img>로 바뀌면 엑박)
      expect(document.querySelector('video')).toBeInTheDocument();
      expect(screen.queryByAltText('업로드된 이미지')).toBeNull();
    });

    it('이미지 파일 업로드 시 <img> 태그를 렌더링한다', () => {
      const onImageChange = vi.fn();

      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={onImageChange}
          accept="image/*,video/mp4"
        />
      );

      const input = document.querySelector('input[type="file"]')!;
      const jpgFile = createFile('banner.jpg', 'image/jpeg');

      fireEvent.change(input, { target: { files: [jpgFile] } });

      expect(screen.getByAltText('업로드된 이미지')).toBeInTheDocument();
      expect(document.querySelector('video')).toBeNull();
    });
  });

  describe('accept 속성', () => {
    it('기본값은 image/*', () => {
      render(
        <ImageUpload imageUrl={null} onImageChange={vi.fn()} />
      );

      const input = document.querySelector('input[type="file"]');
      expect(input?.getAttribute('accept')).toBe('image/*');
    });

    it('커스텀 accept가 반영된다', () => {
      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={vi.fn()}
          accept="image/*,video/mp4"
        />
      );

      const input = document.querySelector('input[type="file"]');
      expect(input?.getAttribute('accept')).toBe('image/*,video/mp4');
    });
  });

  describe('커스텀 텍스트', () => {
    it('description과 supportText가 반영된다', () => {
      render(
        <ImageUpload
          imageUrl={null}
          onImageChange={vi.fn()}
          description="파일을 드래그하세요"
          supportText="MP4, PNG 지원"
        />
      );

      expect(screen.getByText('파일을 드래그하세요')).toBeInTheDocument();
      expect(screen.getByText('MP4, PNG 지원')).toBeInTheDocument();
    });
  });
});
