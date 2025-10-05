import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Earth } from './render/Earth';
import { Galaxy } from './render/Galaxy';
import { CameraController } from './controller/CameraController';
import { Sun } from './render/Sun';
import { Meteor } from './render/Meteor';

function ThreeDemo() {
  const mountRef = useRef(null);
  
  // Get preloaded assets and preprocessed objects from global window object
  const preloadedAssets = window.preloadedAssets || {};
  const preprocessedObjects = window.preprocessedObjects || {};
  const assetsPreloaded = sessionStorage.getItem('assetsPreloaded') === 'true';

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('ThreeDemo starting with preloaded assets:', assetsPreloaded ? 'Yes' : 'No');
    console.log('Available assets:', Object.keys(preloadedAssets));
    console.log('Available preprocessed objects:', Object.keys(preprocessedObjects));

    // Clear any existing content first
    mountRef.current.innerHTML = '';

    // Create scene, camera, and renderer with loading optimizations
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable for faster initialization, re-enable after load
      powerPreference: "high-performance",
      stencil: false
    });

    // Fast initial setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = false; // Disable shadows during loading
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    
    // Append to the ref div
    mountRef.current.appendChild(renderer.domElement);

    // Variables for smooth initialization
    let sunInstance, earthInstance, cameraController;
    let currentMeteor = null;
    let animationId;

    // Progressive loading function to prevent blocking
    const initializeSceneProgressive = () => {
      // Step 1: Create sun first (lightest object)
      console.log('Creating sun...');
      sunInstance = new Sun(scene, 15, preloadedAssets, preprocessedObjects);
      sunInstance.setPosition(0, 0, 0);
      
      // Render the sun immediately so user sees something
      camera.position.set(0, 0, 50);
      renderer.render(scene, camera);

      // Step 2: Add Earth after a micro-delay
      setTimeout(() => {
        console.log('Creating Earth...');
        earthInstance = new Earth(scene, 1, 32, new THREE.Vector3(150, 0, 0), preloadedAssets, preprocessedObjects);
        earthInstance.startOrbit();
        
        // Render with Earth
        renderer.render(scene, camera);

        // Step 3: Add Galaxy after another micro-delay
        setTimeout(() => {
          console.log('Creating Galaxy...');
          let galaxy;
          if (preprocessedObjects.galaxyGeometry && preprocessedObjects.galaxyMaterial) {
            console.log('Using preprocessed galaxy objects');
            galaxy = new THREE.Mesh(preprocessedObjects.galaxyGeometry, preprocessedObjects.galaxyMaterial);
          } else {
            console.log('Creating galaxy normally');
            galaxy = new Galaxy(500, 64, preloadedAssets).mesh;
          }
          scene.add(galaxy);

          // Step 4: Add lighting and effects
          setTimeout(() => {
            console.log('Setting up lighting and camera...');
            const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
            scene.add(ambientLight);
            sunInstance.addCorona();

            // Initialize camera controller
            cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 20, 500);
            cameraController.enableControls(renderer.domElement);
            cameraController.setZoomLimits(20, 500);
            cameraController.setTargetObjects(sunInstance, earthInstance);

            const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
            earthInstance.updateSunDirection(sunDirection);

            // Step 5: Final camera setup and start animation
            setTimeout(() => {
              console.log('Final setup and starting animation...');
              initializeCamera();
              
              // Re-enable antialiasing now that everything is loaded
              if (renderer.getContext().getParameter(renderer.getContext().SAMPLES) > 0) {
                // Create new renderer with antialiasing for smooth operation
                const smoothRenderer = new THREE.WebGLRenderer({ 
                  antialias: true,
                  powerPreference: "high-performance"
                });
                smoothRenderer.setSize(window.innerWidth, window.innerHeight);
                smoothRenderer.setClearColor(0x000000);
                smoothRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                
                // Replace renderer in DOM
                mountRef.current.removeChild(renderer.domElement);
                mountRef.current.appendChild(smoothRenderer.domElement);
                
                // Update references
                Object.assign(renderer, smoothRenderer);
                cameraController.enableControls(smoothRenderer.domElement);
              }
              
              startAnimation();
            }, 16); // ~1 frame delay
          }, 16); // ~1 frame delay
        }, 16); // ~1 frame delay
      }, 16); // ~1 frame delay
    };

    const initializeCamera = () => {
      const earthPos = earthInstance.getPosition();
      const direction = new THREE.Vector3(0, 0, 1).normalize();
      const cameraDistance = 8;
      
      camera.position.copy(earthPos).add(direction.multiplyScalar(cameraDistance));
      camera.lookAt(earthPos);
      
      cameraController.target.copy(earthPos);
      cameraController.spherical.setFromVector3(camera.position.clone().sub(earthPos));
      cameraController.currentDistance = cameraDistance;
      
      setTimeout(() => {
        cameraController.lockOntoEarthWithTransition(1000);
      }, 100);
    };

    const startAnimation = () => {
      const startTimestamp = performance.now();
      let lastTimestamp = startTimestamp;
      
      const animate = (currentTimestamp) => {
        const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
        lastTimestamp = currentTimestamp;
        const absoluteTime = (currentTimestamp - startTimestamp) / 1000;

        // Update camera controller
        cameraController.update();
        
        // Update Earth's orbital position with absolute time
        earthInstance.updateOrbit(absoluteTime);
        earthInstance.rotate(0.5 * deltaTime);
        earthInstance.updateMatrixWorld();
        
        // Update sun direction based on current Earth position
        const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
        earthInstance.updateSunDirection(sunDirection);

        // Update sun animation
        sunInstance.update();
        
        // Update meteor if it exists
        if (currentMeteor) {
          currentMeteor.updateOrbit(absoluteTime);
          currentMeteor.rotate(0.02);
        }

        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);
    };

    // Meteor management
    const createNewMeteor = () => {
      // Remove existing meteor if any
      if (currentMeteor) {
        currentMeteor.dispose();
        currentMeteor = null;
        // Clear meteor reference in camera controller
        cameraController.setCurrentMeteor(null);
      }
      
      // Create new meteor with random position around the system
      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 150; // Distance between 200-350 units (beyond Earth's orbit)
      const height = (Math.random() - 0.5) * 100; // Some vertical spread
      
      const meteorPosition = new THREE.Vector3(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      // Create meteor with appropriate size for the new scale
      currentMeteor = Meteor.createRandomMeteor(
        scene,
        5, 20, // radius between 5 and 20 (scaled up from 0.5-2.0)
        meteorPosition,
        preloadedAssets,
        preprocessedObjects
      );
      
      // Add some orbital motion
      currentMeteor.startOrbit(sunInstance.getPosition(), 0.002 + Math.random() * 0.003);
      
      // Set meteor reference in camera controller
      cameraController.setCurrentMeteor(currentMeteor);
      
      console.log('New meteor created!');
    };
    
    // Keyboard event handler for meteor creation
    const handleKeyPress = (event) => {
      switch(event.code) {
        case 'KeyM':
          createNewMeteor();
          break;
      }
    };
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start progressive initialization
    initializeSceneProgressive();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Disable camera controls
      if (cameraController) {
        cameraController.disableControls(renderer.domElement);
      }
      
      // Remove keyboard event listener
      window.removeEventListener('keydown', handleKeyPress);
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose of objects
      if (sunInstance) sunInstance.dispose();
      if (earthInstance) earthInstance.dispose();
      if (currentMeteor) {
        currentMeteor.dispose();
        // Clear meteor reference in camera controller
        if (cameraController) cameraController.setCurrentMeteor(null);
      }
      
      renderer.dispose();
      
      // Clear the mount point
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Earth Explorer</h2>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>🖱️ Mouse: Rotate camera</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>🖱️ Scroll: Zoom in/out</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ R: Reset camera</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ G: Geostationary orbit</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ 0: Lock onto Sun</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ 1: Lock onto Earth</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ 2: Lock onto Meteor</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ M: Create new Meteor</p>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>⌨️ ESC: Unlock camera</p>
        <p style={{ margin: '0 0 10px 0', fontSize: '12px' }}>⌨️ ↑↓: Zoom</p>
        <a href="/" style={{
          color: '#61dafb',
          textDecoration: 'none',
          fontWeight: 'bold',
          border: '1px solid #61dafb',
          padding: '5px 10px',
          borderRadius: '4px'
        }}>← Back to Home</a>
      </div>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default ThreeDemo;
