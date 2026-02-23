(() => {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const TAU = Math.PI * 2;

    const MISSION_DEFENCE_CONFIG = {
        map: {
            width: 1600,
            height: 900
        },
        assets: {
            desertMap: 'assets/desert-map-1.jpg',
            droneFeed: 'assets/drone-image-1.jpg'
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
            fovDeg: 48
        },
        sim: {
            targetRefreshMs: 1200,
            dragRecalcMs: 130,
            speedPxPerSec: 76
        }
    };

    const refs = {
        shell: document.getElementById('mission-shell'),
        modeStatus: document.getElementById('mission-mode-status'),
        defenceButton: document.getElementById('mission-mode-defence'),
        commercialButton: document.getElementById('mission-mode-commercial'),
        backToDefenceButton: document.getElementById('mission-back-defence'),
        defenceView: document.getElementById('mission-defence-view'),
        commercialView: document.getElementById('mission-commercial-view'),
        stageScroll: document.getElementById('mission-stage-scroll'),
        stage: document.getElementById('mission-stage'),
        mapImage: document.getElementById('mission-map-image'),
        mapFallback: document.getElementById('mission-map-fallback'),
        overlaySvg: document.getElementById('mission-overlay-svg'),
        wedgesGroup: document.getElementById('mission-camera-wedges'),
        polygon: document.getElementById('mission-polygon'),
        polygonOutline: document.getElementById('mission-polygon-outline'),
        handlesGroup: document.getElementById('mission-polygon-handles'),
        operatorsLayer: document.getElementById('mission-operators-layer'),
        dronesLayer: document.getElementById('mission-drones-layer'),
        cameraTitle: document.getElementById('mission-camera-title'),
        cameraSubtitle: document.getElementById('mission-camera-subtitle'),
        cameraImage: document.getElementById('mission-camera-image'),
        cameraFallback: document.getElementById('mission-camera-fallback'),
        telemetryEntity: document.getElementById('telemetry-entity'),
        telemetryAltitude: document.getElementById('telemetry-altitude'),
        telemetryBattery: document.getElementById('telemetry-battery-text'),
        telemetryNeedle: document.getElementById('telemetry-battery-needle'),
        telemetryRtb: document.getElementById('telemetry-rtb'),
        telemetryRange: document.getElementById('telemetry-range'),
        telemetryEndurance: document.getElementById('telemetry-endurance'),
        operatorFocus: document.getElementById('mission-operator-focus')
    };

    if (!refs.shell || !refs.stage || !refs.overlaySvg) {
        return;
    }

    const state = {
        mode: 'defence',
        mapMissing: false,
        feedMissing: false,
        polygon: MISSION_DEFENCE_CONFIG.polygon.map((point) => ({ x: point.x, y: point.y })),
        operators: MISSION_DEFENCE_CONFIG.operators.map((operator) => ({ ...operator, element: null })),
        drones: [],
        selection: null,
        dragging: null,
        recalcTimeoutId: null,
        coverageIntervalId: null,
        rafId: null,
        lastFrameTime: performance.now(),
        centeredStage: false
    };

    init();

    function init() {
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

        window.addEventListener('resize', handleWindowResize);
        window.setTimeout(centerStageViewport, 60);
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
            state.mapMissing = true;
            refs.mapFallback.hidden = false;
        });

        refs.mapImage.addEventListener('load', () => {
            state.mapMissing = false;
            refs.mapFallback.hidden = true;
        });

        refs.cameraImage.addEventListener('error', () => {
            state.feedMissing = true;
            refs.cameraFallback.hidden = false;
            refs.cameraImage.style.display = 'none';
        });

        refs.cameraImage.addEventListener('load', () => {
            state.feedMissing = false;
            refs.cameraFallback.hidden = true;
            refs.cameraImage.style.display = 'block';
        });
    }

    function buildPolygonHandles() {
        refs.handlesGroup.innerHTML = '';
        state.polygon.forEach((point, index) => {
            const handle = document.createElementNS(SVG_NS, 'circle');
            handle.setAttribute('class', 'polygon-handle');
            handle.setAttribute('r', '8');
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
        recalculateCoverageTargets(false);
    }

    function renderPolygon() {
        const points = state.polygon.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
        refs.polygon.setAttribute('points', points.join(' '));
        refs.polygonOutline.setAttribute('points', `${points.join(' ')} ${points[0]}`);

        Array.from(refs.handlesGroup.children).forEach((handle, index) => {
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
            const drone = {
                id: `DR-${i + 1}`,
                x: spawn.x,
                y: spawn.y,
                target: { x: spawn.x, y: spawn.y },
                heading: Math.random() * TAU,
                phase: Math.random() * TAU,
                baseAltitude: 190 + i * 27,
                speedKmh: 42 + i * 2.8,
                enduranceHours: 24 + i * 2.9,
                batteryBase: 96.5 + Math.random() * 2,
                marker: null,
                wedgePath: null,
                trackedOperatorId: null
            };

            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = 'drone-marker';
            marker.dataset.droneId = drone.id;
            marker.style.left = `${drone.x}px`;
            marker.style.top = `${drone.y}px`;
            marker.innerHTML = `<span>${i + 1}</span><span class="drone-label">${drone.id}</span>`;
            marker.setAttribute('aria-label', `${drone.id} camera feed`);
            marker.addEventListener('click', () => {
                setSelection({ type: 'drone', id: drone.id });
            });
            drone.marker = marker;
            refs.dronesLayer.appendChild(marker);

            const wedgePath = document.createElementNS(SVG_NS, 'path');
            wedgePath.setAttribute('class', 'camera-wedge');
            refs.wedgesGroup.appendChild(wedgePath);
            drone.wedgePath = wedgePath;

            state.drones.push(drone);
        }
    }

    function recalculateCoverageTargets(forceReseed) {
        const samples = samplePointsInsidePolygon(state.polygon, 130);
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
            const clusters = Array.from({ length: droneCount }, () => []);

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
        const samples = [];

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

        state.drones.forEach((drone, index) => {
            const driftX = Math.cos(timeSeconds * 0.8 + drone.phase) * 16;
            const driftY = Math.sin(timeSeconds * 0.68 + drone.phase * 0.9) * 10;

            let desired = {
                x: drone.target.x + driftX,
                y: drone.target.y + driftY
            };

            if (!isPointInsidePolygon(desired, state.polygon)) {
                desired = { x: drone.target.x, y: drone.target.y };
            }

            const speed = MISSION_DEFENCE_CONFIG.sim.speedPxPerSec + index * 5;
            const dx = desired.x - drone.x;
            const dy = desired.y - drone.y;
            const distance = Math.hypot(dx, dy);
            const stepDistance = Math.min(speed * deltaSeconds, distance);

            if (distance > 0.01) {
                drone.x += (dx / distance) * stepDistance;
                drone.y += (dy / distance) * stepDistance;
            }

            if (!isPointInsidePolygon(drone, state.polygon)) {
                const corrected = moveTowardInside(drone, drone.target, state.polygon);
                drone.x = corrected.x;
                drone.y = corrected.y;
            }

            const trackedOperator = nearestOperatorForDrone(drone);
            drone.trackedOperatorId = trackedOperator ? trackedOperator.id : null;

            const directionTarget = trackedOperator || drone.target;
            const desiredHeading = Math.atan2(directionTarget.y - drone.y, directionTarget.x - drone.x);
            drone.heading = lerpAngle(drone.heading, desiredHeading, 0.08);

            drone.altitude = drone.baseAltitude + Math.sin(timeSeconds * 0.7 + drone.phase) * 18;
            drone.battery = drone.batteryBase + Math.sin(timeSeconds * 0.19 + drone.phase) * 1.1;
            drone.range20 = drone.speedKmh * (20 / 60);
            drone.endurance = drone.enduranceHours + Math.sin(timeSeconds * 0.13 + drone.phase) * 1.8;
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

    function renderDroneLayer() {
        const selectedOperatorId = state.selection && state.selection.type === 'operator' ? state.selection.id : null;

        state.drones.forEach((drone) => {
            drone.marker.style.left = `${drone.x.toFixed(2)}px`;
            drone.marker.style.top = `${drone.y.toFixed(2)}px`;

            const isSelectedDrone = state.selection && state.selection.type === 'drone' && state.selection.id === drone.id;
            const isTargetingSelectedOperator = selectedOperatorId && drone.trackedOperatorId === selectedOperatorId;

            drone.marker.classList.toggle('is-selected', Boolean(isSelectedDrone));
            drone.marker.classList.toggle('is-targeting-operator', Boolean(isTargetingSelectedOperator));

            const wedgePath = describeWedge(
                drone.x,
                drone.y,
                260,
                drone.heading,
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

    function nearestOperatorForDrone(drone) {
        let closest = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        state.operators.forEach((operator) => {
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

    function nearestDroneForOperator(operator) {
        let closest = null;
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
            refs.cameraSubtitle.textContent = `Heading ${Math.round((toDegrees(drone.heading) + 360) % 360)} deg`;
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

        if (state.feedMissing) {
            refs.cameraFallback.hidden = false;
            refs.cameraImage.style.display = 'none';
        } else {
            refs.cameraFallback.hidden = true;
            refs.cameraImage.style.display = 'block';
        }
    }

    function updateTelemetry() {
        const telemetryDrone = telemetryDroneFromSelection();
        if (!telemetryDrone) {
            return;
        }

        refs.telemetryEntity.textContent = telemetryDrone.id;
        refs.telemetryAltitude.textContent = `${Math.round(telemetryDrone.altitude)} m`;

        const batteryPercent = clamp(telemetryDrone.battery, 95, 99.5);
        refs.telemetryBattery.textContent = `${Math.round(batteryPercent)}% (solar hold)`;
        refs.telemetryNeedle.style.left = `${batteryPercent.toFixed(2)}%`;

        refs.telemetryRtb.textContent = 'YES';
        refs.telemetryRange.textContent = `${telemetryDrone.range20.toFixed(1)} km`;
        refs.telemetryEndurance.textContent = `${telemetryDrone.endurance.toFixed(1)} h`;

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
            window.setTimeout(centerStageViewport, 40);
        }
    }

    function handleWindowResize() {
        if (state.mode === 'defence') {
            centerStageViewport();
        }
    }

    function centerStageViewport() {
        if (!refs.stageScroll) {
            return;
        }

        const x = Math.max(0, (MISSION_DEFENCE_CONFIG.map.width - refs.stageScroll.clientWidth) / 2);
        const y = Math.max(0, (MISSION_DEFENCE_CONFIG.map.height - refs.stageScroll.clientHeight) / 2);

        refs.stageScroll.scrollLeft = x;
        refs.stageScroll.scrollTop = y;
        state.centeredStage = true;
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
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
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
})();
