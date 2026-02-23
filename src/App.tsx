import { useCallback, useRef, useState } from 'react';
import Navbar from './components/Navbar';
import TechnologySection from './components/TechnologySection';
import MissionRoadmapSection from './components/MissionRoadmapSection';
import TeamSection from './components/TeamSection';
import ContactSection from './components/ContactSection';
import SiteFooter from './components/SiteFooter';
import { useScrollSequenceVideo } from './hooks/useScrollSequenceVideo';
import { useWelcomeBannerFade } from './hooks/useWelcomeBannerFade';
import { useFeatureCardBackgrounds } from './hooks/useFeatureCardBackgrounds';

export default function App() {
  const [loadingHidden, setLoadingHidden] = useState(false);

  const bannerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const technologySectionRef = useRef<HTMLDivElement>(null);

  const hideLoadingScreen = useCallback(() => {
    setLoadingHidden(true);
  }, []);

  useScrollSequenceVideo({
    videoRef,
    scrollContainerRef,
    hideLoadingScreen
  });

  useWelcomeBannerFade(bannerRef);
  useFeatureCardBackgrounds(technologySectionRef);

  return (
    <>
      <div id="loading-screen" className={loadingHidden ? 'hidden' : ''}>
        <div className="loading-logo">PHOTON AEROSPACE</div>
        <div className="loading-spinner"></div>
      </div>

      <div id="welcome-banner" ref={bannerRef}>
        <h1>Welcome to the Future of Autonomous Flight</h1>
      </div>

      <div id="main-content">
        <Navbar />

        <div id="scroll-sequence-container" ref={scrollContainerRef}>
          <video id="scroll-video" ref={videoRef} muted playsInline preload="auto"></video>
        </div>

        <div id="rest-of-site">
          <TechnologySection sectionRef={technologySectionRef} />
          <MissionRoadmapSection />
          <TeamSection />
          <ContactSection />
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
