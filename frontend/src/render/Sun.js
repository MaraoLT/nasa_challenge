import * as THREE from 'three';

export class Sun {
    constructor(scene, radius = 1) {
        this.scene = scene;
        this.radius = radius;
        this.position = new THREE.Vector3(0, 0, 0);
        this.textureLoader = new THREE.TextureLoader();
        
        // Initialize geometry
        this.sunGeometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Initialize meshes and light (will be created in create methods)
        this.sun = null;
        this.pointLight = null;
        this.corona = null;
        
        // Light properties
        this.lightIntensity = 100.0;
        this.lightColor = 0xffffff;
        
        // Create the Sun and lighting
        this.createSun();
        this.createLight();
        
        // Add to scene
        this.addToScene();
    }
    
    createSun() {
        // Load Sun texture from public folder
        const sunTexture = this.textureLoader.load('/resources/sun/Sun Map.png');

        // Create Sun material with emissive properties for self-illumination
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            map: sunTexture,
            color: 0xffff88, // Slight yellow tint
        });
        
        // Alternative: Use MeshStandardMaterial with emissive for more realistic look
        // const sunMaterial = new THREE.MeshStandardMaterial({ 
        //     map: sunTexture, 
        //     emissiveMap: sunTexture,
        //     emissive: 0xffff00,
        //     emissiveIntensity: 2.0
        // });
        
        // Create Sun mesh
        this.sun = new THREE.Mesh(this.sunGeometry, sunMaterial);
    }
    
    createLight() {
        // Create point light for sun illumination
        this.pointLight = new THREE.PointLight(this.lightColor, this.lightIntensity, 0, 1);
        
        // Disable shadow casting for the point light to avoid artifacts
        this.pointLight.castShadow = false;
    }
    
    // Get the sun mesh to add to scene
    getMesh() {
        return this.sun;
    }
    
    // Get the point light to add to scene
    getLight() {
        return this.pointLight;
    }
    
    // Add all sun components to scene
    addToScene() {
        if (this.sun) {
            this.scene.add(this.sun);
        }
        if (this.pointLight) {
            this.scene.add(this.pointLight);
        }
    }
    
    // Remove all sun components from scene
    removeFromScene() {
        if (this.sun) {
            this.scene.remove(this.sun);
        }
        if (this.pointLight) {
            this.scene.remove(this.pointLight);
        }
        if (this.corona) {
            this.scene.remove(this.corona);
        }
    }
    
    // Set position for both Sun and its light
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        
        if (this.sun) {
            this.sun.position.copy(this.position);
        }
        
        if (this.pointLight) {
            this.pointLight.position.copy(this.position);
        }
        
        if (this.corona) {
            this.corona.position.copy(this.position);
        }
    }
    
    // Get current position
    getPosition() {
        return this.position.clone();
    }

    getRadius() {
        return this.radius;
    }

    // Update method for animations
    update(deltaTime = 16.67) {
        if (this.sun) {
            // Slow rotation for the sun
            this.sun.rotation.y += 0.001 * deltaTime * 0.016;
        }
    }
    
    // Method to set rotation
    setRotation(x, y, z) {
        if (this.sun) {
            this.sun.rotation.set(x, y, z);
        }
    }
    
    // Method to set scale
    setScale(scale) {
        if (this.sun) {
            this.sun.scale.setScalar(scale);
        }
    }
    
    // Method to adjust light intensity
    setLightIntensity(intensity) {
        this.lightIntensity = Math.max(0, intensity);
        if (this.pointLight) {
            this.pointLight.intensity = this.lightIntensity;
        }
    }
    
    // Method to change light color
    setLightColor(color) {
        this.lightColor = color;
        if (this.pointLight) {
            this.pointLight.color.setHex(color);
        }
    }
    
    // Method to adjust emissive intensity (only works with MeshStandardMaterial)
    setEmissiveIntensity(intensity) {
        if (this.sun && this.sun.material && this.sun.material.emissiveIntensity !== undefined) {
            this.sun.material.emissiveIntensity = Math.max(0, Math.min(5, intensity));
        }
    }
    
    // Method to show/hide the sun
    setVisible(visible) {
        if (this.sun) {
            this.sun.visible = visible;
        }
        if (this.pointLight) {
            this.pointLight.visible = visible;
        }
    }
    
    // Method to get Sun mesh (for external access)
    getSunMesh() {
        return this.sun;
    }
    
    // Method to get point light
    getPointLight() {
        return this.pointLight;
    }
    
    // Method to create solar flares or corona effects
    addCorona() {
        // Create a larger, transparent corona effect
        const coronaGeometry = new THREE.SphereGeometry(this.radius * 1.2, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.corona.position.copy(this.position);
        this.scene.add(this.corona);
        
        return this.corona;
    }
    
    // Get corona mesh to add to scene
    getCorona() {
        return this.corona;
    }
    
    // Cleanup method
    dispose() {
        // Remove from scene first
        this.removeFromScene();
        
        // Dispose geometry and materials
        if (this.sun) {
            this.sun.geometry.dispose();
            this.sun.material.dispose();
        }
        
        if (this.corona) {
            this.corona.geometry.dispose();
            this.corona.material.dispose();
        }
    }
}
