import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Earth } from './render/Earth';
import { Galaxy } from './render/Galaxy';
import { CameraController } from './controller/cameraController';

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

    const earth = new Earth(1, 32).createEarthMesh();
    scene.add(earth);
    const atmosphere = new Earth(1, 32).createAtmosphere();
    scene.add(atmosphere);
    const galaxy = new Galaxy(90, 64).mesh;
    scene.add(galaxy);

    // Add lighting to illuminate the planet
    // Ambient light provides soft overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased intensity
    scene.add(ambientLight);

    // Directional light acts like sunlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Increased intensity
    directionalLight.position.set(5, 3, 5); // Position like the sun
    directionalLight.castShadow = true; // Enable shadows if needed
    scene.add(directionalLight);

    // Optional: Add a point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 1.2, 100); // Increased intensity
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    camera.position.z = 5;

    // Initialize camera controller
    const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0));
    cameraController.enableControls(renderer.domElement);
    cameraController.setZoomLimits(1.5, 20);

    // Animation loop
    let animationId;
    const animate = () => {
      // Update camera controller
      cameraController.update();
      
      // Rotate the Earth and atmosphere
      earth.rotation.y += 0.01;
      atmosphere.rotation.y += 0.01;

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
      
      window.removeEventListener('resize', handleResize);
      
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
