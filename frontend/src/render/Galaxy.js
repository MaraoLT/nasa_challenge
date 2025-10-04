import * as THREE from 'three';

export class Galaxy {
    constructor(radius = 1500, segments = 64, preloadedAssets = {}) {
        this.radius = radius;
        this.segments = segments;
        this.preloadedAssets = preloadedAssets;
        this.mesh = this.createGalaxyMesh(radius, segments);
        // this.group = new THREE.Group(); --- IGNORE ---
        // this.group.add(this.mesh); --- IGNORE ---
    }

    createGalaxyMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        
        // Use preloaded texture if available, otherwise load normally
        const textureLoader = new THREE.TextureLoader();
        const galaxyTexture = this.preloadedAssets['/resources/galaxy/Galaxy Map.jpg'] 
            || textureLoader.load('/resources/galaxy/Galaxy Map.jpg');
        
        // Configure texture settings for better quality
        galaxyTexture.wrapS = THREE.RepeatWrapping;
        galaxyTexture.wrapT = THREE.RepeatWrapping;
        
        const material = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            side: THREE.BackSide, // Render inside faces so we see it from inside the sphere
            transparent: false, // Make it opaque to avoid blending issues
            fog: false, // Skybox should not be affected by fog
            depthWrite: false, // Don't write to depth buffer
            depthTest: true, // Disable depth test to always render behind
        });
        
        // Make the texture darker by reducing its intensity
        galaxyTexture.colorSpace = THREE.SRGBColorSpace;
        galaxyTexture.magFilter = THREE.LinearFilter;
        galaxyTexture.minFilter = THREE.LinearFilter;
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Ensure galaxy doesn't cast or receive shadows
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        
        // Position galaxy at origin so it's truly a background skybox
        mesh.position.set(0, 0, 0);
        
        // Set very negative render order to ensure it renders first (behind everything)
        mesh.renderOrder = -9999;
        
        // Make sure it doesn't interfere with other objects
        mesh.frustumCulled = false;
        
        return mesh;
    }
}