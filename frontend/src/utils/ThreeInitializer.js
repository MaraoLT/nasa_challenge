import * as THREE from 'three';
import { Earth } from '../render/Earth';
import { Galaxy } from '../render/Galaxy';
import { CameraController } from '../controller/CameraController';
import { Sun } from '../render/Sun';
import { Meteor } from '../render/Meteor';

// Shared Three.js initialization that can be called from anywhere
export class ThreeInitializer {
  static backgroundScene = null;
  static isInitializing = false;
  static isReady = false;

  static async initializeInBackground(preloadedAssets, preprocessedObjects) {
    if (this.isInitializing || this.isReady) {
      console.log('Background scene already initializing or ready');
      return;
    }

    this.isInitializing = true;
    console.log('Starting background Three.js initialization...');

    try {
      // Create scene, camera, and renderer (but don't attach to DOM yet)
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false, // Will be upgraded when attached to DOM
        powerPreference: "high-performance",
        stencil: false
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000);
      renderer.shadowMap.enabled = false;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Progressive initialization to prevent blocking
      const sunInstance = new Sun(scene, 15, preloadedAssets, preprocessedObjects);
      sunInstance.setPosition(0, 0, 0);
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 16));
      
      const earthInstance = new Earth(scene, 1, 16, new THREE.Vector3(150, 0, 0), preloadedAssets, preprocessedObjects);
      earthInstance.startOrbit();

      // Another small delay
      await new Promise(resolve => setTimeout(resolve, 16));

      // Add galaxy
      let galaxy;
      if (preprocessedObjects.galaxyGeometry && preprocessedObjects.galaxyMaterial) {
        galaxy = new THREE.Mesh(preprocessedObjects.galaxyGeometry, preprocessedObjects.galaxyMaterial);
      } else {
        galaxy = new Galaxy(500, 64, preloadedAssets).mesh;
      }
      scene.add(galaxy);

      // Another small delay
      await new Promise(resolve => setTimeout(resolve, 16));

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
      scene.add(ambientLight);
      sunInstance.addCorona();

      // Initialize camera controller
      const cameraController = new CameraController(camera, new THREE.Vector3(0, 0, 0), 20, 500);
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

      // Store the initialization timestamp for animation continuity
      const startTimestamp = performance.now();

      // Store the initialized scene
      this.backgroundScene = {
        scene,
        camera,
        renderer,
        sunInstance,
        earthInstance,
        galaxy,
        cameraController,
        ambientLight,
        startTimestamp,
        attachToDOM: (mountElement) => {
          // Attach renderer to DOM and enable controls
          if (mountElement) {
            console.log('Attaching background scene to DOM...');
            mountElement.appendChild(renderer.domElement);
            cameraController.enableControls(renderer.domElement);
            
            // Initial render to show something immediately
            renderer.render(scene, camera);
            
            // Upgrade to smooth renderer after a short delay
            setTimeout(() => {
              const smoothRenderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
              });
              smoothRenderer.setSize(window.innerWidth, window.innerHeight);
              smoothRenderer.setClearColor(0x000000);
              smoothRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              
              // Replace in DOM
              mountElement.removeChild(renderer.domElement);
              mountElement.appendChild(smoothRenderer.domElement);
              
              // Update controls
              cameraController.enableControls(smoothRenderer.domElement);
              
              // Update renderer reference
              Object.assign(renderer, smoothRenderer);
              
              // Render once with new renderer
              renderer.render(scene, camera);
            }, 100);
          }
        }
      };

      this.isReady = true;
      this.isInitializing = false;
      console.log('Background Three.js scene ready!');

    } catch (error) {
      console.error('Error initializing background scene:', error);
      this.isInitializing = false;
    }
  }

  static getBackgroundScene() {
    return this.backgroundScene;
  }

  static isSceneReady() {
    return this.isReady && this.backgroundScene !== null;
  }

  static cleanup() {
    if (this.backgroundScene) {
      // Dispose of objects
      if (this.backgroundScene.sunInstance) this.backgroundScene.sunInstance.dispose();
      if (this.backgroundScene.earthInstance) this.backgroundScene.earthInstance.dispose();
      if (this.backgroundScene.renderer) this.backgroundScene.renderer.dispose();
      
      this.backgroundScene = null;
    }
    this.isReady = false;
    this.isInitializing = false;
  }
}
