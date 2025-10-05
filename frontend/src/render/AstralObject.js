import * as THREE from 'three';
import { Orbit } from './Orbit.js';

function getAstralSVGOverlay() {
    let svgOverlay = document.getElementById('astral-svg-overlay');
    if (!svgOverlay) {
        svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgOverlay.setAttribute('id', 'astral-svg-overlay');
        svgOverlay.style.position = 'absolute';
        svgOverlay.style.top = '0';
        svgOverlay.style.left = '0';
        svgOverlay.style.width = '100%';
        svgOverlay.style.height = '100%';
        svgOverlay.style.pointerEvents = 'none';
        svgOverlay.style.zIndex = '999';
        svgOverlay.setAttribute('width', '100%');
        svgOverlay.setAttribute('height', '100%');
        document.body.appendChild(svgOverlay);
    }
    return svgOverlay;
}

export class AstralObject {
    constructor(scene, radius, segments, initialPosition) {
        this.scene = scene;
        this.radius = radius;
        this.segments = segments;
        this.position = initialPosition.clone();

        this.isOrbiting = false;
        this.orbit = null;

        this.tracePoints = [];
        this.traceMaxPoints = 100;
        this.svgPath = null;
        this.traceRefreshRate = 20;
        this.updates = 0;
        this.createSVGTrace();
    }

    createSVGTrace() {
        const svgOverlay = getAstralSVGOverlay();
        this.svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svgPath.setAttribute('stroke', 'white');
        this.svgPath.setAttribute('stroke-width', '1.5');
        this.svgPath.setAttribute('fill', 'none');
        svgOverlay.appendChild(this.svgPath);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        if (this.atmosphere) {
            this.atmosphere.position.copy(this.position);
        }
    }

    getPosition() {
        return this.position.clone();
    }

    startOrbit(orbitParams) {
        this.isOrbiting = true;
        this.orbit = new Orbit(orbitParams);
    }

    stopOrbit() {
        this.isOrbiting = false;
    }

    updateSVGTrace(camera, renderer) {
        if (!this.svgPath || this.tracePoints.length === 0 || !camera || !renderer) return;

        const width = renderer.domElement.clientWidth;
        const height = renderer.domElement.clientHeight;

        const pathData = this.tracePoints.map(point => {
            const vector = point.clone().project(camera);
            const x = (vector.x * 0.5 + 0.5) * width;
            const y = (-vector.y * 0.5 + 0.5) * height;
            return `${x},${y}`;
        });

        if (pathData.length > 0) {
            this.svgPath.setAttribute('d', `M ${pathData.join(' L ')}`);
        }
    }

    updateTrace() {
        if (this.updates !== 0) return;
        this.tracePoints.push(this.position.clone());
        if (this.tracePoints.length > this.traceMaxPoints) {
            this.tracePoints.shift();
        }
    }

    updateOrbit(time, camera, renderer) {
        this.updates++;
        if (this.updates >= this.traceRefreshRate) {
            this.updates = 0;
        }
        if (!this.isOrbiting || !this.orbit) return;
        const orbitPosition = this.orbit.walkInTime(time);
        this.setPosition(orbitPosition[0], orbitPosition[2], orbitPosition[1]);
        if (this.updates === 0) {
            this.updateTrace();
            this.updateSVGTrace(camera, renderer);
        }
    }

    dispose() {
        this.removeFromScene();
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.atmosphere) {
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        if (this.svgPath) {
            this.svgPath.remove();
        }
    }

    // Placeholder for add/remove to scene, to be implemented in subclasses
    addToScene() {}
    removeFromScene() {}
}
