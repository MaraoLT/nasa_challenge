import * as THREE from 'three';
import { Orbit } from './Orbit.js';
import { AstralObject } from './AstralObject.js';

export class Comet extends AstralObject {
    constructor(scene, radius, segments = 32, initialPosition, preloadedAssets = {}, preprocessedObjects = {}) {
        super(scene, radius, segments, initialPosition, preprocessedObjects);
        this.preloadedAssets = preloadedAssets;

        // Comet-specific properties (scaled for presentation)
        this.tailLength = 1.5 + Math.random() * 1.0; // Smaller tail length for presentation (1.5-2.5 units)
        this.tailWidth = radius * 0.8; // Wider tail width for better visibility
        this.coma = null; // Atmosphere around the nucleus
        this.tail = null; // Comet tail
        this.sunPosition = new THREE.Vector3(0, 0, 0); // Default sun position

        this.mesh = this.createCometNucleus();
        this.createComa();
        this.createTail();
        this.setPosition(this.position.x, this.position.y, this.position.z);

        // Add to scene (traceLine is already added by parent constructor)
        this.addToScene();
    }

    createCometNucleus() {
        let geometry, material;

        // Always create custom geometry for comets (simpler and more reliable)
        console.log('Creating comet nucleus objects normally');
        // Create irregular geometry for comet nucleus
        geometry = this.createCometGeometry(this.radius, this.segments);

        // Use preloaded texture if available, otherwise load normally
        const textureLoader = new THREE.TextureLoader();
        const cometTexture = this.preloadedAssets['/resources/meteor/Meteor Map.jpg']
            || textureLoader.load('/resources/meteor/Meteor Map.jpg');

        // Create a dirty ice/rock material for the comet nucleus
        material = new THREE.MeshStandardMaterial({
            color: 0x888866, // Darker, dirtier color than meteors
            map: cometTexture,
            roughness: 0.8, // Very rough surface (dirty ice)
            metalness: 0.1, // Very low metallic content
            emissive: 0x111100, // Subtle emissive glow
            emissiveIntensity: 0.05, // Very low emissive
            transparent: true, // Enable transparency
            opacity: 0.9, // Slightly transparent (90% opaque)
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Comet nucleus properties
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        return mesh;
    }

    // Create irregular comet nucleus geometry (similar to meteor but more elongated)
    createCometGeometry(radius, segments) {
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        
        // Get the position attribute
        const position = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Create random variations for each comet
        const seed = Math.random() * 1000;
        
        // Apply random deformations to create irregular comet shape
        for (let i = 0; i < position.count; i++) {
            vertex.fromBufferAttribute(position, i);
            
            // Normalize to get direction
            const direction = vertex.clone().normalize();
            
            // Create multiple noise layers for complex surface
            const noise1 = this.simpleNoise(direction.x * 2 + seed, direction.y * 2 + seed, direction.z * 2 + seed);
            const noise2 = this.simpleNoise(direction.x * 6 + seed, direction.y * 6 + seed, direction.z * 6 + seed);
            const noise3 = this.simpleNoise(direction.x * 12 + seed, direction.y * 12 + seed, direction.z * 12 + seed);
            
            // Combine noise layers with different amplitudes (more elongated)
            const deformation = 
                noise1 * 0.4 +      // Large features (stronger than meteors)
                noise2 * 0.2 +      // Medium features  
                noise3 * 0.1;       // Small details
            
            // Apply deformation with more variation than meteors
            const newRadius = radius * (0.7 + deformation * 0.6);
            vertex.multiplyScalar(newRadius / vertex.length());
            
            // Update the position
            position.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Recalculate normals for proper lighting
        geometry.computeVertexNormals();
        
        return geometry;
    }

    // Create the coma (atmosphere around the nucleus)
    createComa() {
        const comaGeometry = new THREE.SphereGeometry(this.radius * 1.1, 16, 16);
        const comaMaterial = new THREE.MeshBasicMaterial({
            color: 0x88bbff, // Unified blue-white color with tail
            transparent: true,
            opacity: 0.7, // Slightly more transparent for blending
            side: THREE.DoubleSide,
            depthWrite: false // Prevent z-fighting issues
        });

        this.coma = new THREE.Mesh(comaGeometry, comaMaterial);
        this.coma.position.copy(this.position);
    }

    // Create the comet tail
    createTail() {
        // Create tail geometry as a tapered cylinder
        const tailGeometry = new THREE.ConeGeometry(this.tailWidth, this.tailLength, 8, 1, true);
        
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: 0x88bbff, // Unified blue-white color with coma
            side: THREE.DoubleSide,
            depthWrite: false // Prevent z-fighting issues
        });

        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.updateTailDirection();
    }

    // Update tail direction to point away from the sun
    updateTailDirection() {
        if (!this.tail) return;

        // Calculate direction away from sun
        const awayFromSun = this.position.clone().sub(this.sunPosition).normalize();
        
        // Position tail starting from inside the nucleus (closer to center)
        const nucleusInnerPosition = this.position.clone().add(awayFromSun.clone().multiplyScalar(this.radius * 0.3));
        const tailCenterOffset = awayFromSun.clone().multiplyScalar(this.tailLength / 2);
        this.tail.position.copy(nucleusInnerPosition).add(tailCenterOffset);
        
        // Create a target point for the tail to look at (further away from sun)
        const targetPoint = this.tail.position.clone().add(awayFromSun.multiplyScalar(this.tailLength));
        
        // Orient the tail to point away from sun
        this.tail.rotation.set(0, 0, 0);
        this.tail.lookAt(targetPoint);
        
        // Adjust rotation so the cone points correctly (cone geometry points up by default)
        this.tail.rotateX(Math.PI / 2);
    }

    // Simple noise function for procedural generation (same as meteor)
    simpleNoise(x, y, z) {
        return (
            Math.sin(x * 2.1 + y * 1.3 + z * 0.7) * 0.5 +
            Math.sin(x * 1.7 + y * 2.9 + z * 1.1) * 0.3 +
            Math.sin(x * 3.3 + y * 0.9 + z * 2.3) * 0.2
        ) / 3;
    }

    // Add all Comet components to scene
    addToScene() {
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
        if (this.coma) {
            this.scene.add(this.coma);
        }
        if (this.tail) {
            this.scene.add(this.tail);
        }
    }
    
    // Remove all Comet components from scene
    removeFromScene() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.coma) {
            this.scene.remove(this.coma);
        }
        if (this.tail) {
            this.scene.remove(this.tail);
        }
    }

    // Set position for Comet (override to update tail and coma)
    setPosition(x, y, z) {
        this.position.set(x, y, z);

        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        if (this.coma) {
            this.coma.position.copy(this.position);
        }
        
        // Update tail direction when position changes
        this.updateTailDirection();
    }

    // Set sun position for tail calculations
    setSunPosition(sunPos) {
        this.sunPosition.copy(sunPos);
        this.updateTailDirection();
    }

    // Get current position
    getPosition() {
        return this.position.clone();
    }

    // Rotate Comet with slow tumbling motion (slower than meteors)
    rotate(deltaY = 0.005) {
        if (this.mesh) {
            // Add slower tumbling motion for comets
            this.mesh.rotation.x += deltaY * 0.3;
            this.mesh.rotation.y += deltaY * 0.5;
            this.mesh.rotation.z += deltaY * 0.2;
        }
    }
    
    // Start orbiting around a center point (usually the sun)
    startOrbit(center = new THREE.Vector3(0, 0, 0), speed = 0.005) {
        const distance = this.position.distanceTo(center);
        super.startOrbit({
            semiMajorAxis: distance,
            eccentricity: 0.3 + Math.random() * 0.5, // Higher eccentricity than meteors
            period: 365.0 + Math.random() * 1000.0,   // Longer periods (1-3 years)
            inclination: (Math.random() - 0.5) * Math.PI / 2, // More inclined orbits
            omega: Math.random() * Math.PI * 2,
            raan: Math.random() * Math.PI * 2
        });
    }
    
    // Update orbit position (override to update tail)
    updateOrbit(time) {
        if (!this.isOrbiting || !this.orbit) return;
        super.updateOrbit(time);
        
        // Update tail direction after orbit update
        this.updateTailDirection();
    }

    // Cleanup method (override to dispose all comet components)
    dispose() {
        // Remove from scene first
        this.removeFromScene();
        
        // Dispose geometry and materials
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.coma) {
            this.coma.geometry.dispose();
            this.coma.material.dispose();
        }
        if (this.tail) {
            this.tail.geometry.dispose();
            this.tail.material.dispose();
        }
    }
    
    // Static method to create random comets with different properties
    static createRandomComet(scene, minRadius = 0.5, maxRadius = 2.0, position, preloadedAssets = {}, preprocessedObjects = {}) {
        const randomRadius = minRadius + Math.random() * (maxRadius - minRadius);
        const randomSegments = 12 + Math.floor(Math.random() * 12); // 12-24 segments (fewer than meteors)
        
        return new Comet(scene, randomRadius, randomSegments, position, preloadedAssets, preprocessedObjects);
    }
    
    // Static method to create a comet field
    static createCometField(scene, count = 5, centerPosition = new THREE.Vector3(0, 0, 0), fieldRadius = 100, preloadedAssets = {}, preprocessedObjects = {}) {
        const comets = [];
        
        for (let i = 0; i < count; i++) {
            // Random position within the field (larger spread than meteors)
            const angle = Math.random() * Math.PI * 2;
            const distance = fieldRadius * 0.5 + Math.random() * fieldRadius * 0.5; // 50-100% of field radius
            const height = (Math.random() - 0.5) * fieldRadius * 0.5; // More vertical spread
            
            const position = new THREE.Vector3(
                centerPosition.x + Math.cos(angle) * distance,
                centerPosition.y + height,
                centerPosition.z + Math.sin(angle) * distance
            );
            
            const comet = Comet.createRandomComet(scene, 0.5, 2.0, position, preloadedAssets, preprocessedObjects);
            
            // Most comets should have orbits
            if (Math.random() > 0.2) {
                comet.startOrbit(centerPosition, 0.0005 + Math.random() * 0.001); // Slower than meteors
            }
            
            comets.push(comet);
        }
        
        return comets;
    }
}
