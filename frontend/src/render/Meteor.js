import * as THREE from 'three';

export class Meteor {
    constructor(scene, radius, segments = 32, initialPosition) {
        this.scene = scene;
        this.radius = radius;
        this.segments = segments;
        this.position = initialPosition.clone();
        
        // Orbit properties
        this.isOrbiting = false;
        this.orbitCenter = new THREE.Vector3(0, 0, 0); // Default to sun at origin
        this.orbitRadius = this.position.distanceTo(this.orbitCenter);
        this.orbitSpeed = 0.005; // Default orbit speed
        this.orbitAngle = Math.atan2(this.position.z - this.orbitCenter.z, this.position.x - this.orbitCenter.x);
        
        // Create Meteor components
        this.mesh = this.createMeteorMesh();
        
        // Set initial position
        this.setPosition(this.position.x, this.position.y, this.position.z);
        
        // Add to scene
        this.addToScene();
    }

    createMeteorMesh() {
        // Create irregular geoid geometry for asteroid-like shape
        const geometry = this.createGeoidGeometry(this.radius, this.segments);
        
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();

        const meteorTexture = textureLoader.load('/resources/meteor/Meteor Map.jpg');
        
        // Create a rocky/metallic material for the meteor
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Dark brown/rocky color
            map: meteorTexture,
            roughness: 0.9,
            metalness: 0.1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    // Create irregular geoid geometry with random deformations
    createGeoidGeometry(radius, segments) {
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        
        // Get the position attribute
        const position = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Create random variations for each meteor
        const seed = Math.random() * 1000;
        
        // Apply random deformations to create irregular asteroid shape
        for (let i = 0; i < position.count; i++) {
            vertex.fromBufferAttribute(position, i);
            
            // Normalize to get direction
            const direction = vertex.clone().normalize();
            
            // Create multiple noise layers for complex surface
            const noise1 = this.simpleNoise(direction.x * 3 + seed, direction.y * 3 + seed, direction.z * 3 + seed);
            const noise2 = this.simpleNoise(direction.x * 8 + seed, direction.y * 8 + seed, direction.z * 8 + seed);
            const noise3 = this.simpleNoise(direction.x * 15 + seed, direction.y * 15 + seed, direction.z * 15 + seed);
            
            // Combine noise layers with different amplitudes
            const deformation = 
                noise1 * 0.3 +      // Large features
                noise2 * 0.15 +     // Medium features  
                noise3 * 0.08;      // Small details
            
            // Apply deformation (scale between 0.7 and 1.3 of original radius)
            const newRadius = radius * (0.85 + deformation * 0.3);
            vertex.multiplyScalar(newRadius / vertex.length());
            
            // Update the position
            position.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Recalculate normals for proper lighting
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    // Simple noise function for procedural generation
    simpleNoise(x, y, z) {
        // Simple 3D noise approximation using sine functions
        return (
            Math.sin(x * 2.1 + y * 1.3 + z * 0.7) * 0.5 +
            Math.sin(x * 1.7 + y * 2.9 + z * 1.1) * 0.3 +
            Math.sin(x * 3.3 + y * 0.9 + z * 2.3) * 0.2
        ) / 3;
    }

    // Add all Meteor components to scene
    addToScene() {
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
    }
    
    // Remove all Meteor components from scene
    removeFromScene() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
    
    // Set position for Meteor
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    // Get current position
    getPosition() {
        return this.position.clone();
    }
    
    // Rotate Meteor with random tumbling motion
    rotate(deltaY = 0.01) {
        if (this.mesh) {
            // Add some random tumbling motion for realism
            this.mesh.rotation.x += deltaY * 0.7;
            this.mesh.rotation.y += deltaY;
            this.mesh.rotation.z += deltaY * 0.3;
        }
    }
    
    // Start orbiting around a center point (usually the sun)
    startOrbit(center = new THREE.Vector3(0, 0, 0), speed = 0.005) {
        this.isOrbiting = true;
        this.orbitCenter = center.clone();
        this.orbitSpeed = speed;
        
        // Calculate initial orbit radius and angle based on current position
        this.orbitRadius = this.position.distanceTo(this.orbitCenter);
        this.orbitAngle = Math.atan2(this.position.z - this.orbitCenter.z, this.position.x - this.orbitCenter.x);
    }
    
    // Stop orbiting
    stopOrbit() {
        this.isOrbiting = false;
    }
    
    // Update orbit position
    updateOrbit() {
        if (!this.isOrbiting) return;
        
        // Update angle
        this.orbitAngle += this.orbitSpeed;
        
        // Calculate new position in circular orbit
        const x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = this.orbitCenter.y; // Keep same Y level
        const z = this.orbitCenter.z + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Update position
        this.setPosition(x, y, z);
    }
    
    // Set orbit parameters
    setOrbitParameters(radius, speed) {
        this.orbitRadius = radius;
        this.orbitSpeed = speed;
    }
    
    // Get orbit status
    getOrbitStatus() {
        return {
            isOrbiting: this.isOrbiting,
            center: this.orbitCenter.clone(),
            radius: this.orbitRadius,
            speed: this.orbitSpeed,
            angle: this.orbitAngle
        };
    }
    
    // Cleanup method
    dispose() {
        // Remove from scene first
        this.removeFromScene();
        
        // Dispose geometry and materials
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
    
    // Static method to create random meteors with different properties
    static createRandomMeteor(scene, minRadius = 0.1, maxRadius = 0.5, position) {
        const randomRadius = minRadius + Math.random() * (maxRadius - minRadius);
        const randomSegments = 16 + Math.floor(Math.random() * 16); // 16-32 segments
        
        return new Meteor(scene, randomRadius, randomSegments, position);
    }
    
    // Static method to create a meteor field
    static createMeteorField(scene, count = 10, centerPosition = new THREE.Vector3(0, 0, 0), fieldRadius = 20) {
        const meteors = [];
        
        for (let i = 0; i < count; i++) {
            // Random position within the field
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * fieldRadius;
            const height = (Math.random() - 0.5) * fieldRadius * 0.3; // Some vertical spread
            
            const position = new THREE.Vector3(
                centerPosition.x + Math.cos(angle) * distance,
                centerPosition.y + height,
                centerPosition.z + Math.sin(angle) * distance
            );
            
            const meteor = Meteor.createRandomMeteor(scene, 0.05, 0.3, position);
            
            // Add random orbit if desired
            if (Math.random() > 0.5) {
                meteor.startOrbit(centerPosition, 0.001 + Math.random() * 0.002);
            }
            
            meteors.push(meteor);
        }
        
        return meteors;
    }
}