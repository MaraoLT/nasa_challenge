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
        const earthDayTexture = textureLoader.load('/resources/earth/Earth Map.jpg');
        const earthNightTexture = textureLoader.load('/resources/earth/Earth Night Map.jpg');
        const bumpTexture = textureLoader.load('/resources/earth/Earth Topographic Map.png');
        
        // Configure texture settings for better quality
        earthDayTexture.wrapS = THREE.RepeatWrapping;
        earthDayTexture.wrapT = THREE.RepeatWrapping;
        earthNightTexture.wrapS = THREE.RepeatWrapping;
        earthNightTexture.wrapT = THREE.RepeatWrapping;
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;

        // Create custom shader material for day/night transition
        const material = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: earthDayTexture },
                nightTexture: { value: earthNightTexture },
                bumpTexture: { value: bumpTexture },
                bumpScale: { value: 0.5 },
                sunDirection: { value: new THREE.Vector3(1, 0, 0) }, // Sun direction in world space
                modelMatrix: { value: new THREE.Matrix4() }, // Earth's rotation matrix
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                uniform sampler2D bumpTexture;
                uniform float bumpScale;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    
                    // Apply bump mapping to position
                    vec3 newPosition = position;
                    float height = texture2D(bumpTexture, uv).r;
                    newPosition += normal * height * bumpScale * 0.01;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform vec3 sunDirection;
                uniform mat4 modelMatrix;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    // Transform normal to world space for lighting calculation
                    vec3 worldNormal = normalize((modelMatrix * vec4(vPosition, 0.0)).xyz);
                    
                    // Calculate how much light this fragment receives in world space
                    float lightIntensity = dot(normalize(worldNormal), normalize(sunDirection));
                    
                    // Smooth transition between day and night
                    float dayFactor = smoothstep(-0.1, 0.1, lightIntensity);
                    float nightFactor = 1.0 - dayFactor;
                    
                    // Sample both textures
                    vec4 dayColor = texture2D(dayTexture, vUv);
                    vec4 nightColor = texture2D(nightTexture, vUv);
                    
                    // Make night lights brighter and more vibrant
                    nightColor.rgb *= 2.5; // Increase night light intensity
                    
                    // Blend between day and night
                    vec4 finalColor = dayColor * dayFactor + nightColor * nightFactor;
                    
                    // Add more ambient lighting and enhance night glow
                    finalColor.rgb += 0.05 * dayColor.rgb * nightFactor; // Increased from 0.1 to 0.15
                    
                    gl_FragColor = finalColor;
                }
            `
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Store reference to material for updating sun direction
        mesh.userData.material = material;
        
        return mesh;
    }

    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(this.radius * 1.02, this.segments, this.segments);

        const TextureLoader = new THREE.TextureLoader();
        const atmosphereTexture = TextureLoader.load('/resources/earth/Earth Clouds.jpg');
        
        // Use MeshBasicMaterial so it's not affected by directional lighting
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            alphaMap: atmosphereTexture,
            transparent: true,
            opacity: 0.4,
            color: 0xffffff, // Slight tint for clouds
        });
        
        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        return atmosphereMesh;
    }
    
    // Update the sun direction for day/night transition
    updateSunDirection(sunPosition) {
        if (this.mesh && this.mesh.userData.material) {
            // Normalize the sun direction
            const sunDirection = sunPosition.clone().normalize();
            this.mesh.userData.material.uniforms.sunDirection.value = sunDirection;
        }
    }
    
    // Update the model matrix for world space calculations
    updateModelMatrix() {
        if (this.mesh && this.mesh.userData.material) {
            this.mesh.userData.material.uniforms.modelMatrix.value = this.mesh.matrixWorld;
        }
    }
}