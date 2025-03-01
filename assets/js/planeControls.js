import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { scene, player } from './sceneSetup.js';
import { showMessage } from './main.js';

const randomColor1 = Math.random() * 0xffffff;
const randomColor2 = Math.random() * 0xffffff;

const planeConfigs = {
    planeOne: {
        body: { width: 0.8, height: 0.8, length: 4, color: randomColor1 },
        nose: { width: 0.6, height: 0.6, length: 0.8, position: { x: 0, y: -0.1, z: -0.4 } },
        guns: [
            { width: 0.2, height: 0.1, length: 1.2, color: randomColor1, position: { x: 0, y: 0, z: 0 } },
            { width: 0.2, height: 0.1, length: 1.2, color: randomColor1, position: { x: -2, y: 0.2, z: 0 }, rotationZ: Math.PI / 2 },
            { width: 0.2, height: 0.1, length: 1.2, color: randomColor1, position: { x: 2, y: 0.2, z: 0 }, rotationZ: Math.PI / 2 }
        ],
        wing: { width: 7, height: 0.1, length: 1.2, color: randomColor2, position: { x: 0, y: 0.3, z: 0 } },
        tailWing: { width: 2.2, height: 0.1, length: 0.8, position: { x: 0, y: 0.2, z: 1.8 } },
        stabilizer: { width: 0.1, height: 0.8, length: 1.2, position: { x: 0, y: 0.5, z: 1.8 } },
        windows: { width: 0.9, height: 1.2, length: 0.5, color: randomColor2, opacity: 0.5, position: { x: 0, y: 0.5, z: -0.6 } },
        wheels: [
            { x: -1, y: -0.2, z: 0 },
            { x: 1, y: -0.2, z: 0 },
            { x: 0, y: -0.2, z: -1.5 }
        ],
        scale: { x: 5, y: 5, z: 5 }
    },
    planeTwo: {
        body: { width: 0.6, height: 0.6, length: 3, color: randomColor2 },
        nose: { width: 0.7, height: 0.7, length: 0.3, position: { x: 0, y: -0.1, z: -0.4 } },
        guns: [
            { width: 0.3, height: 0.3, length: 1.2, color: randomColor2, position: { x: 0, y: 0, z: 0 } },
            { width: 0.3, height: 0.3, length: 1.2, color: randomColor2, position: { x: -2.5, y: 0.2, z: 0 }, rotationZ: Math.PI / 2 },
            { width: 0.3, height: 0.3, length: 1.2, color: randomColor2, position: { x: 2.5, y: 0.2, z: 0 }, rotationZ: Math.PI / 2 }
        ],
        wing: { width: 8, height: 0.05, length: 1.2, color: randomColor1, position: { x: 0, y: 0.3, z: 0 } },
        tailWing: { width: 2.2, height: 0.1, length: 0.8, position: { x: 0, y: 0.2, z: 1.8 } },
        stabilizer: { width: 0.1, height: 0.8, length: 1.2, position: { x: 0, y: 0.5, z: 1.8 } },
        windows: { width: 0.9, height: 1.2, length: 0.5, color: randomColor2, opacity: 0.5, position: { x: 0, y: 0.5, z: -0.6 } },
        wheels: [
            { x: -1, y: -0.2, z: 0 },
            { x: 1, y: -0.2, z: 0 },
            { x: 0, y: -0.2, z: -1.5 }
        ],
        scale: { x: 5, y: 5, z: 5 }
    }
};

function createPlane(config) {
    const planeGroup = new THREE.Group();

    // גוף המטוס
    const bodyGeo = new THREE.BoxGeometry(config.body.width, config.body.height, config.body.length);
    const bodyMat = new THREE.MeshPhongMaterial({ color: config.body.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    planeGroup.add(body);

    // חרטום
    const noseGeo = new THREE.BoxGeometry(config.nose.width, config.nose.height, config.nose.length);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(config.nose.position.x, config.nose.position.y, config.nose.position.z);
    planeGroup.add(nose);

    // רובים
    config.guns.forEach(gunConfig => {
        const gunGeo = new THREE.BoxGeometry(gunConfig.width, gunConfig.height, gunConfig.length);
        const gunMat = new THREE.MeshPhongMaterial({ color: gunConfig.color });
        const gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(gunConfig.position.x, gunConfig.position.y, gunConfig.position.z);
        if (gunConfig.rotationZ) gun.rotation.z = gunConfig.rotationZ;
        planeGroup.add(gun);
    });

    // כנפיים
    const wingGeo = new THREE.BoxGeometry(config.wing.width, config.wing.height, config.wing.length);
    const wingMat = new THREE.MeshPhongMaterial({ color: config.wing.color });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(config.wing.position.x, config.wing.position.y, config.wing.position.z);
    planeGroup.add(wings);

    // זנב
    const tailWingGeo = new THREE.BoxGeometry(config.tailWing.width, config.tailWing.height, config.tailWing.length);
    const tailWing = new THREE.Mesh(tailWingGeo, wingMat);
    tailWing.position.set(config.tailWing.position.x, config.tailWing.position.y, config.tailWing.position.z);
    planeGroup.add(tailWing);

    // מייצבים
    const stabilizerGeo = new THREE.BoxGeometry(config.stabilizer.width, config.stabilizer.height, config.stabilizer.length);
    const stabilizer = new THREE.Mesh(stabilizerGeo, wingMat);
    stabilizer.position.set(config.stabilizer.position.x, config.stabilizer.position.y, config.stabilizer.position.z);
    planeGroup.add(stabilizer);

    // חלונות
    const windowGeo = new THREE.BoxGeometry(config.windows.width, config.windows.height, config.windows.length);
    const windowMat = new THREE.MeshPhongMaterial({
        color: config.windows.color,
        transparent: true,
        opacity: config.windows.opacity
    });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.set(config.windows.position.x, config.windows.position.y, config.windows.position.z);
    planeGroup.add(windows);

    // גלגלים
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    config.wheels.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        planeGroup.add(wheel);
    });

    // שינוי גודל המטוס
    planeGroup.scale.set(config.scale.x, config.scale.y, config.scale.z);

    return planeGroup;
}

