import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useFeatureCardBackgrounds(technologySectionRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const technologySection = technologySectionRef.current;
    const bgA = document.getElementById('feature-background-a');
    const bgB = document.getElementById('feature-background-b');

    if (!technologySection || !bgA || !bgB) {
      return;
    }

    const featureCards = technologySection.querySelectorAll<HTMLDivElement>('.feature-card');

    if (!featureCards.length) {
      return;
    }

    let activeBg: 'a' | 'b' = 'a';

    const switchBackground = (newImageUrl: string | null) => {
      if (!newImageUrl) {
        return;
      }

      const currentBgDiv = activeBg === 'a' ? bgA : bgB;
      if (currentBgDiv.style.backgroundImage.includes(newImageUrl)) {
        return;
      }

      const nextBgDiv = activeBg === 'a' ? bgB : bgA;
      nextBgDiv.style.backgroundImage = `url('${newImageUrl}')`;
      nextBgDiv.classList.add('active');
      currentBgDiv.classList.remove('active');
      activeBg = activeBg === 'a' ? 'b' : 'a';
    };

    const randomCard = featureCards[Math.floor(Math.random() * featureCards.length)];
    const initialBg = randomCard.getAttribute('data-background');

    if (initialBg) {
      bgA.style.backgroundImage = `url('${initialBg}')`;
      bgA.classList.add('active');
      technologySection.classList.add('bg-active');
    }

    const listeners: Array<() => void> = [];

    featureCards.forEach((card) => {
      const onMouseEnter = () => {
        switchBackground(card.getAttribute('data-background'));
      };

      card.addEventListener('mouseenter', onMouseEnter);
      listeners.push(() => {
        card.removeEventListener('mouseenter', onMouseEnter);
      });
    });

    return () => {
      listeners.forEach((dispose) => {
        dispose();
      });
    };
  }, [technologySectionRef]);
}
