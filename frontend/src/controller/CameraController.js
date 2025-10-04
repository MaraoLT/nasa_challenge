import * as THREE from 'three';

export class CameraController {
    constructor(camera, target = new THREE.Vector3(0, 0, 0), minDistance = 2, maxDistance = 50) {
        this.camera = camera;
        this.target = target.clone();
        
        // Camera movement settings
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
        this.currentDistance = Math.max(minDistance, 2); // Start at reasonable distance but respect minDistance
        
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
        
        // Lock-in system for following objects
        this.lockedTarget = null; // Reference to the object we're locked onto
        this.lockMode = 'none'; // 'none', 'sun', 'earth'
        this.isTransitioning = false; // Flag to prevent input during transitions
        
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
        // Prevent input during transitions
        if (this.isTransitioning) return;
        
        switch(event.code) {
            case 'KeyR':
                // Reset camera position
                this.resetCamera();
                break;
            case 'KeyG':
                // Toggle geostationary orbit (matches Earth rotation)
                this.autoRotate = !this.autoRotate;
                break;
            case 'Digit0':
                // Lock onto sun with transition
                this.lockOntoSunWithTransition();
                break;
            case 'Digit1':
                // Lock onto earth with transition
                this.lockOntoEarthWithTransition();
                break;
            case 'Digit2':
                // Lock onto meteor if it exists
                this.lockOntoMeteorIfExists();
                break;
            case 'Escape':
                // Unlock from any target
                this.unlockTarget();
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
        // Update target if locked onto an object (but not during transitions)
        if (this.lockedTarget && this.lockedTarget.getPosition && !this.isTransitioning) {
            this.target.copy(this.lockedTarget.getPosition());
        }
        
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
    
    // Lock-in methods for following objects
    setTargetObjects(sunInstance, earthInstance) {
        this.sunInstance = sunInstance;
        this.earthInstance = earthInstance;
    }
    
    // Set current meteor for locking (called when meteor is created/destroyed)
    setCurrentMeteor(meteorInstance) {
        this.currentMeteor = meteorInstance;
    }
    
    // Internal method to lock onto meteor if one exists
    lockOntoMeteorIfExists() {
        if (this.currentMeteor) {
            this.lockOntoMeteor(this.currentMeteor);
        } else {
            console.log('No meteor to lock onto. Press M to create one!');
        }
    }
    
    // Lock onto sun with smooth transition
    lockOntoSunWithTransition(duration = 1500) {
        if (!this.sunInstance) return;
        
        // Don't transition if already locked onto sun
        if (this.lockMode === 'sun') return;
        
        // Temporarily unlock current target to prevent interference
        const previousTarget = this.lockedTarget;
        const previousMode = this.lockMode;
        this.lockedTarget = null;
        this.lockMode = 'none';
        
        const targetDistance = Math.max(this.minDistance, 3);
        
        this.transitionToTarget(this.sunInstance, targetDistance, () => {
            this.lockedTarget = this.sunInstance;
            this.lockMode = 'sun';
            console.log('Camera locked onto Sun');
        }, duration);
    }
    
    // Lock onto earth with smooth transition
    lockOntoEarthWithTransition(duration = 1500) {
        if (!this.earthInstance) return;
        
        // Don't transition if already locked onto earth
        if (this.lockMode === 'earth') return;
        
        // Temporarily unlock current target to prevent interference
        const previousTarget = this.lockedTarget;
        const previousMode = this.lockMode;
        this.lockedTarget = null;
        this.lockMode = 'none';
        
        const targetDistance = Math.max(this.minDistance, 2);
        
        this.transitionToTarget(this.earthInstance, targetDistance, () => {
            this.lockedTarget = this.earthInstance;
            this.lockMode = 'earth';
            console.log('Camera locked onto Earth');
        }, duration);
    }
    
    // Lock onto meteor with smooth transition
    lockOntoMeteor(meteorInstance, duration = 1500) {
        if (!meteorInstance) return;
        
        // Don't transition if already locked onto this meteor
        if (this.lockMode === 'meteor' && this.lockedTarget === meteorInstance) return;
        
        // Temporarily unlock current target to prevent interference
        const previousTarget = this.lockedTarget;
        const previousMode = this.lockMode;
        this.lockedTarget = null;
        this.lockMode = 'none';
        
        const targetDistance = Math.max(this.minDistance, 1.5); // Closer for meteors
        
        this.transitionToTarget(meteorInstance, targetDistance, () => {
            this.lockedTarget = meteorInstance;
            this.lockMode = 'meteor';
            console.log('Camera locked onto Meteor');
        }, duration);
    }
    
    // Generic smooth transition to a target
    transitionToTarget(targetObject, targetDistance, onComplete, duration = 1500) {
        this.isTransitioning = true;
        
        // Store starting values
        const startTarget = this.target.clone();
        const startTheta = this.spherical.theta;
        const startPhi = this.spherical.phi;
        const startRadius = this.spherical.radius;
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function (ease-in-out)
            const eased = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Get current target position (updates with moving objects)
            const currentTargetPosition = targetObject.getPosition();
            
            // Calculate target spherical coordinates relative to current target position
            const targetVector = this.camera.position.clone().sub(currentTargetPosition);
            const targetSpherical = new THREE.Spherical();
            targetSpherical.setFromVector3(targetVector);
            
            // Adjust the distance to desired value
            targetSpherical.radius = targetDistance;
            
            // Interpolate target position (follows moving object)
            this.target.lerpVectors(startTarget, currentTargetPosition, eased);
            
            // Interpolate spherical coordinates
            this.spherical.theta = startTheta + (targetSpherical.theta - startTheta) * eased;
            this.spherical.phi = startPhi + (targetSpherical.phi - startPhi) * eased;
            this.spherical.radius = startRadius + (targetSpherical.radius - startRadius) * eased;
            this.currentDistance = this.spherical.radius;
            
            this.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Transition complete
                this.isTransitioning = false;
                if (onComplete) onComplete();
            }
        };
        
        animate();
    }
    
    // Unlock from current target
    unlockTarget() {
        this.lockedTarget = null;
        this.lockMode = 'none';
        this.isTransitioning = false; // Allow immediate control after unlock
        console.log('Camera unlocked');
    }
    
    // Get current lock status
    getLockStatus() {
        return {
            mode: this.lockMode,
            isLocked: this.lockedTarget !== null,
            target: this.lockedTarget
        };
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
