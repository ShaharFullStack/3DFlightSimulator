import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { setupScene, scene, camera, renderer, player } from './sceneSetup.js';
import { Plane, currentPlane, switchPlane } from './planeControls.js';
import { createEnvironment, updateEnvironment, balloons, checkCollisions, score, difficultyLevel } from './environment.js';
import { playMusic, nextTrack, previousTrack, stopTrack } from './audio.js';

const cameraOffsets = {
    'TPS': new THREE.Vector3(0, 30, 45),
    'FPS': new THREE.Vector3(0, 5, 10),
    'TPS Far': new THREE.Vector3(0, 10, 200)
};
let currentCameraView = 'TPS';

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P') switchPlane();
    if (e.key === 'c' || e.key === 'C') switchCamera();
    if (e.key === 'r' || e.key === 'R') currentPlane.startBarrelRoll();
    if (e.key === ']') nextTrack();
    if (e.key === '[') previousTrack();
    if (e.key === ';') stopTrack();
});
window.addEventListener('keyup', (e) => keys[e.key] = false);

function switchCamera() {
    const views = Object.keys(cameraOffsets);
    const currentIndex = views.indexOf(currentCameraView);
    const nextIndex = (currentIndex + 1) % views.length;
    currentCameraView = views[nextIndex];
    showMessage(`מצלמה: ${currentCameraView}`);
}

function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.position = 'absolute';
    messageDiv.style.top = '20%';
    messageDiv.style.left = '10%';
    messageDiv.style.backgroundColor = 'white';
    messageDiv.style.padding = '30px';
    messageDiv.style.fontSize = '34px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.opacity = '0.8';
    messageDiv.innerText = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => document.body.removeChild(messageDiv), 2000);
}

let hudCreated = false;
let altitudeElement, scoreElement, difficultyElement;
let lastAltitude = null;
let lastScore = null;
let lastDifficulty = null;

function createHUD() {
    altitudeElement = document.createElement('div');
    altitudeElement.id = 'altitude';
    altitudeElement.style.position = 'absolute';
    altitudeElement.style.top = '10px';
    altitudeElement.style.left = '10px';
    altitudeElement.style.color = 'white';
    altitudeElement.style.fontFamily = 'Arial, sans-serif';
    altitudeElement.style.fontSize = '18px';
    altitudeElement.style.fontWeight = 'bold';
    altitudeElement.style.textShadow = '1px 1px 2px black';
    document.body.appendChild(altitudeElement);

    scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.style.position = 'absolute';
    scoreElement.style.top = '50px';
    scoreElement.style.left = '10px';
    scoreElement.style.color = 'white';
    scoreElement.style.fontFamily = 'Arial, sans-serif';
    scoreElement.style.fontSize = '18px';
    scoreElement.style.fontWeight = 'bold';
    scoreElement.style.textShadow = '1px 1px 2px black';
    document.body.appendChild(scoreElement);

    difficultyElement = document.createElement('div');
    difficultyElement.id = 'difficulty';
    difficultyElement.style.position = 'absolute';
    difficultyElement.style.top = '90px';
    difficultyElement.style.left = '10px';
    difficultyElement.style.color = 'white';
    difficultyElement.style.fontFamily = 'Arial, sans-serif';
    difficultyElement.style.fontSize = '18px';
    difficultyElement.style.fontWeight = 'bold';
    difficultyElement.style.textShadow = '1px 1px 2px black';
    document.body.appendChild(difficultyElement);

    const controlsInfo = document.createElement('div');
    controlsInfo.style.position = 'absolute';
    controlsInfo.style.bottom = '10px';
    controlsInfo.style.left = '10px';
    controlsInfo.style.color = 'white';
    controlsInfo.style.fontFamily = 'Arial, sans-serif';
    controlsInfo.style.fontSize = '14px';
    controlsInfo.style.textShadow = '1px 1px 2px black';
    controlsInfo.innerHTML = `
            בקרות:<br>
            W/S - הטייה למעלה/למטה (Pitch)<br>
            A/D - גלגול שמאלה/ימינה (Roll)<br>
            Q/E - פנייה שמאלה/ימינה (Yaw)<br>
            חצים למעלה/למטה - האצה/האטה<br>
            חצים שמאלה/ימינה - כיוון עדין של גלגול<br>
            רווח - ירי<br>
            C - החלפת מצלמה<br>
            P - החלפת מטוס<br>
            R - ביצוע סיבוב חבית (Barrel Roll)<br>
            [ / ] - החלפת שיר קודם/הבא
        `;
    document.body.appendChild(controlsInfo);

    hudCreated = true;
}

function updateHUD() {
    if (!hudCreated) createHUD();
    if (player.position.y !== lastAltitude) {
        altitudeElement.innerText = `גובה: ${player.position.y.toFixed(2)} מ'`;
        lastAltitude = player.position.y;
    }
    if (score !== lastScore) {
        scoreElement.innerText = `ניקוד: ${score}`;
        lastScore = score;
    }
    if (difficultyLevel !== lastDifficulty) {
        difficultyElement.innerText = `רמת קושי: ${difficultyLevel}`;
        lastDifficulty = difficultyLevel;
    }
}

function animate() {
    requestAnimationFrame(animate);

    currentPlane.update(keys);
    updateEnvironment();
    checkCollisions(currentPlane.bullets, balloons);
    updateHUD();

    const offset = cameraOffsets[currentCameraView].clone().applyQuaternion(player.quaternion);
    camera.position.copy(player.position).add(offset);

    if (currentCameraView === 'FPS') {
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        camera.lookAt(player.position.clone().add(lookDir));
    } else {
        camera.lookAt(player.position);
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

setupScene();
createEnvironment();
animate();
try {
    playMusic();
} catch (e) {
    console.log('שגיאה בהפעלת מוזיקה:', e);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

export { showMessage };