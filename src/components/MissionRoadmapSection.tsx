import { ASSETS } from '../constants/site';
import { useMissionDemo } from '../hooks/useMissionDemo';

export default function MissionRoadmapSection() {
  const shellRef = useMissionDemo();

  return (
    <div id="roadmap" className="section-wrapper roadmap-bg mission-roadmap">
      <section className="section-container mission-roadmap-container">
        <div className="mission-scroll-shell">
          <div className="mission-sticky-panel">
            <div className="mission-shell" id="mission-shell" ref={shellRef}>
              <div className="mission-toolbar">
                <div className="mission-toolbar-left">
                  <h3 className="mission-subtitle">Ground Control Simulation</h3>
                  <p className="mission-status" id="mission-mode-status">
                    Defence Mode Active
                  </p>
                </div>
                <div className="mission-mode-toggle" role="tablist" aria-label="Mission mode selector">
                  <button
                    id="mission-mode-defence"
                    className="mission-mode-button is-active"
                    type="button"
                    aria-pressed="true"
                  >
                    Defence
                  </button>
                  <button id="mission-mode-commercial" className="mission-mode-button" type="button" aria-pressed="false">
                    Commercial
                  </button>
                </div>
              </div>

              <div className="mission-main">
                <div className="mission-defence-view" id="mission-defence-view">
                  <div className="mission-stage-viewport" id="mission-stage-viewport">
                    <div className="mission-stage" id="mission-stage" aria-label="Defence mission map">
                      <img
                        id="mission-map-image"
                        src={ASSETS.desertMap}
                        alt="Desert compound satellite map for mission simulation"
                      />
                      <svg id="mission-overlay-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <filter id="missionGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"></feGaussianBlur>
                            <feMerge>
                              <feMergeNode in="coloredBlur"></feMergeNode>
                              <feMergeNode in="SourceGraphic"></feMergeNode>
                            </feMerge>
                          </filter>
                        </defs>
                        <g id="mission-camera-wedges"></g>
                        <polygon id="mission-polygon"></polygon>
                        <polyline id="mission-polygon-outline"></polyline>
                        <g id="mission-polygon-handles"></g>
                      </svg>
                      <div id="mission-operators-layer"></div>
                      <div id="mission-drones-layer"></div>
                    </div>
                  </div>

                  <div className="mission-camera-overlay" id="mission-camera-overlay">
                    <div className="mission-camera-header">
                      <strong id="mission-camera-title">Drone Feed</strong>
                      <span id="mission-camera-subtitle">Awaiting selection</span>
                    </div>
                    <div className="mission-camera-frame">
                      <img id="mission-camera-image" src={ASSETS.droneFeed} alt="Selected drone camera feed" />
                    </div>
                  </div>

                  <aside className="mission-telemetry-panel" id="mission-telemetry-panel">
                    <div className="mission-telemetry-header">
                      <h4>Telemetry</h4>
                      <p id="telemetry-entity">DR-1</p>
                    </div>
                    <div className="mission-operator-focus" id="mission-operator-focus" hidden></div>
                    <div className="mission-metric">
                      <span>Altitude</span>
                      <strong id="telemetry-altitude">0 m</strong>
                    </div>
                    <div className="mission-metric">
                      <span>Battery</span>
                      <strong id="telemetry-battery-text">98%</strong>
                    </div>
                    <div className="mission-battery-bar">
                      <div className="mission-battery-gradient"></div>
                      <div className="mission-battery-needle" id="telemetry-battery-needle"></div>
                    </div>
                    <div className="mission-metric">
                      <span>RTB Status</span>
                      <strong className="mission-rtb-ok" id="telemetry-rtb">
                        YES
                      </strong>
                    </div>
                    <div className="mission-metric mission-metric-secondary">
                      <span>Range @ 20 min</span>
                      <strong id="telemetry-range">0 km</strong>
                    </div>
                    <div className="mission-metric mission-metric-secondary">
                      <span>No-sun endurance</span>
                      <strong id="telemetry-endurance">0 h</strong>
                    </div>
                  </aside>
                </div>

                <div className="mission-commercial-view" id="mission-commercial-view" hidden>
                  <h3>Commercial Mode In Progress</h3>
                  <p>This view will be added next. For now, use Defence mode for the live mission demo.</p>
                  <button type="button" id="mission-back-defence" className="mission-return-button">
                    Back to Defence
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
