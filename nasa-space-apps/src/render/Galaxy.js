import * as THREE from 'three';

export class Galaxy {
    constructor(radius = 1500, segments = 64) {
        this.radius = radius;
        this.segments = segments;
        this.mesh = this.createGalaxyMesh(radius, segments);
        // this.group = new THREE.Group(); --- IGNORE ---
        // this.group.add(this.mesh); --- IGNORE ---
    }

    createGalaxyMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Load Earth textures from public folder
        const galaxyTexture = textureLoader.load('/resources/galaxy/Galaxy Map.jpg');
        
        // Configure texture settings for better quality
        galaxyTexture.wrapS = THREE.RepeatWrapping;
        galaxyTexture.wrapT = THREE.RepeatWrapping;
        
        const material = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            side: THREE.BackSide, // Render inside faces so we see it from inside the sphere
            transparent: true,
            opacity: 0.8, // Reduce opacity to make it darker
            fog: false, // Skybox should not be affected by fog
            depthWrite: false, // Don't write to depth buffer
            depthTest: true // Keep depth test enabled but don't write
        });
        
        // Make the texture darker by reducing its intensity
        galaxyTexture.colorSpace = THREE.SRGBColorSpace;
        galaxyTexture.magFilter = THREE.LinearFilter;
        galaxyTexture.minFilter = THREE.LinearFilter;
        
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
}