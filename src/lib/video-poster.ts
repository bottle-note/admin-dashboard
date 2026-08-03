const POSTER_CAPTURE_TIME_SECONDS = 0.1;
const POSTER_MAX_LONG_EDGE = 1440;
const POSTER_WEBP_QUALITY = 0.85;
const VIDEO_LOAD_TIMEOUT_MS = 10_000;

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: 'loadedmetadata' | 'loadeddata' | 'seeked'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('동영상 프레임을 불러오는 데 실패했습니다.'));
    }, VIDEO_LOAD_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener(eventName, handleSuccess);
      video.removeEventListener('error', handleError);
    };

    const handleSuccess = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('지원하지 않는 MP4 형식이거나 손상된 파일입니다.'));
    };

    video.addEventListener(eventName, handleSuccess, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('동영상 대표 이미지를 생성하지 못했습니다.'));
          return;
        }

        if (blob.type !== 'image/webp') {
          reject(new Error('이 브라우저는 WebP 이미지 변환을 지원하지 않습니다.'));
          return;
        }

        resolve(blob);
      },
      'image/webp',
      POSTER_WEBP_QUALITY
    );
  });
}

/** MP4의 0.1초 프레임을 WebP poster File로 변환한다. */
export async function extractVideoPoster(videoFile: File): Promise<File> {
  if (videoFile.type !== 'video/mp4') {
    throw new Error('MP4 동영상만 대표 이미지를 추출할 수 있습니다.');
  }

  const objectUrl = URL.createObjectURL(videoFile);
  const video = document.createElement('video');

  try {
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    const metadataLoaded = waitForVideoEvent(video, 'loadedmetadata');
    video.load();
    await metadataLoaded;

    const captureTime =
      Number.isFinite(video.duration) && video.duration > POSTER_CAPTURE_TIME_SECONDS
        ? POSTER_CAPTURE_TIME_SECONDS
        : 0;

    if (captureTime > 0) {
      const seeked = waitForVideoEvent(video, 'seeked');
      video.currentTime = captureTime;
      await seeked;
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent(video, 'loadeddata');
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      throw new Error('동영상 해상도를 확인할 수 없습니다.');
    }

    const scale = Math.min(1, POSTER_MAX_LONG_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이 브라우저에서 동영상 대표 이미지를 생성할 수 없습니다.');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const posterBlob = await canvasToWebp(canvas);
    const baseName = videoFile.name.replace(/\.[^.]+$/, '');

    return new File([posterBlob], `${baseName}-poster.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
