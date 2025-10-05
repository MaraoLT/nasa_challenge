import * as THREE from 'three';
import { Orbit } from './Orbit.js';

export class AstralObject {
    constructor(scene, radius, segments, initialPosition, preprocessedObjects = {}) {
        this.scene = scene;
        this.radius = radius;
        this.segments = segments;
        this.position = initialPosition.clone();

        this.preprocessedObjects = preprocessedObjects;

        this.isOrbiting = false;
        this.orbit = null;

        this.tracePoints = [];
        this.traceMaxPoints = 100;
        this.traceLine = null;
        this.traceRefreshRate = 2;
        this.updates = 0;
    }

    createTraceLine() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.traceMaxPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        this.traceLine = new THREE.Line(geometry, material);
        this.traceLine.frustumCulled = false;
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
        if (!this.traceLine) {
            this.createTraceLine();
        }
    }

    stopOrbit() {
        this.isOrbiting = false;
    }

    updateTrace() {
        if (this.updates !== 0) return;
        this.tracePoints.push(this.position.clone());
        if (this.tracePoints.length > this.traceMaxPoints) {
            this.tracePoints.shift();
        }
        if (this.traceLine) {
            const positions = this.traceLine.geometry.attributes.position.array;
            for (let i = 0; i < this.tracePoints.length; i++) {
                const p = this.tracePoints[i];
                positions[i * 3] = p.x;
                positions[i * 3 + 1] = p.y;
                positions[i * 3 + 2] = p.z;
            }
            this.traceLine.geometry.setDrawRange(0, this.tracePoints.length);
            this.traceLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateOrbit(time) {
        this.updates++;
        if (this.updates >= this.traceRefreshRate) {
            this.updates = 0;
        }
        if (!this.isOrbiting || !this.orbit) return;
        const orbitPosition = this.orbit.walkInTime(time);
        this.setPosition(orbitPosition[0], orbitPosition[2], orbitPosition[1]);
        if (this.updates === 0) {
            this.updateTrace();
        }
    }

    addToScene() {
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
        if (this.atmosphere) {
            this.scene.add(this.atmosphere);
        }
        if (this.traceLine) {
            this.scene.add(this.traceLine);
        }
    }

    removeFromScene() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
        }
        if (this.traceLine) {
            this.scene.remove(this.traceLine);
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
        if (this.traceLine) {
            this.traceLine.geometry.dispose();
            this.traceLine.material.dispose();
        }
    }
}
