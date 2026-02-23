import { ASSETS } from '../constants/site';

export interface Point {
    x: number;
    y: number;
}

export interface LayoutState {
    scale: number;
    offsetX: number;
    offsetY: number;
    viewportWidth: number;
    viewportHeight: number;
}

export interface Selection {
    type: 'drone' | 'operator';
    id: string;
}

export interface Operator {
    id: string;
    x: number;
    y: number;
    element: HTMLButtonElement | null;
}

export interface Drone extends Record<string, unknown> {
    id: string;
    x: number;
    y: number;
    target: Point;
    coverageAnchor: Point;
    heading: number;
    cameraHeading: number;
    phase: number;
    marker: HTMLButtonElement | null;
    iconWrap: HTMLElement | null;
    wedgePath: SVGPathElement | null;
    assignedOperatorId: string | null;
    trackedOperatorId: string | null;
}

export interface MissionRefs {
    shell: HTMLElement | null;
    modeStatus: HTMLElement | null;
    defenceButton: HTMLButtonElement | null;
    commercialButton: HTMLButtonElement | null;
    backToDefenceButton: HTMLButtonElement | null;
    defenceView: HTMLElement | null;
    commercialView: HTMLElement | null;
    stageViewport: HTMLElement | null;
    stage: HTMLElement | null;
    mapImage: HTMLImageElement | null;
    overlaySvg: SVGSVGElement | null;
    wedgesGroup: SVGGElement | null;
    polygon: SVGPolygonElement | null;
    polygonOutline: SVGPolylineElement | null;
    handlesGroup: SVGGElement | null;
    operatorsLayer: HTMLElement | null;
    dronesLayer: HTMLElement | null;
    cameraTitle: HTMLElement | null;
    cameraSubtitle: HTMLElement | null;
    cameraImage: HTMLImageElement | null;
    telemetryEntity: HTMLElement | null;
    telemetryAltitude: HTMLElement | null;
    telemetryBattery: HTMLElement | null;
    telemetryNeedle: HTMLElement | null;
    telemetryRtb: HTMLElement | null;
    telemetryRange: HTMLElement | null;
    telemetryEndurance: HTMLElement | null;
    operatorFocus: HTMLElement | null;
}

export interface MissionConfig extends Record<string, unknown> {
    map: {
        width: number;
        height: number;
    };
}

export interface MissionState {
    mode: 'defence' | 'commercial';
    polygon: Point[];
    operators: Operator[];
    drones: Drone[];
    selection: Selection | null;
    dragging: { index: number; pointerId: number; handle: SVGCircleElement } | null;
    recalcTimeoutId: number | null;
    coverageIntervalId: number | null;
    rafId: number | null;
    lastFrameTime: number;
    layoutRafId: number | null;
    layout: LayoutState;
}

