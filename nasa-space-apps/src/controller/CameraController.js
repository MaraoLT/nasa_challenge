import * as THREE from 'three';

export class CameraController {
    constructor(camera, target = new THREE.Vector3(0, 0, 0), minDistance = 2, maxDistance = 50) {
        this.camera = camera;
        this.target = target.clone();
        
        // Camera movement settings
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
        this.currentDistance = 5;
        
        // Rotation settings
        this.rotationSpeed = 0.005;
        this.zoomSpeed = 0.1;
        
        // Mouse state
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Spherical coordinates (for orbiting)
        this.spherical = new THREE.Spherical();
        this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));
        
        // Bind event handlers
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        
        // Auto-rotation (geostationary orbit only)
        this.autoRotate = false;
        this.autoRotateSpeed = 0.01; // Always matches Earth's rotation speed
        
        this.update();
    }
    
    // Enable mouse and keyboard controls
    enableControls(domElement) {
        domElement.addEventListener('mousedown', this.onMouseDown);
        domElement.addEventListener('mousemove', this.onMouseMove);
        domElement.addEventListener('mouseup', this.onMouseUp);
        domElement.addEventListener('wheel', this.onWheel);
        window.addEventListener('keydown', this.onKeyDown);
        
        // Prevent context menu on right click
        domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Disable controls
    disableControls(domElement) {
        domElement.removeEventListener('mousedown', this.onMouseDown);
        domElement.removeEventListener('mousemove', this.onMouseMove);
        domElement.removeEventListener('mouseup', this.onMouseUp);
        domElement.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('keydown', this.onKeyDown);
    }
    
    onMouseDown(event) {
        this.isMouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    
    onMouseMove(event) {
        if (!this.isMouseDown) return;
        
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        // Rotate around the target
        this.spherical.theta -= deltaX * this.rotationSpeed;
        this.spherical.phi += deltaY * this.rotationSpeed;
        
        // Limit vertical rotation
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        
        this.update();
    }
    
    onMouseUp(event) {
        this.isMouseDown = false;
    }
    
    onWheel(event) {
        event.preventDefault();
        
        // Zoom in/out
        const zoomDelta = event.deltaY * this.zoomSpeed * 0.01;
        this.currentDistance += zoomDelta;
        this.currentDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.currentDistance));
        
        this.spherical.radius = this.currentDistance;
        this.update();
    }
    
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyR':
                // Reset camera position
                this.resetCamera();
                break;
            case 'KeyG':
                // Toggle geostationary orbit (matches Earth rotation)
                this.autoRotate = !this.autoRotate;
                break;
            case 'ArrowUp':
                // Move closer
                this.currentDistance = Math.max(this.minDistance, this.currentDistance - 0.5);
                this.spherical.radius = this.currentDistance;
                this.update();
                break;
            case 'ArrowDown':
                // Move further
                this.currentDistance = Math.min(this.maxDistance, this.currentDistance + 0.5);
                this.spherical.radius = this.currentDistance;
                this.update();
                break;
        }
    }
    
    // Update camera position
    update() {
        // Auto-rotation
        if (this.autoRotate) {
            this.spherical.theta += this.autoRotateSpeed;
        }
        
        // Convert spherical coordinates to cartesian
        const position = new THREE.Vector3();
        position.setFromSpherical(this.spherical);
        position.add(this.target);
        
        this.camera.position.copy(position);
        this.camera.lookAt(this.target);
    }
    
    // Reset camera to default position
    resetCamera() {
        this.currentDistance = 5;
        this.spherical.radius = this.currentDistance;
        this.spherical.theta = 0;
        this.spherical.phi = Math.PI / 2;
        this.update();
    }
    
    // Set target for camera to orbit around
    setTarget(target) {
        this.target.copy(target);
        this.update();
    }
    
    // Set zoom limits
    setZoomLimits(min, max) {
        this.minDistance = min;
        this.maxDistance = max;
        this.currentDistance = Math.max(min, Math.min(max, this.currentDistance));
        this.spherical.radius = this.currentDistance;
        this.update();
    }
    
    // Get current distance from target
    getDistance() {
        return this.currentDistance;
    }
    
    // Set auto-rotation (always matches Earth's speed)
    setAutoRotate(enabled) {
        this.autoRotate = enabled;
        // Speed is always 0.01 to match Earth's rotation
    }
    
    // Enable geostationary orbit (matches Earth's rotation)
    enableGeostationaryOrbit() {
        this.autoRotate = true;
    }
    
    // Disable geostationary orbit
    disableGeostationaryOrbit() {
        this.autoRotate = false;
    }
    
    // Animate to a specific position
    animateTo(theta, phi, distance, duration = 1000) {
        const startTheta = this.spherical.theta;
        const startPhi = this.spherical.phi;
        const startDistance = this.spherical.radius;
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            this.spherical.theta = startTheta + (theta - startTheta) * eased;
            this.spherical.phi = startPhi + (phi - startPhi) * eased;
            this.spherical.radius = startDistance + (distance - startDistance) * eased;
            this.currentDistance = this.spherical.radius;
            
            this.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}
