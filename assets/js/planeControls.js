// assets\js\planeControls.js

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { scene, player } from './sceneSetup.js';
import { showMessage } from './main.js';

const randomColor1 = Math.random() * 0xffffff;
const randomColor2 = Math.random() * 0xffffff;

let currentSpeed = 0;
const maxSpeed = 2.0;
const speedIncrement = 0.1;
const liftCoefficient = 0.08;
const dragCoefficient = 0.004;
const minSpeedForLift = 0.5;
const gravity = 0.0098;

let lastShotTime = 0;
const shootCooldown = 100;
const bulletSpeed = 5;

let isDoingBarrelRoll = false;
let barrelRollStartTime = 0;
const barrelRollDuration = 1000;

let planeOrientation = new THREE.Quaternion();
let planeEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let currentPlaneType = 'planeOne';
let currentPlane = createPlaneOne();
player.add(currentPlane);

const bullets = [];

function createPlaneOne() {
    const planeGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: randomColor1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    planeGroup.add(body);

    const noseGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.z = -0.4;
    nose.position.y = -0.1;
    planeGroup.add(nose);

    const gunGeo = new THREE.BoxGeometry(0.2, 0.1, 1.2);
    const gunMat = new THREE.MeshPhongMaterial({ color: randomColor1 });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    planeGroup.add(gun);

    const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.2);
    const wingMat = new THREE.MeshPhongMaterial({ color: randomColor2 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = 0.3;
    planeGroup.add(wings);

    const leftGun = new THREE.Mesh(gunGeo, gunMat);
    leftGun.rotation.z = Math.PI / 2;
    leftGun.position.set(-2, 0.2, 0);
    planeGroup.add(leftGun);

    const rightGun = new THREE.Mesh(gunGeo, gunMat);
    rightGun.rotation.z = Math.PI / 2;
    rightGun.position.set(2, 0.2, 0);
    planeGroup.add(rightGun);

    const tailWingGeo = new THREE.BoxGeometry(2.2, 0.1, 0.8);
    const tailWing = new THREE.Mesh(tailWingGeo, wingMat);
    tailWing.position.z = 1.8;
    tailWing.position.y = 0.2;
    planeGroup.add(tailWing);

    const stabilizerGeo = new THREE.BoxGeometry(0.1, 0.8, 1.2);
    const stabilizer = new THREE.Mesh(stabilizerGeo, wingMat);
    stabilizer.position.z = 1.8;
    stabilizer.position.y = 0.5;
    planeGroup.add(stabilizer);

    const windowGeo = new THREE.BoxGeometry(0.9, 1.2, 0.5);
    const windowMat = new THREE.MeshPhongMaterial({
        color: randomColor2,
        transparent: true,
        opacity: 0.5
    });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.z = -0.6;
    windows.position.y = 0.5;
    planeGroup.add(windows);

    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-1, -0.2, 0);
    planeGroup.add(leftWheel);

    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(1, -0.2, 0);
    planeGroup.add(rightWheel);

    const noseWheel = new THREE.Mesh(wheelGeo, wheelMat);
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(0, -0.2, -1.5);
    planeGroup.add(noseWheel);

    planeGroup.scale.set(5, 5, 5);
    return planeGroup;
}

