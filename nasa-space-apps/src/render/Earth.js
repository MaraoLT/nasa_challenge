import * as THREE from 'three';

export class Earth {
    constructor(radius = 50, segments = 64) {
        this.radius = radius;
        this.segments = segments;
        this.mesh = this.createEarthMesh(radius, segments);
        // this.group = new THREE.Group(); --- IGNORE ---
        // this.group.add(this.mesh); --- IGNORE ---
    }

    createEarthMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Load Earth textures from public folder
        const earthTexture = textureLoader.load('/resources/earth/Earth Map.jpg');
        const bumpTexture = textureLoader.load('/resources/earth/Earth Topographic Map.png');
        
        // Configure texture settings for better quality
        earthTexture.wrapS = THREE.RepeatWrapping;
        earthTexture.wrapT = THREE.RepeatWrapping;
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;
        
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.5,
            displacementMap: bumpTexture,
            displacementScale: 0.05
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(this.radius * 1.02, this.segments, this.segments);

        const TextureLoader = new THREE.TextureLoader();
        const atmosphereTexture = TextureLoader.load('/resources/earth/Earth Clouds.jpg');
        const atmosphereMaterial = new THREE.MeshStandardMaterial({
            alphaMap: atmosphereTexture,
            transparent: true,
            opacity: 0.6,
        });
        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        return atmosphereMesh;
    }
}