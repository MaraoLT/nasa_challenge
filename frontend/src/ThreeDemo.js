import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Earth } from './render/Earth';
import { Galaxy } from './render/Galaxy';
import { CameraController } from './controller/CameraController';
import { Sun } from './render/Sun';
import { Meteor } from './render/Meteor';

function ThreeDemo() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content first
    mountRef.current.innerHTML = '';

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Pure black background to eliminate blue hue
    
    // Append to the ref div
    mountRef.current.appendChild(renderer.domElement);

    // Create sun instance - now handles its own scene addition
    const sunInstance = new Sun(scene, 15); // Pass scene, radius = 1
    sunInstance.setPosition(0, 0, 0); // Position sun at origin
    
    // Create earth instance with initial orbital position - now handles its own scene addition
    const earthInstance = new Earth(scene, 1, 32, new THREE.Vector3(150, 0, 0)); // Pass scene, radius = 1, segments = 32, initial position
    
    // Start Earth's orbit around the sun
    earthInstance.startOrbit(); // Orbit around sun with speed 0.01
    
    const galaxy = new Galaxy(200, 64).mesh;
    scene.add(galaxy);

    // Add lighting to illuminate the planet
    // Only ambient light for the atmosphere and galaxy
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Remove directional light - Earth uses custom shader lighting
    // The atmosphere will only use ambient light for a subtle glow
    // const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
    // pointLight.position.set(10, 10, 10);
    // scene.add(pointLight);

    // Optional: Add corona
    sunInstance.addCorona();

    camera.position.set(0, 0, 50); // Start at a reasonable distance for the new scale

    // Initialize camera controller - target the sun at origin
    const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 20, 500); // Min distance 20 to see sun clearly, max 500 for wide view
    cameraController.enableControls(renderer.domElement);
    cameraController.setZoomLimits(20, 500);
    
    // Set target objects for lock-in functionality
    cameraController.setTargetObjects(sunInstance, earthInstance);

    // Set initial sun direction based on sun position relative to Earth
    const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
    earthInstance.updateSunDirection(sunDirection);

    // Initialize camera to Earth position smoothly after all objects are ready
    const initializeCamera = () => {
      // Set camera to look at Earth initially without jarring transitions
      const earthPos = earthInstance.getPosition();
      const direction = new THREE.Vector3(0, 0, 1).normalize();
      const cameraDistance = 8;
      
      // Position camera relative to Earth
      camera.position.copy(earthPos).add(direction.multiplyScalar(cameraDistance));
      camera.lookAt(earthPos);
      
      // Update camera controller to match
      cameraController.target.copy(earthPos);
      cameraController.spherical.setFromVector3(camera.position.clone().sub(earthPos));
      cameraController.currentDistance = cameraDistance;
      
      // Lock onto Earth smoothly after initial positioning
      setTimeout(() => {
        cameraController.lockOntoEarthWithTransition(1000); // 1 second smooth transition
      }, 100);
    };
    
    // Call initialization after a brief delay to ensure all objects are ready
    setTimeout(initializeCamera, 50);

    // Meteor management
    let currentMeteor = null;
    
    // Function to create a new meteor
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
        meteorPosition
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

    // Animation loop
    let animationId;
    const startTimestamp = performance.now();
    let lastTimestamp = startTimestamp;
    const animate = (currentTimestamp) => {
      const deltaTime = (currentTimestamp - lastTimestamp) / 1000; // seconds
      lastTimestamp = currentTimestamp;
      const absoluteTime = (currentTimestamp - startTimestamp) / 1000; // seconds since animation started

      // Update camera controller
      cameraController.update();
      
      // Update Earth's orbital position with absolute time
      earthInstance.updateOrbit(absoluteTime);

      // Rotate the Earth and atmosphere using deltaTime
      earthInstance.rotate(0.5 * deltaTime);

      // Update Earth's model matrix for day/night calculations
      earthInstance.updateMatrixWorld();
      
      // Update sun direction based on current Earth position
      const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
      earthInstance.updateSunDirection(sunDirection);

      // Update sun animation
      sunInstance.update();
      
      // Update meteor if it exists
      if (currentMeteor) {
        currentMeteor.updateOrbit(absoluteTime);
        currentMeteor.rotate(0.02); // Faster rotation for meteors
      }

      renderer.render(scene, camera);
      
      animationId = requestAnimationFrame(animate);
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start the animation immediately
    requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Disable camera controls
      cameraController.disableControls(renderer.domElement);
      
      // Remove keyboard event listener
      window.removeEventListener('keydown', handleKeyPress);
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose of objects
      sunInstance.dispose();
      earthInstance.dispose();
      if (currentMeteor) {
        currentMeteor.dispose();
        // Clear meteor reference in camera controller
        cameraController.setCurrentMeteor(null);
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
