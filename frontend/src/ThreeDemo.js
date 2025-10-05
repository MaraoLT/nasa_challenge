import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Earth } from './render/Earth';
import { Galaxy } from './render/Galaxy';
import { CameraController } from './controller/CameraController';
import { Sun } from './render/Sun';
import { Meteor } from './render/Meteor';
import { ThreeInitializer } from './utils/ThreeInitializer';
import Stats from 'stats.js';
import musicManager from './utils/MusicManager';
import audioContextManager from './utils/AudioContextManager';
import { createOrbitFromJPLData, parseOrbitFile} from './utils/NasaJsonParser.js';

function ThreeDemo() {
  const mountRef = useRef(null);
  const statsContainerRef = useRef(null);
  const meteorsListRef = useRef([]); // Use ref for meteors list to access in animation loops

  // Get preloaded assets and preprocessed objects from global window object
  const preloadedAssets = window.preloadedAssets || {};
  const preprocessedObjects = window.preprocessedObjects || {};
  const assetsPreloaded = sessionStorage.getItem('assetsPreloaded') === 'true';

  const [meteorsList, setMeteorsList] = useState([]);
  const [asteroidOrbits, setAsteroidOrbits] = useState([]);
  const [sceneReady, setSceneReady] = useState(false);
  const [currentScene, setCurrentScene] = useState(null);
  const [sunInstance, setSunInstance] = useState(null);
  const [currentCamera, setCurrentCamera] = useState(null); // Add camera state to store camera reference

  // Function to create meteors from asteroid orbits
  const createMeteorsFromOrbits = (orbits, scene, sun, assets, preprocessed, camera) => {
    if (!orbits.length || !scene || !sun) return [];

    console.log(`Creating ${orbits.length} meteors from asteroid orbits`);
    const meteors = [];

    orbits.forEach((orbitParams, index) => {
      try {
        // Calculate initial position based on orbit parameters
        const position = new THREE.Vector3(
          orbitParams.semiMajorAxis * Math.cos(orbitParams.omega),
          0,
          orbitParams.semiMajorAxis * Math.sin(orbitParams.omega)
        );

        const meteor = new Meteor(
          scene,
          0.05 + Math.random() * 0.1, // Random size between 0.05 and 0.15
          32,
          position,
          assets,
          preprocessed
        );

        // Set camera reference for trace fading
        meteor.setCamera(camera);

        // Start the meteor's orbit
        meteor.startOrbit(sun.getPosition(), 0.001 + Math.random() * 0.002);
        meteors.push(meteor);

        if (index < 5) { // Log first 5 for debugging
          console.log(`Created meteor ${index + 1}: ${orbitParams.name}`);
        }
      } catch (error) {
        console.error(`Failed to create meteor ${index + 1}:`, error);
      }
    });

    console.log(`Successfully created ${meteors.length} meteors`);
    return meteors;
  };

  // Effect to create meteors when we have both orbits and scene ready
  useEffect(() => {
    if (asteroidOrbits.length > 0 && sceneReady && currentScene && sunInstance && currentCamera) {
      console.log('Creating meteors: orbits ready and scene ready');
      const meteors = createMeteorsFromOrbits(
        asteroidOrbits,
        currentScene,
        sunInstance,
        preloadedAssets,
        preprocessedObjects,
        currentCamera // Pass actual camera reference
      );
      setMeteorsList(meteors);
      meteorsListRef.current = meteors; // Update ref for animation loops
    }
  }, [asteroidOrbits, sceneReady, currentScene, sunInstance, currentCamera]);

  useEffect(() => {
    // Load Near-Earth.json using fetch
    fetch('/Near-Earth.json')
      .then(response => response.json())
      .then(data => {
        console.log('Loaded Near-Earth.json data:', data.length, 'asteroids');
        const AsteroidOrbits = parseOrbitFile(data);
        setAsteroidOrbits(AsteroidOrbits);
      })
      .catch(err => {
        console.error('Failed to load Near-Earth.json:', err);
        setAsteroidOrbits([]);
      });

    console.log("ThreeDemo useEffect running...");
    // let data = require('./Near-Earth.json');
    // console.log("data read");
    // let AsteroidOrbits = parseOrbitFile(data);
    // AsteroidOrbits is an array of orbit parameter objects
    // let meteorsList = [];


    const stats = new Stats();
    stats.showPanel(0);
    if (statsContainerRef.current) {
      statsContainerRef.current.appendChild(stats.dom);
    }

    if (!mountRef.current) return;

    console.log('ThreeDemo starting...');

    // Initialize audio context manager
    audioContextManager.init();

    // Start playing the space music - use correct path
    const playResult = musicManager.playTrack('/resources/sounds/Drifting Through the Void.mp3', true);
    if (!playResult) {
      console.log('Music will play after user interaction');
    }

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
      const { scene, camera, renderer, sunInstance: sun, earthInstance, galaxy, cameraController, ambientLight, startTimestamp } = backgroundScene;

      // Set scene and sun for meteor creation
      setCurrentScene(scene);
      setSunInstance(sun);
      setCurrentCamera(camera); // Set camera reference for meteor creation
      setSceneReady(true);

      // Attach the renderer to our DOM element
      backgroundScene.attachToDOM(mountRef.current);

      // Variables for this component
      let currentMeteor = null;
      let animationId;

      // Start the visible animation loop using the background scene's start time
      let lastTimestamp = performance.now();

      const animate = (currentTimestamp) => {
        stats.begin();
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
        const sunDirection = sun.getPosition().clone().sub(earthInstance.getPosition()).normalize();
        earthInstance.updateSunDirection(sunDirection);

        // Update sun animation
        sun.update();

        // Update meteor if it exists
        if (currentMeteor) {
          currentMeteor.updateOrbit(absoluteTime);
          currentMeteor.rotate(0.02);
        }

        // Update all meteors from asteroid data
        meteorsListRef.current.forEach((meteor) => {
          meteor.updateOrbit(absoluteTime);
          meteor.rotate(0.01);
        });

        renderer.render(scene, camera);
        stats.end();
        animationId = requestAnimationFrame(animate);
      };

      // Start animation immediately
      animationId = requestAnimationFrame(animate);

      // Meteor management functions
      const createNewRandomMeteor = () => {
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
          0.02, 0.2,
          meteorPosition,
          preloadedAssets,
          preprocessedObjects
        );

        currentMeteor.startOrbit(sun.getPosition(), 0.002 + Math.random() * 0.003);
        cameraController.setCurrentMeteor(currentMeteor);

        console.log('New meteor created!');
      };

      const handleKeyPress = (event) => {
        switch(event.code) {
          case 'KeyM':
            createNewRandomMeteor();
            break;
          case 'KeyA':
            // Lock onto first asteroid/meteor from the list
            if (meteorsListRef.current.length > 0) {
              const firstMeteor = meteorsListRef.current[0];
              cameraController.setCurrentMeteor(firstMeteor);
              cameraController.lockMode = 'meteor';
              console.log('Camera locked onto first asteroid');
            }
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
        // Remove stats panel from container
        if (statsContainerRef.current && stats.dom.parentNode === statsContainerRef.current) {
          statsContainerRef.current.removeChild(stats.dom);
        }
        // Don't dispose of background scene objects here - they're managed by ThreeInitializer
        if (mountRef.current) mountRef.current.innerHTML = '';
      };
    }

    function initializeFromScratch() {
      // Fallback to original initialization
      console.log('ThreeDemo starting from scratch', assetsPreloaded ? 'Yes' : 'No');
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

      const earthInstance = new Earth(scene, 1, 16, new THREE.Vector3(150, 0, 0), preloadedAssets, preprocessedObjects);
      earthInstance.startOrbit();

      // Set scene and sun for meteor creation
      setCurrentScene(scene);
      setSunInstance(sunInstance);
      setCurrentCamera(camera); // Set camera reference for meteor creation
      setSceneReady(true);

      // Add galaxy
      let galaxy;
      if (preprocessedObjects.galaxyGeometry && preprocessedObjects.galaxyMaterial) {
        galaxy = new THREE.Mesh(preprocessedObjects.galaxyGeometry, preprocessedObjects.galaxyMaterial);
      } else {
        galaxy = new Galaxy(10000, 64, preloadedAssets).mesh;
      }
      scene.add(galaxy);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
      scene.add(ambientLight);
      sunInstance.addCorona();

      // Initialize camera controller
      const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 80, 500);
      cameraController.enableControls(renderer.domElement);
      cameraController.setZoomLimits(80, 500);
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
        stats.begin();
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

        // Update all meteors from asteroid data
        meteorsListRef.current.forEach((meteor) => {
          meteor.updateOrbit(absoluteTime);
          meteor.rotate(0.01);
        });

        if (currentMeteor) {
          currentMeteor.updateOrbit(absoluteTime);
          currentMeteor.rotate(0.02);
        }

        renderer.render(scene, camera);
        stats.end();
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
          0.02, 0.2,
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
          case 'KeyA':
            // Lock onto first asteroid/meteor from the list
            if (meteorsListRef.current.length > 0) {
              const firstMeteor = meteorsListRef.current[0];
              cameraController.setCurrentMeteor(firstMeteor);
              cameraController.lockMode = 'meteor';
              console.log('Camera locked onto first asteroid');
            }
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
        // Remove stats panel from container
        if (statsContainerRef.current && stats.dom.parentNode === statsContainerRef.current) {
          statsContainerRef.current.removeChild(stats.dom);
        }
        if (mountRef.current) mountRef.current.innerHTML = '';
      };
    }

    // Cleanup function
    return () => {
      // Stop music when leaving ThreeDemo
      musicManager.fadeOut(500);

      if (window.threeCleanup) {
        window.threeCleanup();
        window.threeCleanup = null;
      }
      // Remove stats panel from container (fallback cleanup)
      if (statsContainerRef.current && stats.dom.parentNode === statsContainerRef.current) {
        statsContainerRef.current.removeChild(stats.dom);
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
      <div ref={statsContainerRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 200 }} />
    </div>
  );
}

export default ThreeDemo;
