import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useWelcomeBannerFade(bannerRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const banner = bannerRef.current;

    if (!banner) {
      return;
    }

    const handleBannerFade = () => {
      banner.style.opacity = window.scrollY > 50 ? '0' : '1';
    };

    handleBannerFade();
    window.addEventListener('scroll', handleBannerFade);

    return () => {
      window.removeEventListener('scroll', handleBannerFade);
    };
  }, [bannerRef]);
}
