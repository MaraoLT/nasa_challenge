import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Earth } from './render/Earth';
import { Galaxy } from './render/Galaxy';
import { CameraController } from './controller/CameraController';
import { Sun } from './render/Sun';
import { Meteor } from './render/Meteor';
import { ThreeInitializer } from './utils/ThreeInitializer';

function ThreeDemo() {
  const mountRef = useRef(null);

  // Get preloaded assets and preprocessed objects from global window object
  const preloadedAssets = window.preloadedAssets || {};
  const preprocessedObjects = window.preprocessedObjects || {};
  const assetsPreloaded = sessionStorage.getItem('assetsPreloaded') === 'true';

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('ThreeDemo starting...');

    // Check if we have a background scene ready
    if (ThreeInitializer.isSceneReady()) {
      console.log('Background scene is ready! Taking it over...');
      takeOverBackgroundScene();
    } else {
      console.log('No background scene ready, initializing from scratch...');
      initializeFromScratch();
    }

    function takeOverBackgroundScene() {
      const backgroundScene = ThreeInitializer.getBackgroundScene();
      if (!backgroundScene) {
        console.warn('Background scene not available, falling back to normal init');
        initializeFromScratch();
        return;
      }

      console.log('Taking over background scene...');

      // Clear any existing content first
      mountRef.current.innerHTML = '';

      // Take ownership of the background scene
      const { scene, camera, renderer, sunInstance, earthInstance, galaxy, cameraController, ambientLight, startTimestamp } = backgroundScene;

      // Attach the renderer to our DOM element
      backgroundScene.attachToDOM(mountRef.current);

      // Variables for this component
      let currentMeteor = null;
      let animationId;

      // Start the visible animation loop using the background scene's start time
      let lastTimestamp = performance.now();

      const animate = (currentTimestamp) => {
        const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
        lastTimestamp = currentTimestamp;
        const absoluteTime = (currentTimestamp - startTimestamp) / 1000;

        // Update camera controller
        cameraController.update();

        // Update Earth's orbital position with absolute time from background scene start
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

      // Start animation immediately
      animationId = requestAnimationFrame(animate);

      // Meteor management functions
      const createNewMeteor = () => {
        if (currentMeteor) {
          currentMeteor.dispose();
          currentMeteor = null;
          cameraController.setCurrentMeteor(null);
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 150;
        const height = (Math.random() - 0.5) * 100;

        const meteorPosition = new THREE.Vector3(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );

        currentMeteor = Meteor.createRandomMeteor(
          scene,
          5, 20,
          meteorPosition,
          preloadedAssets,
          preprocessedObjects
        );

        currentMeteor.startOrbit(sunInstance.getPosition(), 0.002 + Math.random() * 0.003);
        cameraController.setCurrentMeteor(currentMeteor);

        console.log('New meteor created!');
      };

      const handleKeyPress = (event) => {
        switch(event.code) {
          case 'KeyM':
            createNewMeteor();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // Store cleanup function for this component
      window.threeCleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        cameraController.disableControls(renderer.domElement);
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('resize', handleResize);
        if (currentMeteor) {
          currentMeteor.dispose();
          cameraController.setCurrentMeteor(null);
        }
        // Don't dispose of background scene objects here - they're managed by ThreeInitializer
        if (mountRef.current) mountRef.current.innerHTML = '';
      };
    }

    function initializeFromScratch() {
      // Fallback to original initialization
      console.log('ThreeDemo starting with preloaded assets:', assetsPreloaded ? 'Yes' : 'No');
      console.log('Available assets:', Object.keys(preloadedAssets));
      console.log('Available preprocessed objects:', Object.keys(preprocessedObjects));

      // Clear any existing content first
      mountRef.current.innerHTML = '';

      // Create scene, camera, and renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        stencil: false
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Append to the ref div
      mountRef.current.appendChild(renderer.domElement);

      // Create scene objects
      const sunInstance = new Sun(scene, 15, preloadedAssets, preprocessedObjects);
      sunInstance.setPosition(0, 0, 0);

      const earthInstance = new Earth(scene, 1, 32, new THREE.Vector3(150, 0, 0), preloadedAssets, preprocessedObjects);
      earthInstance.startOrbit();

      // Add galaxy
      let galaxy;
      if (preprocessedObjects.galaxyGeometry && preprocessedObjects.galaxyMaterial) {
        galaxy = new THREE.Mesh(preprocessedObjects.galaxyGeometry, preprocessedObjects.galaxyMaterial);
      } else {
        galaxy = new Galaxy(500, 64, preloadedAssets).mesh;
      }
      scene.add(galaxy);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
      scene.add(ambientLight);
      sunInstance.addCorona();

      // Initialize camera controller
      const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 20, 500);
      cameraController.enableControls(renderer.domElement);
      cameraController.setZoomLimits(20, 500);
      cameraController.setTargetObjects(sunInstance, earthInstance);

      // Set initial camera position to look at Earth
      const earthPos = earthInstance.getPosition();
      const direction = new THREE.Vector3(0, 0, 1).normalize();
      const cameraDistance = 8;

      camera.position.copy(earthPos).add(direction.multiplyScalar(cameraDistance));
      camera.lookAt(earthPos);

      cameraController.target.copy(earthPos);
      cameraController.spherical.setFromVector3(camera.position.clone().sub(earthPos));
      cameraController.currentDistance = cameraDistance;

      // Lock onto Earth immediately (no transition needed since we're already positioned correctly)
      setTimeout(() => {
        cameraController.lockedTarget = earthInstance;
        cameraController.lockMode = 'earth';
        cameraController.updateMinDistanceForTarget();
        console.log('Camera locked onto Earth from start');
      }, 100);

      // Variables for this component
      let currentMeteor = null;
      let animationId;

      // Start animation
      const startTimestamp = performance.now();
      let lastTimestamp = startTimestamp;

      const animate = (currentTimestamp) => {
        const deltaTime = (currentTimestamp - lastTimestamp) / 1000;
        lastTimestamp = currentTimestamp;
        const absoluteTime = (currentTimestamp - startTimestamp) / 1000;

        cameraController.update();

        earthInstance.updateOrbit(absoluteTime);
        earthInstance.rotate(0.5 * deltaTime);
        earthInstance.updateMatrixWorld();

        const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
        earthInstance.updateSunDirection(sunDirection);

        sunInstance.update();

        if (currentMeteor) {
          currentMeteor.updateOrbit(absoluteTime);
          currentMeteor.rotate(0.02);
        }

        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);

      // Event handlers (same as background scene version)
      const createNewMeteor = () => {
        if (currentMeteor) {
          currentMeteor.dispose();
          currentMeteor = null;
          cameraController.setCurrentMeteor(null);
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 150;
        const height = (Math.random() - 0.5) * 100;

        const meteorPosition = new THREE.Vector3(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );

        currentMeteor = Meteor.createRandomMeteor(
          scene,
          5, 20,
          meteorPosition,
          preloadedAssets,
          preprocessedObjects
        );

        currentMeteor.startOrbit(sunInstance.getPosition(), 0.002 + Math.random() * 0.003);
        cameraController.setCurrentMeteor(currentMeteor);

        console.log('New meteor created!');
      };

      const handleKeyPress = (event) => {
        switch(event.code) {
          case 'KeyM':
            createNewMeteor();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);
      
      // Store cleanup function
      window.threeCleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        cameraController.disableControls(renderer.domElement);
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('resize', handleResize);
        if (sunInstance) sunInstance.dispose();
        if (earthInstance) earthInstance.dispose();
        if (currentMeteor) {
          currentMeteor.dispose();
          cameraController.setCurrentMeteor(null);
        }
        renderer.dispose();
        if (mountRef.current) mountRef.current.innerHTML = '';
      };
    }

    // Cleanup function
    return () => {
      if (window.threeCleanup) {
        window.threeCleanup();
        window.threeCleanup = null;
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
