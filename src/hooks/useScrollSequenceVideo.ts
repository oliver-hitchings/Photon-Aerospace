import { useEffect } from 'react';
import type { RefObject } from 'react';
import { ASSETS } from '../constants/site';

type UseScrollSequenceVideoParams = {
  videoRef: RefObject<HTMLVideoElement>;
  scrollContainerRef: RefObject<HTMLDivElement>;
  hideLoadingScreen: () => void;
};

export function useScrollSequenceVideo({
  videoRef,
  scrollContainerRef,
  hideLoadingScreen
}: UseScrollSequenceVideoParams) {
  useEffect(() => {
    const video = videoRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (!video || !scrollContainer) {
      return;
    }

    let videoReady = false;
    let isScrolling = false;
    let rafId: number | null = null;
    let objectUrl: string | null = null;
    const abortController = new AbortController();

    const loadingTimeout = window.setTimeout(() => {
      hideLoadingScreen();
    }, 8000);

    const updateVideo = () => {
      if (!videoReady) {
        return;
      }

      const rect = scrollContainer.getBoundingClientRect();
      const denominator = Math.max(1, scrollContainer.scrollHeight - window.innerHeight);
      const scrollFraction = Math.max(0, Math.min(1, -rect.top / denominator));
      video.currentTime = scrollFraction * video.duration;
    };

    const onScroll = () => {
      if (isScrolling) {
        return;
      }

      isScrolling = true;
      rafId = window.requestAnimationFrame(() => {
        updateVideo();
        isScrolling = false;
      });
    };

    const onLoadedMetadata = () => {
      videoReady = true;
      window.clearTimeout(loadingTimeout);
      hideLoadingScreen();
      updateVideo();
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    window.addEventListener('scroll', onScroll);

    fetch(ASSETS.sequenceVideo, { signal: abortController.signal })
      .then((response) => response.blob())
      .then((blob) => {
        if (abortController.signal.aborted) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
      })
      .catch(() => {
        // Preserve timeout fallback behavior when fetch fails.
      });

    return () => {
      abortController.abort();
      window.clearTimeout(loadingTimeout);
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoRef, scrollContainerRef, hideLoadingScreen]);
}
