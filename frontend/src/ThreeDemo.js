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
    renderer.setClearColor(0x000011); // Dark blue background
    
    // Append to the ref div
    mountRef.current.appendChild(renderer.domElement);

    // Create sun instance - now handles its own scene addition
    const sunInstance = new Sun(scene, 1); // Pass scene, radius = 1
    sunInstance.setPosition(0, 0, 0); // Position sun at origin
    
    // Create earth instance with initial orbital position - now handles its own scene addition
    const earthInstance = new Earth(scene, 1, 32, new THREE.Vector3(15, 0, 0)); // Pass scene, radius = 1, segments = 32, initial position
    
    // Start Earth's orbit around the sun
    earthInstance.startOrbit(sunInstance.getPosition(), 0.01); // Orbit around sun with speed 0.01
    
    const galaxy = new Galaxy(90, 64).mesh;
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

    camera.position.set(0, 0, 2); // Start closer but not too close

    // Initialize camera controller - target the sun at origin
    const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 0.8, 30); // Min distance 0.8 to see sun clearly
    cameraController.enableControls(renderer.domElement);
    cameraController.setZoomLimits(0.8, 30);
    
    // Set target objects for lock-in functionality
    cameraController.setTargetObjects(sunInstance, earthInstance);

    // Set initial sun direction based on sun position relative to Earth
    const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
    earthInstance.updateSunDirection(sunDirection);

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
      const distance = 20 + Math.random() * 10; // Distance between 20-30 units
      const height = (Math.random() - 0.5) * 10; // Some vertical spread
      
      const meteorPosition = new THREE.Vector3(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      // Create meteor with max size of 2
      currentMeteor = Meteor.createRandomMeteor(
        scene,
        0.5, 2.0, // radius between 0.5 and 2.0
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
    const animate = () => {
      // Update camera controller
      cameraController.update();
      
      // Update Earth's orbital position
      earthInstance.updateOrbit();
      
      // Rotate the Earth and atmosphere using the new method
      earthInstance.rotate(0.01);
      
      // Update Earth's model matrix for day/night calculations
      earthInstance.updateMatrixWorld();
      
      // Update sun direction based on current Earth position
      const sunDirection = sunInstance.getPosition().clone().sub(earthInstance.getPosition()).normalize();
      earthInstance.updateSunDirection(sunDirection);

      // Update sun animation
      sunInstance.update();
      
      // Update meteor if it exists
      if (currentMeteor) {
        currentMeteor.updateOrbit();
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
    animate();

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
