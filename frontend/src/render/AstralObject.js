import * as THREE from 'three';
import { Orbit } from './Orbit.js';

export class AstralObject {
    constructor(scene, radius, segments, initialPosition, preprocessedObjects = {}, traceColor = 0xffffff) {
        this.scene = scene;
        this.radius = radius;
        this.segments = segments;
        this.position = initialPosition.clone();

        this.preprocessedObjects = preprocessedObjects;

        this.isOrbiting = false;
        this.orbit = null;

        this.tracePoints = [];
        this.traceMaxPoints = 200;
        this.traceLine = null;
        this.traceRefreshRate = 30; // Update trace every 30 updates
        this.updates = 0;
        this.traceColor = traceColor;
        this.camera = null; // Will be set from scene
        // Create and add trace to scene immediately
        this.createTraceLine();
        this.addTraceToScene();
    }

    // Set camera reference for distance-based fading
    setCamera(camera) {
        this.camera = camera;
    }

    createTraceLine() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.traceMaxPoints * 3);
        const colors = new Float32Array(this.traceMaxPoints * 3); // RGB only for better compatibility
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // 3 components for RGB
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8, // Set base opacity for the entire line
            linewidth: 2
        });
        this.traceLine = new THREE.Line(geometry, material);
        this.traceLine.frustumCulled = false;
    }

    addTraceToScene() {
        if (this.traceLine && this.scene) {
            this.scene.add(this.traceLine);
        }
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
        // Trace line is already created and added to scene in constructor
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
            const colors = this.traceLine.geometry.attributes.color.array;

            // Extract RGB from traceColor
            const baseColor = new THREE.Color(this.traceColor);

            for (let i = 0; i < this.tracePoints.length; i++) {
                const p = this.tracePoints[i];
                positions[i * 3] = p.x;
                positions[i * 3 + 1] = p.y;
                positions[i * 3 + 2] = p.z;

                // Calculate color intensity based on distance from camera and age of trace point
                let intensity = 1.0;

                // Fade based on camera distance if camera is available
                if (this.camera) {
                    const cameraPos = this.camera.position;
                    const dist = p.distanceTo(cameraPos);
                    const maxFadeDistance = 1000; // Adjust this value to control fade distance
                    const distanceFade = Math.max(0.1, 1.0 - (dist / maxFadeDistance));
                    intensity *= distanceFade;
                }

                // Fade based on trace point age (older points are dimmer)
                const ageRatio = i / this.tracePoints.length;
                const ageFade = 0.2 + (ageRatio * 0.8); // Min 0.2, max 1.0 intensity
                intensity *= ageFade;

                // Apply intensity to color components
                colors[i * 3] = baseColor.r * intensity;     // R
                colors[i * 3 + 1] = baseColor.g * intensity; // G
                colors[i * 3 + 2] = baseColor.b * intensity; // B
            }

            this.traceLine.geometry.setDrawRange(0, this.tracePoints.length);
            this.traceLine.geometry.attributes.position.needsUpdate = true;
            this.traceLine.geometry.attributes.color.needsUpdate = true;
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
        //console.log('Updates:', this.updates);
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
        // Don't add traceLine here as it's already added in addTraceToScene()
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

    removeTraceFromScene() {
        if (this.traceLine && this.scene) {
            this.scene.remove(this.traceLine);
        }
    }

    dispose() {
        // Remove mesh and atmosphere from scene
        this.removeFromScene();
        // Remove trace line from scene
        this.removeTraceFromScene();

        // Dispose mesh and atmosphere
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.atmosphere) {
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        // Dispose trace line
        if (this.traceLine) {
            this.traceLine.geometry.dispose();
            this.traceLine.material.dispose();
            this.traceLine = null;
        }
        // Clear trace points
        this.tracePoints = [];
    }
}