// TODO(types): tighten broad `any` casts used to preserve mission behavior parity during migration.
export function initMissionDemo(root: HTMLElement): () => void {
    'use strict';

    const doc = root.ownerDocument;
    const get = <T extends HTMLElement | SVGElement>(id: string): T | null => {
        const scoped = root.querySelector(`#${id}`);
        if (scoped) {
            return scoped as T;
        }
        return doc.getElementById(id) as T | null;
    };

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const TAU = Math.PI * 2;

    const MISSION_DEFENCE_CONFIG: any = {
        layout: {
            baseWidth: 1600,
            baseHeight: 900,
            minScalePhone: 0.2,
            maxScaleDesktop: 1.15
        },
        breakpoints: {
            mobile: 768,
            tablet: 1024
        },
        ui: {
            compactThreshold: 768
        },
        map: {
            width: 1600,
            height: 900
        },
        assets: {
            desertMap: ASSETS.desertMap,
            droneFeed: ASSETS.droneFeed
        },
        operators: [
            { id: 'OP-1', x: 340, y: 290 },
            { id: 'OP-2', x: 820, y: 470 },
            { id: 'OP-3', x: 1230, y: 340 }
        ],
        polygon: [
            { x: 230, y: 190 },
            { x: 1340, y: 210 },
            { x: 1460, y: 720 },
            { x: 980, y: 820 },
            { x: 360, y: 780 },
            { x: 190, y: 430 }
        ],
        drone: {
            count: 5,
            cameraRangePx: 470,
            fovDeg: 48,
            iconScale: 1,
            gimbalTurnDegPerSec: 52
        },
        sim: {
            targetRefreshMs: 4200,
            dragRecalcMs: 850,
            cruiseSpeedPxPerSec: 46,
            turnRateDegPerSec: 12,
            boundaryAdaptPerSec: 0.2,
            accelPxPerSec2: 1.2,
            decelPxPerSec2: 1.9,
            turnSpeedLoss: 0.14,
            minTurnRadiusPx: 120,
            wallBufferPx: 72,
            climbRateMps: 2.1,
            descentRateMps: 1.8,
            verticalAccelMps2: 0.42,
            altitudeBandM: 340,
            operatorRetaskMinSec: 18,
            operatorRetaskMaxSec: 34
        }
    };

    const refs: any = {
        shell: get<HTMLElement>('mission-shell'),
        modeStatus: get<HTMLElement>('mission-mode-status'),
        defenceButton: get<HTMLButtonElement>('mission-mode-defence'),
        commercialButton: get<HTMLButtonElement>('mission-mode-commercial'),
        backToDefenceButton: get<HTMLButtonElement>('mission-back-defence'),
        defenceView: get<HTMLElement>('mission-defence-view'),
        commercialView: get<HTMLElement>('mission-commercial-view'),
        stageViewport: get<HTMLElement>('mission-stage-viewport'),
        stage: get<HTMLElement>('mission-stage'),
        mapImage: get<HTMLImageElement>('mission-map-image'),
        overlaySvg: get<SVGSVGElement>('mission-overlay-svg'),
        wedgesGroup: get<SVGGElement>('mission-camera-wedges'),
        polygon: get<SVGPolygonElement>('mission-polygon'),
        polygonOutline: get<SVGPolylineElement>('mission-polygon-outline'),
        handlesGroup: get<SVGGElement>('mission-polygon-handles'),
        operatorsLayer: get<HTMLElement>('mission-operators-layer'),
        dronesLayer: get<HTMLElement>('mission-drones-layer'),
        cameraTitle: get<HTMLElement>('mission-camera-title'),
        cameraSubtitle: get<HTMLElement>('mission-camera-subtitle'),
        cameraImage: get<HTMLImageElement>('mission-camera-image'),
        telemetryEntity: get<HTMLElement>('telemetry-entity'),
        telemetryAltitude: get<HTMLElement>('telemetry-altitude'),
        telemetryBattery: get<HTMLElement>('telemetry-battery-text'),
        telemetryNeedle: get<HTMLElement>('telemetry-battery-needle'),
        telemetryRtb: get<HTMLElement>('telemetry-rtb'),
        telemetryRange: get<HTMLElement>('telemetry-range'),
        telemetryEndurance: get<HTMLElement>('telemetry-endurance'),
        operatorFocus: get<HTMLElement>('mission-operator-focus')
    };

    if (!refs.shell || !refs.stage || !refs.stageViewport || !refs.overlaySvg) {
        return () => {};
    }

    const state: any = {
        mode: 'defence',
        polygon: MISSION_DEFENCE_CONFIG.polygon.map((point: Point) => ({ x: point.x, y: point.y })),
        operators: MISSION_DEFENCE_CONFIG.operators.map((operator: { id: string; x: number; y: number }) => ({ ...operator, element: null })),
        drones: [],
        selection: null,
        dragging: null,
        recalcTimeoutId: null,
        coverageIntervalId: null,
        rafId: null,
        lastFrameTime: performance.now(),
        layoutRafId: null,
        layout: {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            viewportWidth: 0,
            viewportHeight: 0
        }
    };

    init();

    function init() {
        refs.stage.style.width = `${MISSION_DEFENCE_CONFIG.layout.baseWidth}px`;
        refs.stage.style.height = `${MISSION_DEFENCE_CONFIG.layout.baseHeight}px`;

        bindModeControls();
        bindAssetFallbacks();
        buildPolygonHandles();
        renderPolygon();
        buildOperators();
        buildDrones();

        recalculateCoverageTargets(true);
        setSelection({ type: 'drone', id: state.drones[0].id });
        updateCameraOverlay();
        updateTelemetry();

        state.coverageIntervalId = window.setInterval(() => {
            if (state.mode !== 'defence') {
                return;
            }
            recalculateCoverageTargets(false);
        }, MISSION_DEFENCE_CONFIG.sim.targetRefreshMs);

        state.rafId = window.requestAnimationFrame(stepSimulation);

        updateViewportHeightVariable();
        scheduleSceneLayout();
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('orientationchange', handleWindowResize);
        window.addEventListener('load', scheduleSceneLayout, { once: true });
    }

    function bindModeControls() {
        refs.defenceButton.addEventListener('click', () => setMode('defence'));
        refs.commercialButton.addEventListener('click', () => setMode('commercial'));

        if (refs.backToDefenceButton) {
            refs.backToDefenceButton.addEventListener('click', () => setMode('defence'));
        }
    }

    function bindAssetFallbacks() {
        refs.mapImage.src = MISSION_DEFENCE_CONFIG.assets.desertMap;
        refs.cameraImage.src = MISSION_DEFENCE_CONFIG.assets.droneFeed;

        refs.mapImage.addEventListener('error', () => {
            refs.mapImage.style.opacity = '0.25';
        });

        refs.mapImage.addEventListener('load', () => {
            refs.mapImage.style.opacity = '1';
        });

        refs.cameraImage.addEventListener('error', () => {
            refs.cameraImage.style.opacity = '0';
        });

        refs.cameraImage.addEventListener('load', () => {
            refs.cameraImage.style.opacity = '1';
        });
    }

    function buildPolygonHandles() {
        refs.handlesGroup.innerHTML = '';
        state.polygon.forEach((point, index) => {
            const handle = document.createElementNS(SVG_NS, 'circle');
            handle.setAttribute('class', 'polygon-handle');
            handle.setAttribute('r', '12');
            handle.dataset.index = String(index);
            handle.setAttribute('cx', String(point.x));
            handle.setAttribute('cy', String(point.y));
            handle.addEventListener('pointerdown', handlePointerDown);
            refs.handlesGroup.appendChild(handle);
        });
    }

    function handlePointerDown(event) {
        if (state.mode !== 'defence') {
            return;
        }

        const index = Number(event.currentTarget.dataset.index);
        const handle = event.currentTarget;

        state.dragging = {
            index,
            pointerId: event.pointerId,
            handle
        };

        handle.classList.add('is-dragging');
        handle.setPointerCapture(event.pointerId);
        handle.addEventListener('pointermove', handlePointerMove);
        handle.addEventListener('pointerup', handlePointerUp);
        handle.addEventListener('pointercancel', handlePointerUp);
        event.preventDefault();
    }

    function handlePointerMove(event) {
        if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
            return;
        }

        const point = clientPointToStage(event.clientX, event.clientY);
        const clampedPoint = {
            x: clamp(point.x, 0, MISSION_DEFENCE_CONFIG.map.width),
            y: clamp(point.y, 0, MISSION_DEFENCE_CONFIG.map.height)
        };

        state.polygon[state.dragging.index] = clampedPoint;
        renderPolygon();
        scheduleCoverageRecalculation();
        event.preventDefault();
    }

    function handlePointerUp(event) {
        if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
            return;
        }

        const handle = state.dragging.handle;
        handle.classList.remove('is-dragging');
        handle.removeEventListener('pointermove', handlePointerMove);
        handle.removeEventListener('pointerup', handlePointerUp);
        handle.removeEventListener('pointercancel', handlePointerUp);

        if (handle.hasPointerCapture(event.pointerId)) {
            handle.releasePointerCapture(event.pointerId);
        }

        state.dragging = null;
        scheduleCoverageRecalculation();
    }

    function renderPolygon() {
        const points = state.polygon.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
        refs.polygon.setAttribute('points', points.join(' '));
        refs.polygonOutline.setAttribute('points', `${points.join(' ')} ${points[0]}`);

        Array.from(refs.handlesGroup.children as HTMLCollectionOf<SVGCircleElement>).forEach((handle: SVGCircleElement, index: number) => {
            const point = state.polygon[index];
            handle.setAttribute('cx', String(point.x));
            handle.setAttribute('cy', String(point.y));
        });
    }

    function scheduleCoverageRecalculation() {
        if (state.recalcTimeoutId !== null) {
            return;
        }

        state.recalcTimeoutId = window.setTimeout(() => {
            state.recalcTimeoutId = null;
            recalculateCoverageTargets(false);
        }, MISSION_DEFENCE_CONFIG.sim.dragRecalcMs);
    }

    function buildOperators() {
        refs.operatorsLayer.innerHTML = '';

        state.operators.forEach((operator) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'operator-pin';
            button.style.left = `${operator.x}px`;
            button.style.top = `${operator.y}px`;
            button.dataset.operatorId = operator.id;
            button.setAttribute('aria-label', `Focus ${operator.id}`);
            button.innerHTML = `<span class="operator-pin-core">O</span><span class="operator-pin-label">${operator.id}</span>`;
            button.addEventListener('click', () => {
                setSelection({ type: 'operator', id: operator.id });
            });

            operator.element = button;
            refs.operatorsLayer.appendChild(button);
        });
    }

    function buildDrones() {
        refs.dronesLayer.innerHTML = '';
        refs.wedgesGroup.innerHTML = '';

        state.drones = [];
        for (let i = 0; i < MISSION_DEFENCE_CONFIG.drone.count; i += 1) {
            const spawn = randomPointInPolygon(state.polygon, i + 1);
            const baseAltitude = 1900 + i * 270;
            const nominalSpeedKmh = 42 + i * 2.8;
            const enduranceHours = 24 + i * 2.9;
            const batteryBase = 96.5 + Math.random() * 2;
            const assignedOperator = state.operators[i % state.operators.length] || null;
            const cruiseSpeedPxPerSec = MISSION_DEFENCE_CONFIG.sim.cruiseSpeedPxPerSec + i * 1.4;
            const drone: any = {
                id: `DR-${i + 1}`,
                x: spawn.x,
                y: spawn.y,
                target: { x: spawn.x, y: spawn.y },
                coverageAnchor: { x: spawn.x, y: spawn.y },
                heading: Math.random() * TAU,
                cameraHeading: Math.random() * TAU,
                phase: Math.random() * TAU,
                baseAltitude,
                nominalSpeedKmh,
                speedKmh: nominalSpeedKmh,
                enduranceHours,
                batteryBase,
                altitude: baseAltitude,
                targetAltitude: baseAltitude + (seededRandom(i + 41) - 0.5) * MISSION_DEFENCE_CONFIG.sim.altitudeBandM,
                verticalSpeedMps: 0,
                maxClimbMps: MISSION_DEFENCE_CONFIG.sim.climbRateMps + i * 0.07,
                maxDescentMps: MISSION_DEFENCE_CONFIG.sim.descentRateMps + i * 0.07,
                verticalAccelMps2: MISSION_DEFENCE_CONFIG.sim.verticalAccelMps2 + i * 0.02,
                battery: batteryBase,
                range20: nominalSpeedKmh * (20 / 60),
                endurance: enduranceHours,
                cruiseSpeedPxPerSec,
                airspeedPxPerSec: cruiseSpeedPxPerSec,
                targetAirspeedPxPerSec: cruiseSpeedPxPerSec,
                minSpeedPxPerSec: cruiseSpeedPxPerSec * 0.76,
                maxSpeedPxPerSec: cruiseSpeedPxPerSec * 1.08,
                accelPxPerSec2: MISSION_DEFENCE_CONFIG.sim.accelPxPerSec2 + i * 0.15,
                decelPxPerSec2: MISSION_DEFENCE_CONFIG.sim.decelPxPerSec2 + i * 0.2,
                turnRateRadPerSec: ((MISSION_DEFENCE_CONFIG.sim.turnRateDegPerSec + i * 0.45) * Math.PI) / 180,
                minTurnRadiusPx: MISSION_DEFENCE_CONFIG.sim.minTurnRadiusPx + i * 8,
                orbitRadius: 120 + (i % 3) * 34,
                orbitRate: 0.072 + i * 0.006,
                orbitDirection: i % 2 === 0 ? 1 : -1,
                retaskStep: (i % 2) + 1,
                assignedOperatorId: assignedOperator ? assignedOperator.id : null,
                nextRetaskAt: performance.now() + (12 + i * 2.7) * 1000,
                marker: null,
                iconWrap: null,
                wedgePath: null,
                trackedOperatorId: null
            };

            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = 'drone-marker';
            marker.dataset.droneId = drone.id;
            marker.style.left = `${drone.x}px`;
            marker.style.top = `${drone.y}px`;
            marker.innerHTML = `
                <span class="uav-icon-wrap" aria-hidden="true">
                    <svg class="uav-icon" viewBox="0 0 64 64" focusable="false">
                        <ellipse class="uav-shadow" cx="32" cy="35" rx="23" ry="16"></ellipse>
                        <path class="uav-wing" d="M4 31 L24 27 L40 27 L60 31 L60 33 L40 37 L24 37 L4 33 Z"></path>
                        <path class="uav-wing-detail" d="M8 32 L24 29.4 L40 29.4 L56 32 L40 34.6 L24 34.6 Z"></path>
                        <path class="uav-tail" d="M22 46 L42 46 L39 52 L25 52 Z"></path>
                        <path class="uav-tail-fin" d="M30 50 L27 58 L32 55.5 L37 58 L34 50 Z"></path>
                        <path class="uav-body" d="M32 6 L29 13 L29 44 L32 53 L35 44 L35 13 Z"></path>
                        <circle class="uav-sensor" cx="32" cy="11.5" r="2.2"></circle>
                    </svg>
                </span>
                <span class="drone-label">${drone.id}</span>
            `;
            marker.setAttribute('aria-label', `${drone.id} camera feed`);
            marker.addEventListener('click', () => {
                setSelection({ type: 'drone', id: drone.id });
            });
            drone.marker = marker;
            drone.iconWrap = marker.querySelector('.uav-icon-wrap') as HTMLElement | null;
            refs.dronesLayer.appendChild(marker);

            const wedgePath = document.createElementNS(SVG_NS, 'path');
            wedgePath.setAttribute('class', 'camera-wedge');
            refs.wedgesGroup.appendChild(wedgePath);
            drone.wedgePath = wedgePath;

            state.drones.push(drone);
        }
    }

    function recalculateCoverageTargets(forceReseed) {
        const samples: any[] = samplePointsInsidePolygon(state.polygon, 130);
        if (samples.length === 0) {
            return;
        }

        const droneCount = state.drones.length;
        let seeds = state.drones.map((drone) => ({ x: drone.x, y: drone.y }));

        if (forceReseed) {
            seeds = seeds.map((_, index) => {
                const sample = samples[(index * 7) % samples.length];
                return { x: sample.x, y: sample.y };
            });
        }

        for (let iteration = 0; iteration < 4; iteration += 1) {
            const clusters: any[][] = Array.from({ length: droneCount }, () => []);

            samples.forEach((sample) => {
                let closestIndex = 0;
                let closestDistance = Number.POSITIVE_INFINITY;

                seeds.forEach((seed, index) => {
                    const distance = distanceBetween(seed, sample);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                clusters[closestIndex].push(sample);
            });

            seeds = seeds.map((seed, index) => {
                const cluster = clusters[index];
                if (!cluster.length) {
                    return seed;
                }

                const centroid = cluster.reduce((accumulator, point) => {
                    return {
                        x: accumulator.x + point.x,
                        y: accumulator.y + point.y
                    };
                }, { x: 0, y: 0 });

                const center = {
                    x: centroid.x / cluster.length,
                    y: centroid.y / cluster.length
                };

                if (isPointInsidePolygon(center, state.polygon)) {
                    return center;
                }

                return nearestPoint(center, cluster);
            });
        }

        state.drones.forEach((drone, index) => {
            const proposedTarget = seeds[index] || samples[index % samples.length];
            drone.target = nearestPoint(proposedTarget, samples);
        });
    }

    function samplePointsInsidePolygon(polygon, step) {
        const bounds = polygonBounds(polygon);
        const samples: any[] = [];

        for (let y = bounds.minY; y <= bounds.maxY; y += step) {
            const rowOffset = (Math.floor((y - bounds.minY) / step) % 2) * (step * 0.35);
            for (let x = bounds.minX; x <= bounds.maxX; x += step) {
                const candidate = {
                    x: clamp(x + rowOffset, bounds.minX, bounds.maxX),
                    y
                };

                if (isPointInsidePolygon(candidate, polygon)) {
                    samples.push(candidate);
                }
            }
        }

        if (!samples.length) {
            const fallback = polygon[0] || { x: MISSION_DEFENCE_CONFIG.map.width * 0.5, y: MISSION_DEFENCE_CONFIG.map.height * 0.5 };
            samples.push({ x: fallback.x, y: fallback.y });
        }

        while (samples.length < MISSION_DEFENCE_CONFIG.drone.count) {
            samples.push(samples[samples.length % samples.length]);
        }

        return samples;
    }

    function randomPointInPolygon(polygon, seedOffset) {
        const bounds = polygonBounds(polygon);

        for (let attempt = 0; attempt < 280; attempt += 1) {
            const x = bounds.minX + seededRandom(seedOffset + attempt) * (bounds.maxX - bounds.minX);
            const y = bounds.minY + seededRandom(seedOffset + attempt * 2) * (bounds.maxY - bounds.minY);
            const point = { x, y };

            if (isPointInsidePolygon(point, polygon)) {
                return point;
            }
        }

        return {
            x: clamp((bounds.minX + bounds.maxX) * 0.5, 0, MISSION_DEFENCE_CONFIG.map.width),
            y: clamp((bounds.minY + bounds.maxY) * 0.5, 0, MISSION_DEFENCE_CONFIG.map.height)
        };
    }

    function seededRandom(value) {
        const sine = Math.sin(value * 19.73) * 43758.5453;
        return sine - Math.floor(sine);
    }

    function stepSimulation(now) {
        const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - state.lastFrameTime) / 1000));
        state.lastFrameTime = now;

        if (state.mode === 'defence') {
            updateDroneStates(now, deltaSeconds);
            renderDroneLayer();
            renderOperatorLayer();
            updateCameraOverlay();
            updateTelemetry();
        }

        state.rafId = window.requestAnimationFrame(stepSimulation);
    }

    function updateDroneStates(now, deltaSeconds) {
        const timeSeconds = now * 0.001;
        const activeOperators = operatorsInsidePolygon();

        state.drones.forEach((drone, index) => {
            const boundaryBlend = clamp(MISSION_DEFENCE_CONFIG.sim.boundaryAdaptPerSec * deltaSeconds, 0.001, 1);
            drone.coverageAnchor.x += (drone.target.x - drone.coverageAnchor.x) * boundaryBlend;
            drone.coverageAnchor.y += (drone.target.y - drone.coverageAnchor.y) * boundaryBlend;

            if (activeOperators.length) {
                const assignedStillValid = activeOperators.some((operator) => operator.id === drone.assignedOperatorId);
                if (!assignedStillValid || now >= drone.nextRetaskAt) {
                    drone.assignedOperatorId = chooseNextOperatorId(drone, activeOperators);
                    drone.nextRetaskAt = now + nextRetaskDelayMs(drone, index, now);
                    const altitudeSeed = now * 0.0011 + index * 3.7 + drone.phase;
                    drone.targetAltitude = drone.baseAltitude
                        + (seededRandom(altitudeSeed) - 0.5) * MISSION_DEFENCE_CONFIG.sim.altitudeBandM;
                }
            } else {
                drone.assignedOperatorId = null;
            }

            const assignedOperator = activeOperators.find((operator) => operator.id === drone.assignedOperatorId) || null;
            const loiterCenter = assignedOperator
                ? {
                    x: drone.coverageAnchor.x * 0.58 + assignedOperator.x * 0.42,
                    y: drone.coverageAnchor.y * 0.58 + assignedOperator.y * 0.42
                }
                : {
                    x: drone.coverageAnchor.x,
                    y: drone.coverageAnchor.y
                };

            const loiterAngle = timeSeconds * drone.orbitRate * drone.orbitDirection + drone.phase;
            let desired = {
                x: loiterCenter.x + Math.cos(loiterAngle) * drone.orbitRadius,
                y: loiterCenter.y + Math.sin(loiterAngle) * drone.orbitRadius * 0.72
            };

            if (!isPointInsidePolygon(desired, state.polygon)) {
                desired = moveTowardInside(desired, drone.coverageAnchor, state.polygon);
            }

            const isInsidePolygon = isPointInsidePolygon(drone, state.polygon);
            const rejoinPoint = isInsidePolygon ? null : rejoinPointForDrone(drone, state.polygon);
            const desiredHeading = rejoinPoint
                ? Math.atan2(rejoinPoint.y - drone.y, rejoinPoint.x - drone.x)
                : Math.atan2(desired.y - drone.y, desired.x - drone.x);
            const edgeInfo = nearestPolygonEdgeInfo(drone, state.polygon);
            const lookAheadDistance = Math.max(28, drone.airspeedPxPerSec * 2.2);
            const lookAheadPoint = {
                x: drone.x + Math.cos(drone.heading) * lookAheadDistance,
                y: drone.y + Math.sin(drone.heading) * lookAheadDistance
            };

            const nearBoundary = isInsidePolygon && edgeInfo.distance < MISSION_DEFENCE_CONFIG.sim.wallBufferPx;
            const projectedOutside = isInsidePolygon && !isPointInsidePolygon(lookAheadPoint, state.polygon);
            let guidanceHeading = desiredHeading;

            if (nearBoundary || projectedOutside) {
                const avoidHeading = Math.atan2(edgeInfo.awayY, edgeInfo.awayX);
                const edgePressure = clamp(
                    (MISSION_DEFENCE_CONFIG.sim.wallBufferPx - edgeInfo.distance) / MISSION_DEFENCE_CONFIG.sim.wallBufferPx,
                    0,
                    1
                );
                const avoidBlend = projectedOutside ? 0.88 : 0.42 + edgePressure * 0.46;
                guidanceHeading = lerpAngle(desiredHeading, avoidHeading, clamp(avoidBlend, 0, 0.95));
            }

            const rawHeadingError = normalizeAngle(guidanceHeading - drone.heading);
            const turnIntensity = clamp(Math.abs(rawHeadingError) / Math.PI, 0, 1);
            const speedLoss = MISSION_DEFENCE_CONFIG.sim.turnSpeedLoss * turnIntensity;
            drone.targetAirspeedPxPerSec = clamp(
                drone.cruiseSpeedPxPerSec * (1 - speedLoss),
                drone.minSpeedPxPerSec,
                drone.maxSpeedPxPerSec
            );

            const speedError = drone.targetAirspeedPxPerSec - drone.airspeedPxPerSec;
            const speedRateLimit = (speedError >= 0 ? drone.accelPxPerSec2 : drone.decelPxPerSec2) * deltaSeconds;
            drone.airspeedPxPerSec += clamp(speedError, -speedRateLimit, speedRateLimit);
            drone.airspeedPxPerSec = clamp(drone.airspeedPxPerSec, drone.minSpeedPxPerSec, drone.maxSpeedPxPerSec);

            const travel = drone.airspeedPxPerSec * deltaSeconds;
            const maxTurnFromRate = drone.turnRateRadPerSec * deltaSeconds;
            const maxTurnFromRadius = travel / Math.max(1, drone.minTurnRadiusPx);
            const maxTurn = Math.max(0.001, Math.min(maxTurnFromRate, maxTurnFromRadius));

            const previousHeading = drone.heading;
            const movementGoal = rejoinPoint || desired;
            let forwardStep = planForwardStep(drone, guidanceHeading, maxTurn, travel, state.polygon, {
                allowOutside: !isInsidePolygon,
                goalPoint: movementGoal
            });

            if (!forwardStep) {
                const recoveryHeading = rejoinPoint
                    ? Math.atan2(rejoinPoint.y - drone.y, rejoinPoint.x - drone.x)
                    : Math.atan2(edgeInfo.awayY, edgeInfo.awayX);
                forwardStep = planForwardStep(
                    drone,
                    recoveryHeading,
                    maxTurn,
                    travel * (isInsidePolygon ? 0.82 : 0.92),
                    state.polygon,
                    {
                        allowOutside: true,
                        goalPoint: movementGoal
                    }
                );
            }

            if (forwardStep) {
                drone.heading = forwardStep.heading;
                drone.x = forwardStep.x;
                drone.y = forwardStep.y;
            } else {
                drone.heading = previousHeading;
                const emergencyStep = travel * 0.35;
                if (emergencyStep > 0.01) {
                    drone.x += Math.cos(drone.heading) * emergencyStep;
                    drone.y += Math.sin(drone.heading) * emergencyStep;
                }
            }

            drone.x = clamp(drone.x, 0, MISSION_DEFENCE_CONFIG.map.width);
            drone.y = clamp(drone.y, 0, MISSION_DEFENCE_CONFIG.map.height);

            const trackedOperator = nearestOperatorForDrone(drone, activeOperators);
            drone.trackedOperatorId = trackedOperator ? trackedOperator.id : null;

            const cameraTarget = trackedOperator || assignedOperator || desired;
            const desiredCameraHeading = Math.atan2(cameraTarget.y - drone.y, cameraTarget.x - drone.x);
            const maxGimbalTurn = ((MISSION_DEFENCE_CONFIG.drone.gimbalTurnDegPerSec * Math.PI) / 180) * deltaSeconds;
            const gimbalError = normalizeAngle(desiredCameraHeading - drone.cameraHeading);
            drone.cameraHeading = normalizeAngle(drone.cameraHeading + clamp(gimbalError, -maxGimbalTurn, maxGimbalTurn));

            const altitudeError = drone.targetAltitude - drone.altitude;
            const desiredVerticalSpeed = clamp(altitudeError * 0.022, -drone.maxDescentMps, drone.maxClimbMps);
            const verticalSpeedError = desiredVerticalSpeed - drone.verticalSpeedMps;
            const verticalRateLimit = drone.verticalAccelMps2 * deltaSeconds;
            drone.verticalSpeedMps += clamp(verticalSpeedError, -verticalRateLimit, verticalRateLimit);
            drone.altitude += drone.verticalSpeedMps * deltaSeconds;

            const speedRatio = drone.airspeedPxPerSec / drone.cruiseSpeedPxPerSec;
            drone.speedKmh = drone.nominalSpeedKmh * speedRatio;
            drone.battery = drone.batteryBase + Math.sin(timeSeconds * 0.19 + drone.phase) * 1.1;
            drone.range20 = drone.speedKmh * (20 / 60);
            drone.endurance = drone.enduranceHours + Math.sin(timeSeconds * 0.13 + drone.phase) * 1.2;
        });
    }

    function moveTowardInside(point, target, polygon) {
        for (let blend = 0.05; blend <= 1; blend += 0.05) {
            const blended = {
                x: point.x + (target.x - point.x) * blend,
                y: point.y + (target.y - point.y) * blend
            };
            if (isPointInsidePolygon(blended, polygon)) {
                return blended;
            }
        }

        return {
            x: target.x,
            y: target.y
        };
    }

    function planForwardStep(drone, desiredHeading, maxTurn, travel, polygon, options) {
        if (travel <= 0.0001) {
            return null;
        }

        const resolvedOptions = options || {};
        const allowOutside = Boolean(resolvedOptions.allowOutside);
        const goalPoint = resolvedOptions.goalPoint || null;
        const currentGoalDistance = goalPoint ? distanceBetween(drone, goalPoint) : Number.POSITIVE_INFINITY;
        const currentHeading = drone.heading;
        const desiredTurn = clamp(normalizeAngle(desiredHeading - currentHeading), -maxTurn, maxTurn);
        const turnSign = desiredTurn === 0 ? 1 : Math.sign(desiredTurn);
        const turnTrials = [
            desiredTurn,
            desiredTurn * 0.72,
            desiredTurn * 0.42,
            turnSign * maxTurn * 0.2,
            -turnSign * maxTurn * 0.2,
            0
        ];
        const distanceScales = [1, 0.9, 0.78, 0.64, 0.5];
        let bestOutsideStep: any = null;
        let bestOutsideScore = Number.POSITIVE_INFINITY;

        for (let i = 0; i < turnTrials.length; i += 1) {
            const turnDelta = clamp(turnTrials[i], -maxTurn, maxTurn);
            const heading = normalizeAngle(currentHeading + turnDelta);

            for (let j = 0; j < distanceScales.length; j += 1) {
                const stepDistance = travel * distanceScales[j];
                const candidate = {
                    x: drone.x + Math.cos(heading) * stepDistance,
                    y: drone.y + Math.sin(heading) * stepDistance
                };

                if (
                    candidate.x < -12
                    || candidate.x > MISSION_DEFENCE_CONFIG.map.width + 12
                    || candidate.y < -12
                    || candidate.y > MISSION_DEFENCE_CONFIG.map.height + 12
                ) {
                    continue;
                }

                if (isPointInsidePolygon(candidate, polygon)) {
                    return {
                        x: candidate.x,
                        y: candidate.y,
                        heading
                    };
                }

                if (allowOutside) {
                    const goalDistance = goalPoint
                        ? distanceBetween(candidate, goalPoint)
                        : nearestPolygonEdgeInfo(candidate, polygon).distance;
                    const progressPenalty = Number.isFinite(currentGoalDistance)
                        ? Math.max(0, goalDistance - currentGoalDistance) * 3.1
                        : 0;
                    const turnPenalty = Math.abs(turnDelta) * 16;
                    const shortStepPenalty = (1 - distanceScales[j]) * 18;
                    const score = goalDistance + progressPenalty + turnPenalty + shortStepPenalty;

                    if (score < bestOutsideScore) {
                        bestOutsideScore = score;
                        bestOutsideStep = {
                            x: candidate.x,
                            y: candidate.y,
                            heading
                        };
                    }
                }
            }
        }

        if (allowOutside && bestOutsideStep) {
            return bestOutsideStep;
        }

        return null;
    }

    function rejoinPointForDrone(drone, polygon) {
        const nearestBoundary = closestPointOnPolygon(drone, polygon);
        const edgeInfo = nearestPolygonEdgeInfo(drone, polygon);
        const inwardProbe = {
            x: nearestBoundary.x - edgeInfo.awayX * 34,
            y: nearestBoundary.y - edgeInfo.awayY * 34
        };

        if (isPointInsidePolygon(inwardProbe, polygon)) {
            return inwardProbe;
        }

        const preferredInsideTarget = resolveInsideReferencePoint(drone, polygon, nearestBoundary);
        return moveTowardInside(nearestBoundary, preferredInsideTarget, polygon);
    }

    function resolveInsideReferencePoint(drone, polygon, nearestBoundary) {
        if (isPointInsidePolygon(drone.coverageAnchor, polygon)) {
            return {
                x: drone.coverageAnchor.x,
                y: drone.coverageAnchor.y
            };
        }

        if (isPointInsidePolygon(drone.target, polygon)) {
            return {
                x: drone.target.x,
                y: drone.target.y
            };
        }

        const samples = samplePointsInsidePolygon(polygon, 95).filter((sample) => isPointInsidePolygon(sample, polygon));
        if (samples.length) {
            return nearestPoint(nearestBoundary, samples);
        }

        const centroid = polygonCentroid(polygon);
        if (isPointInsidePolygon(centroid, polygon)) {
            return centroid;
        }

        return {
            x: clamp(nearestBoundary.x, 1, MISSION_DEFENCE_CONFIG.map.width - 1),
            y: clamp(nearestBoundary.y, 1, MISSION_DEFENCE_CONFIG.map.height - 1)
        };
    }

    function closestPointOnPolygon(point, polygon) {
        let nearestDistance = Number.POSITIVE_INFINITY;
        let nearestX = point.x;
        let nearestY = point.y;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
            const segmentStart = polygon[j];
            const segmentEnd = polygon[i];
            const candidate = nearestPointOnSegment(point, segmentStart, segmentEnd);
            const distance = distanceBetween(point, candidate);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestX = candidate.x;
                nearestY = candidate.y;
            }
        }

        return {
            x: nearestX,
            y: nearestY,
            distance: nearestDistance
        };
    }

    function nearestPolygonEdgeInfo(point, polygon) {
        const nearest = closestPointOnPolygon(point, polygon);
        const awayX = point.x - nearest.x;
        const awayY = point.y - nearest.y;

        if (!Number.isFinite(nearest.distance)) {
            return {
                distance: Number.POSITIVE_INFINITY,
                awayX: 0,
                awayY: -1
            };
        }

        if (nearest.distance > 0.001) {
            return {
                distance: nearest.distance,
                awayX: awayX / nearest.distance,
                awayY: awayY / nearest.distance
            };
        }

        const centroid = polygonCentroid(polygon);
        const fallbackX = centroid.x - point.x;
        const fallbackY = centroid.y - point.y;
        const fallbackDistance = Math.hypot(fallbackX, fallbackY) || 1;
        return {
            distance: 0,
            awayX: fallbackX / fallbackDistance,
            awayY: fallbackY / fallbackDistance
        };
    }

    function nearestPointOnSegment(point, segmentStart, segmentEnd) {
        const segmentX = segmentEnd.x - segmentStart.x;
        const segmentY = segmentEnd.y - segmentStart.y;
        const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

        if (segmentLengthSquared <= 0.000001) {
            return { x: segmentStart.x, y: segmentStart.y };
        }

        const t = clamp(
            ((point.x - segmentStart.x) * segmentX + (point.y - segmentStart.y) * segmentY) / segmentLengthSquared,
            0,
            1
        );

        return {
            x: segmentStart.x + segmentX * t,
            y: segmentStart.y + segmentY * t
        };
    }

    function polygonCentroid(polygon) {
        if (!polygon.length) {
            return {
                x: MISSION_DEFENCE_CONFIG.map.width * 0.5,
                y: MISSION_DEFENCE_CONFIG.map.height * 0.5
            };
        }

        const sum = polygon.reduce((accumulator, point) => {
            return {
                x: accumulator.x + point.x,
                y: accumulator.y + point.y
            };
        }, { x: 0, y: 0 });

        return {
            x: sum.x / polygon.length,
            y: sum.y / polygon.length
        };
    }

    function renderDroneLayer() {
        const selectedOperatorId = state.selection && state.selection.type === 'operator' ? state.selection.id : null;

        state.drones.forEach((drone) => {
            drone.marker.style.left = `${drone.x.toFixed(2)}px`;
            drone.marker.style.top = `${drone.y.toFixed(2)}px`;

            const isSelectedDrone = state.selection && state.selection.type === 'drone' && state.selection.id === drone.id;
            const isTargetingSelectedOperator = selectedOperatorId && drone.trackedOperatorId === selectedOperatorId;

            drone.marker.classList.toggle('is-selected', Boolean(isSelectedDrone));
            drone.marker.classList.toggle('is-targeting-operator', Boolean(isTargetingSelectedOperator));
            if (drone.iconWrap) {
                const headingDegrees = toDegrees(drone.heading) + 90;
                drone.iconWrap.style.transform = `translate(-50%, -50%) rotate(${headingDegrees.toFixed(1)}deg) scale(${MISSION_DEFENCE_CONFIG.drone.iconScale})`;
            }

            const wedgeHeading = Number.isFinite(drone.cameraHeading) ? drone.cameraHeading : drone.heading;
            const wedgePath = describeWedge(
                drone.x,
                drone.y,
                260,
                wedgeHeading,
                (MISSION_DEFENCE_CONFIG.drone.fovDeg * Math.PI) / 180
            );
            drone.wedgePath.setAttribute('d', wedgePath);
        });
    }

    function renderOperatorLayer() {
        state.operators.forEach((operator) => {
            const isSelected = state.selection && state.selection.type === 'operator' && state.selection.id === operator.id;
            operator.element.classList.toggle('is-selected', Boolean(isSelected));
        });
    }

    function nearestOperatorForDrone(drone, operatorsPool) {
        const candidates = Array.isArray(operatorsPool) ? operatorsPool : state.operators;
        let closest: any = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        candidates.forEach((operator) => {
            const insidePolygon = isPointInsidePolygon(operator, state.polygon);
            if (!insidePolygon) {
                return;
            }

            const distance = distanceBetween(drone, operator);
            if (distance <= MISSION_DEFENCE_CONFIG.drone.cameraRangePx && distance < closestDistance) {
                closest = operator;
                closestDistance = distance;
            }
        });

        return closest;
    }

    function operatorsInsidePolygon() {
        return state.operators.filter((operator) => isPointInsidePolygon(operator, state.polygon));
    }

    function chooseNextOperatorId(drone, operators) {
        if (!operators.length) {
            return null;
        }

        const currentIndex = operators.findIndex((operator) => operator.id === drone.assignedOperatorId);
        if (currentIndex === -1) {
            const nearest = nearestOperatorToPoint(drone.coverageAnchor, operators);
            return nearest ? nearest.id : operators[0].id;
        }

        const nextIndex = (currentIndex + drone.retaskStep) % operators.length;
        return operators[nextIndex].id;
    }

    function nearestOperatorToPoint(point, operators) {
        let closest: any = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        operators.forEach((operator) => {
            const distance = distanceBetween(point, operator);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = operator;
            }
        });

        return closest;
    }

    function nextRetaskDelayMs(drone, index, now) {
        const minSeconds = MISSION_DEFENCE_CONFIG.sim.operatorRetaskMinSec;
        const maxSeconds = MISSION_DEFENCE_CONFIG.sim.operatorRetaskMaxSec;
        const spanSeconds = Math.max(1, maxSeconds - minSeconds);
        const jitterSeed = (index + 1) * 13.17 + drone.phase * 2.1 + Math.floor(now * 0.001) * 0.07;
        const jitter = seededRandom(jitterSeed);
        return (minSeconds + jitter * spanSeconds) * 1000;
    }

    function nearestDroneForOperator(operator) {
        let closest: any = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        state.drones.forEach((drone) => {
            const distance = distanceBetween(drone, operator);
            if (distance < closestDistance) {
                closest = drone;
                closestDistance = distance;
            }
        });

        return {
            drone: closest,
            distance: closestDistance
        };
    }

    function setSelection(nextSelection) {
        state.selection = nextSelection;
        updateCameraOverlay();
        updateTelemetry();
    }

    function updateCameraOverlay() {
        if (!state.selection) {
            refs.cameraTitle.textContent = 'Drone Feed';
            refs.cameraSubtitle.textContent = 'Awaiting selection';
            return;
        }

        if (state.selection.type === 'drone') {
            const drone = findDrone(state.selection.id);
            if (!drone) {
                return;
            }

            refs.cameraTitle.textContent = `${drone.id} camera`;
            refs.cameraSubtitle.textContent = `Gimbal ${Math.round((toDegrees(drone.cameraHeading) + 360) % 360)} deg`;
        } else {
            const operator = findOperator(state.selection.id);
            if (!operator) {
                return;
            }

            const nearest = nearestDroneForOperator(operator);
            refs.cameraTitle.textContent = `${operator.id} nearest feed`;
            refs.cameraSubtitle.textContent = nearest.drone
                ? `Source ${nearest.drone.id} at ${Math.round(nearest.distance)} m`
                : 'No drone available';
        }

        refs.cameraImage.style.display = 'block';
    }

    function updateTelemetry() {
        const telemetryDrone = telemetryDroneFromSelection();
        if (!telemetryDrone) {
            return;
        }

        refs.telemetryEntity.textContent = telemetryDrone.id;
        const altitude = Number.isFinite(telemetryDrone.altitude) ? telemetryDrone.altitude : telemetryDrone.baseAltitude;
        refs.telemetryAltitude.textContent = `${Math.round(altitude)} m`;

        const batteryValue = Number.isFinite(telemetryDrone.battery) ? telemetryDrone.battery : telemetryDrone.batteryBase;
        const batteryPercent = clamp(batteryValue, 95, 99.5);
        refs.telemetryBattery.textContent = `${Math.round(batteryPercent)}% (solar hold)`;
        refs.telemetryNeedle.style.left = `${batteryPercent.toFixed(2)}%`;

        refs.telemetryRtb.textContent = 'YES';
        const range20 = Number.isFinite(telemetryDrone.range20) ? telemetryDrone.range20 : telemetryDrone.speedKmh * (20 / 60);
        const endurance = Number.isFinite(telemetryDrone.endurance) ? telemetryDrone.endurance : telemetryDrone.enduranceHours;
        refs.telemetryRange.textContent = `${range20.toFixed(1)} km`;
        refs.telemetryEndurance.textContent = `${endurance.toFixed(1)} h`;

        if (state.selection && state.selection.type === 'operator') {
            const operator = findOperator(state.selection.id);
            const nearest = operator ? nearestDroneForOperator(operator) : null;

            if (operator && nearest && nearest.drone) {
                refs.operatorFocus.hidden = false;
                refs.operatorFocus.textContent = `${operator.id} focused. Nearest live feed: ${nearest.drone.id}. ${Math.round(nearest.distance)} m away.`;
            } else {
                refs.operatorFocus.hidden = true;
            }
        } else {
            refs.operatorFocus.hidden = true;
        }
    }

    function telemetryDroneFromSelection() {
        if (state.selection && state.selection.type === 'drone') {
            return findDrone(state.selection.id);
        }

        if (state.selection && state.selection.type === 'operator') {
            const operator = findOperator(state.selection.id);
            if (!operator) {
                return null;
            }

            return nearestDroneForOperator(operator).drone;
        }

        return state.drones[0] || null;
    }

    function setMode(mode) {
        state.mode = mode;

        const isDefence = mode === 'defence';
        refs.modeStatus.textContent = isDefence ? 'Defence Mode Active' : 'Commercial Mode Placeholder';

        refs.defenceButton.classList.toggle('is-active', isDefence);
        refs.commercialButton.classList.toggle('is-active', !isDefence);
        refs.defenceButton.setAttribute('aria-pressed', String(isDefence));
        refs.commercialButton.setAttribute('aria-pressed', String(!isDefence));

        refs.defenceView.hidden = !isDefence;
        refs.commercialView.hidden = isDefence;

        if (isDefence) {
            scheduleSceneLayout();
        }
    }

    function handleWindowResize() {
        updateViewportHeightVariable();
        scheduleSceneLayout();
    }

    function updateViewportHeightVariable() {
        document.documentElement.style.setProperty('--app-vh', `${window.innerHeight}px`);
    }

    function scheduleSceneLayout() {
        if (state.layoutRafId !== null) {
            return;
        }

        state.layoutRafId = window.requestAnimationFrame(() => {
            state.layoutRafId = null;
            applySceneLayout();
        });
    }

    function applySceneLayout() {
        if (!refs.stageViewport || !refs.stage) {
            return;
        }

        const baseWidth = MISSION_DEFENCE_CONFIG.layout.baseWidth;
        const baseHeight = MISSION_DEFENCE_CONFIG.layout.baseHeight;
        const viewportRect = refs.stageViewport.getBoundingClientRect();

        const viewportWidth = Math.max(1, viewportRect.width);
        const viewportHeight = Math.max(1, viewportRect.height);

        const fitScale = Math.min(viewportWidth / baseWidth, viewportHeight / baseHeight);
        const scale = clamp(
            fitScale,
            MISSION_DEFENCE_CONFIG.layout.minScalePhone,
            MISSION_DEFENCE_CONFIG.layout.maxScaleDesktop
        );

        const scaledWidth = baseWidth * scale;
        const scaledHeight = baseHeight * scale;
        const offsetX = (viewportWidth - scaledWidth) * 0.5;
        const offsetY = (viewportHeight - scaledHeight) * 0.5;

        state.layout.scale = scale;
        state.layout.offsetX = offsetX;
        state.layout.offsetY = offsetY;
        state.layout.viewportWidth = viewportWidth;
        state.layout.viewportHeight = viewportHeight;

        refs.stage.style.transform = `translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px) scale(${scale.toFixed(4)})`;

        const compactMode = viewportWidth <= MISSION_DEFENCE_CONFIG.ui.compactThreshold;
        refs.shell.classList.toggle('is-compact', compactMode);
    }

    function describeWedge(centerX, centerY, radius, heading, fovRadians) {
        const startAngle = heading - fovRadians / 2;
        const endAngle = heading + fovRadians / 2;

        const startPoint = {
            x: centerX + radius * Math.cos(startAngle),
            y: centerY + radius * Math.sin(startAngle)
        };

        const endPoint = {
            x: centerX + radius * Math.cos(endAngle),
            y: centerY + radius * Math.sin(endAngle)
        };

        return [
            `M ${centerX.toFixed(2)} ${centerY.toFixed(2)}`,
            `L ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)}`,
            `A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 1 ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`,
            'Z'
        ].join(' ');
    }

    function clientPointToStage(clientX, clientY) {
        const rect = refs.stage.getBoundingClientRect();
        const scaleX = rect.width / MISSION_DEFENCE_CONFIG.layout.baseWidth || 1;
        const scaleY = rect.height / MISSION_DEFENCE_CONFIG.layout.baseHeight || 1;
        return {
            x: (clientX - rect.left) / scaleX,
            y: (clientY - rect.top) / scaleY
        };
    }

    function findDrone(droneId) {
        return state.drones.find((drone) => drone.id === droneId) || null;
    }

    function findOperator(operatorId) {
        return state.operators.find((operator) => operator.id === operatorId) || null;
    }

    function polygonBounds(polygon) {
        const initial = {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY
        };

        return polygon.reduce((bounds, point) => {
            return {
                minX: Math.min(bounds.minX, point.x),
                minY: Math.min(bounds.minY, point.y),
                maxX: Math.max(bounds.maxX, point.x),
                maxY: Math.max(bounds.maxY, point.y)
            };
        }, initial);
    }

    function nearestPoint(point, points) {
        let closestPoint = points[0];
        let closestDistance = Number.POSITIVE_INFINITY;

        points.forEach((candidate) => {
            const distance = distanceBetween(point, candidate);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = candidate;
            }
        });

        return {
            x: closestPoint.x,
            y: closestPoint.y
        };
    }

    function distanceBetween(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function isPointInsidePolygon(point, polygon) {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.0000001) + xi);

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    }

    function lerpAngle(start, end, amount) {
        const delta = normalizeAngle(end - start);
        return start + delta * amount;
    }

    function normalizeAngle(angle) {
        let normalized = angle;
        while (normalized > Math.PI) {
            normalized -= TAU;
        }
        while (normalized < -Math.PI) {
            normalized += TAU;
        }
        return normalized;
    }

    function toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    return () => {
        if (state.coverageIntervalId !== null) {
            window.clearInterval(state.coverageIntervalId);
        }
        if (state.rafId !== null) {
            window.cancelAnimationFrame(state.rafId);
        }
        if (state.recalcTimeoutId !== null) {
            window.clearTimeout(state.recalcTimeoutId);
        }
        if (state.layoutRafId !== null) {
            window.cancelAnimationFrame(state.layoutRafId);
        }

        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('orientationchange', handleWindowResize);
    };
}