// ====== פונקציה ליצירת מטוס בסיסי 2 ======
function createPlaneTwo() {
    const planeGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.6, 3);
    const bodyMat = new THREE.MeshPhongMaterial({ color: randomColor2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    planeGroup.add(body);

    const noseGeo = new THREE.BoxGeometry(0.7, 0.7, 0.3);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.z = -0.4;
    nose.position.y = -0.1;
    planeGroup.add(nose);

    const gunGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    const gunMat = new THREE.MeshPhongMaterial({ color: randomColor2 });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    planeGroup.add(gun);

    const wingGeo = new THREE.BoxGeometry(8, 0.05, 1.2);
    const wingMat = new THREE.MeshPhongMaterial({ color: randomColor1 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = 0.3;
    planeGroup.add(wings);

    const leftGun = new THREE.Mesh(gunGeo, gunMat);
    leftGun.rotation.z = Math.PI / 2;
    leftGun.position.set(-2.5, 0.2, 0);
    planeGroup.add(leftGun);

    const rightGun = new THREE.Mesh(gunGeo, gunMat);
    rightGun.rotation.z = Math.PI / 2;
    rightGun.position.set(2.5, 0.2, 0);
    planeGroup.add(rightGun);

    const tailWingGeo = new THREE.BoxGeometry(2.2, 0.1, 0.8);
    const tailWing = new THREE.Mesh(tailWingGeo, wingMat);
    tailWing.position.z = 1.8;
    tailWing.position.y = 0.2;
    planeGroup.add(tailWing);

    const stabilizerGeo = new THREE.BoxGeometry(0.1, 0.8, 1.2);
    const stabilizer = new THREE.Mesh(stabilizerGeo, wingMat);
    stabilizer.position.z = 1.8;
    stabilizer.position.y = 0.5;
    planeGroup.add(stabilizer);

    const windowGeo = new THREE.BoxGeometry(0.9, 1.2, 0.5);
    const windowMat = new THREE.MeshPhongMaterial({
        color: randomColor2,
        transparent: true,
        opacity: 0.5
    });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.z = -0.6;
    windows.position.y = 0.5;
    planeGroup.add(windows);

    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-1, -0.2, 0);
    planeGroup.add(leftWheel);

    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(1, -0.2, 0);
    planeGroup.add(rightWheel);

    const noseWheel = new THREE.Mesh(wheelGeo, wheelMat);
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(0, -0.2, -1.5);
    planeGroup.add(noseWheel);

    planeGroup.scale.set(5, 5, 5);
    return planeGroup;
}

function switchPlane() {
    if (currentPlane) player.remove(currentPlane);
    if (currentPlaneType === 'planeOne') {
        currentPlane = createPlaneTwo();
        currentPlaneType = 'planeTwo';
    } else {
        currentPlane = createPlaneOne();
        currentPlaneType = 'planeOne';
    }
    player.add(currentPlane);
}

function updatePlaneQuaternion() {
    planeOrientation.setFromEuler(planeEuler);
    player.quaternion.copy(planeOrientation);
}

function startBarrelRoll() {
    if (!isDoingBarrelRoll && currentSpeed > 0.5) {
        isDoingBarrelRoll = true;
        barrelRollStartTime = Date.now();
        showMessage("סיבוב חבית!");
    }
}

function updateBarrelRoll() {
    const elapsedTime = Date.now() - barrelRollStartTime;
    const progress = Math.min(elapsedTime / barrelRollDuration, 1);
    const rollAxisLocal = new THREE.Vector3(0, 0, 1);
    const rollAxisWorld = rollAxisLocal.clone().applyQuaternion(planeOrientation).normalize();

    if (!window.planeOrientationStartRoll) {
        window.planeOrientationStartRoll = planeOrientation.clone();
    }

    const angle = progress * Math.PI * 2;
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(rollAxisWorld, angle);
    const newOrientation = window.planeOrientationStartRoll.clone().multiply(rollQuat);
    player.quaternion.copy(newOrientation);

    if (progress >= 1) {
        isDoingBarrelRoll = false;
        planeOrientation.copy(newOrientation);
        window.planeOrientationStartRoll = null;
    }
}

function shootBullet() {
    const bulletGeometry = new THREE.SphereGeometry(1, 8, 5);
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0xffe400, emissive: 0xff0000 });

    const leftGunPosition = new THREE.Vector3(-12, 1, 1).applyQuaternion(player.quaternion).add(player.position);
    const rightGunPosition = new THREE.Vector3(12, 1, 1).applyQuaternion(player.quaternion).add(player.position);

    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    const leftBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    leftBullet.position.copy(leftGunPosition);
    leftBullet.velocity = forwardVector.clone().multiplyScalar(bulletSpeed);
    scene.add(leftBullet);
    bullets.push(leftBullet);

    const rightBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    rightBullet.position.copy(rightGunPosition);
    rightBullet.velocity = forwardVector.clone().multiplyScalar(bulletSpeed);
    scene.add(rightBullet);
    bullets.push(rightBullet);
}

function updateBullets() {
    for (let index = bullets.length - 1; index >= 0; index--) {
        const bullet = bullets[index];
        bullet.position.add(bullet.velocity);
        if (bullet.position.distanceTo(player.position) > 1200) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    }
}

function updatePlaneControls(keys) {
    if (isDoingBarrelRoll) {
        updateBarrelRoll();
    } else {
        if (keys['w'] || keys['W']) planeEuler.x -= 0.005;
        if (keys['s'] || keys['S']) planeEuler.x += 0.005;
        if (keys['a'] || keys['A']) {
            planeEuler.z += 0.005;
            planeEuler.y += 0.005;
        }
        if (keys['d'] || keys['D']) {
            planeEuler.z -= 0.005;
            planeEuler.y -= 0.005;
        }
        if (keys['q'] || keys['Q']) planeEuler.y += 0.015;
        if (keys['e'] || keys['E']) planeEuler.y -= 0.015;
        updatePlaneQuaternion();
    }

    if (keys['ArrowUp']) currentSpeed = Math.min(maxSpeed, currentSpeed + speedIncrement);
    if (keys['ArrowDown']) currentSpeed = Math.max(0, currentSpeed - speedIncrement);
    if (keys['ArrowLeft']) planeEuler.z += 0.01;
    if (keys['ArrowRight']) planeEuler.z -= 0.01;

    const now = Date.now();
    if ((keys[' '] || keys['Spacebar']) && (!lastShotTime || now - lastShotTime > shootCooldown)) {
        shootBullet();
        lastShotTime = now;
    }

    const angleOfAttack = planeEuler.x;
    const lift = currentSpeed > minSpeedForLift ? liftCoefficient * currentSpeed * Math.sin(angleOfAttack) : 0;
    const drag = dragCoefficient * currentSpeed * currentSpeed;
    currentSpeed = Math.max(0, currentSpeed - drag);

    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(forwardVector.multiplyScalar(currentSpeed));
    player.position.y += lift - gravity;

    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        currentSpeed = 0;
    }

    updateBullets();
}

export { updatePlaneControls, switchPlane, startBarrelRoll, bullets };