class Plane {
    constructor(type) {
        this.type = type;
        this.config = planeConfigs[type]; // שימוש ישיר ב-planeConfigs
        this.group = createPlane(this.config);
        this.speed = 0;
        this.maxSpeed = 2.0;
        this.speedIncrement = 0.1;
        this.liftCoefficient = 0.08;
        this.dragCoefficient = 0.004;
        this.minSpeedForLift = 0.5;
        this.gravity = 0.0098;
        this.orientation = new THREE.Quaternion();
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isDoingBarrelRoll = false;
        this.barrelRollStartTime = 0;
        this.barrelRollDuration = 1000;
        this.bullets = [];
        this.lastShotTime = 0;
        this.shootCooldown = 100;
        this.bulletSpeed = 5;
    }

    update(keys) {
        if (this.isDoingBarrelRoll) {
            this.updateBarrelRoll();
        } else {
            if (keys['w'] || keys['W']) this.euler.x -= 0.005;
            if (keys['s'] || keys['S']) this.euler.x += 0.005;
            if (keys['a'] || keys['A']) {
                this.euler.z += 0.005;
                this.euler.y += 0.005;
            }
            if (keys['d'] || keys['D']) {
                this.euler.z -= 0.005;
                this.euler.y -= 0.005;
            }
            if (keys['q'] || keys['Q']) this.euler.y += 0.015;
            if (keys['e'] || keys['E']) this.euler.y -= 0.015;
            this.updateQuaternion();
        }

        if (keys['ArrowUp']) this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncrement);
        if (keys['ArrowDown']) this.speed = Math.max(0, this.speed - this.speedIncrement);
        if (keys['ArrowLeft']) this.euler.z += 0.01;
        if (keys['ArrowRight']) this.euler.z -= 0.01;

        const now = Date.now();
        if ((keys[' '] || keys['Spacebar']) && (!this.lastShotTime || now - this.lastShotTime > this.shootCooldown)) {
            this.shootBullet();
            this.lastShotTime = now;
        }

        const angleOfAttack = this.euler.x;
        const lift = this.speed > this.minSpeedForLift ? this.liftCoefficient * this.speed * Math.sin(angleOfAttack) : 0;
        const drag = this.dragCoefficient * this.speed * this.speed;
        this.speed = Math.max(0, this.speed - drag);

        const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.orientation);
        player.position.add(forwardVector.multiplyScalar(this.speed));
        player.position.y += lift - this.gravity;

        if (player.position.y < 0.5) {
            player.position.y = 0.5;
            this.speed = 0;
        }

        this.updateBullets();
    }

    updateQuaternion() {
        this.orientation.setFromEuler(this.euler);
        player.quaternion.copy(this.orientation);
    }

    startBarrelRoll() {
        if (!this.isDoingBarrelRoll && this.speed > 0.5) {
            this.isDoingBarrelRoll = true;
            this.barrelRollStartTime = Date.now();
            showMessage("סיבוב חבית!");
        }
    }

    updateBarrelRoll() {
        const elapsedTime = Date.now() - this.barrelRollStartTime;
        const progress = Math.min(elapsedTime / this.barrelRollDuration, 1);
        const startQuat = this.orientation.clone();
        const endQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 2);
        
        // Create a temporary quaternion and use slerp
        const tempQuat = startQuat.clone();
        tempQuat.slerp(endQuat, progress);
        
        // Update the player's quaternion
        player.quaternion.copy(tempQuat);
        
        if (progress >= 1) {
            this.isDoingBarrelRoll = false;
            this.orientation.copy(player.quaternion);
        }
    }

    shootBullet() {
        const bulletGeometry = new THREE.SphereGeometry(1, 8, 5);
        const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0xffe400, emissive: 0xff0000 });

        const leftGunPosition = new THREE.Vector3(-12, 1, 1).applyQuaternion(this.orientation).add(player.position);
        const rightGunPosition = new THREE.Vector3(12, 1, 1).applyQuaternion(this.orientation).add(player.position);

        const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.orientation);
        const leftBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        leftBullet.position.copy(leftGunPosition);
        leftBullet.velocity = forwardVector.clone().multiplyScalar(this.bulletSpeed);
        scene.add(leftBullet);
        this.bullets.push(leftBullet);

        const rightBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        rightBullet.position.copy(rightGunPosition);
        rightBullet.velocity = forwardVector.clone().multiplyScalar(this.bulletSpeed);
        scene.add(rightBullet);
        this.bullets.push(rightBullet);
    }

    updateBullets() {
        for (let index = this.bullets.length - 1; index >= 0; index--) {
            const bullet = this.bullets[index];
            bullet.position.add(bullet.velocity);
            if (bullet.position.distanceTo(player.position) > 1200) {
                scene.remove(bullet);
                this.bullets.splice(index, 1);
            }
        }
    }
}

// יצירת המטוס הראשון
let currentPlane = new Plane('planeOne');
player.add(currentPlane.group);

// פונקציה להחלפת מטוס
function switchPlane() {
    player.remove(currentPlane.group);
    currentPlane = new Plane(currentPlane.type === 'planeOne' ? 'planeTwo' : 'planeOne');
    player.add(currentPlane.group);
}

export { Plane, currentPlane, switchPlane };