import { ASSETS } from '../constants/site';
import type { RefObject } from 'react';

type TechnologySectionProps = {
  sectionRef: RefObject<HTMLDivElement>;
};

export default function TechnologySection({ sectionRef }: TechnologySectionProps) {
  return (
    <div id="technology" className="section-wrapper technology-bg" ref={sectionRef}>
      <div className="feature-background" id="feature-background-a"></div>
      <div className="feature-background" id="feature-background-b"></div>

      <section className="section-container">
        <h2 className="section-title">Core Technology</h2>
        <div className="features-grid">
          <div className="feature-card" data-background={ASSETS.featurePerpetualSolarFlight}>
            <div className="feature-icon">⚡️</div>
            <h3 className="feature-title">Perpetual Solar Flight</h3>
            <p className="feature-description">
              Advanced photovoltaic cells integrated into a 6-meter wingspan, coupled with hyper-efficient battery
              storage, enable indefinite flight endurance powered solely by the sun.
            </p>
          </div>
          <div className="feature-card" data-background={ASSETS.featureModularPayload}>
            <div className="feature-icon">📦</div>
            <h3 className="feature-title">Modular Payload System</h3>
            <p className="feature-description">
              A versatile bay allows for hot-swappable sensor packages, from high-resolution optical cameras to
              advanced signals intelligence (SIGINT) equipment, tailoring the drone to any mission.
            </p>
          </div>
          <div className="feature-card" data-background={ASSETS.featureAiAutonomy}>
            <div className="feature-icon">🧠</div>
            <h3 className="feature-title">AI-Driven Autonomy</h3>
            <p className="feature-description">
              On-board processing with our proprietary AI flight controller ensures fully autonomous operation, from
              navigation and obstacle avoidance to dynamic mission re-tasking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
