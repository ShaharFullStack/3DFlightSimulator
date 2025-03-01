import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';

// ====== משתנים גלובליים ======
const randomColor1 = Math.random() * 0xffffff;
const randomColor2 = Math.random() * 0xffffff;

// ====== מערך מוזיקה ופעולות מעבר שיר ======
const musicTracks = [
    'assets/music/Dog Trap.mp3',
    'assets/music/Dogbalism.mp3',
    'assets/music/Dogfight.mp3',
    'assets/music/Hip Dog.mp3',
    'assets/music/Mataldog.mp3',
    'assets/music/Pixledog.mp3',
    'assets/music/Scratch Dog.mp3',
    'assets/music/Slow J-Dog.mp3',
    'assets/music/Trapdog.mp3'
];

let currentMusicIndex = 0;
let backgroundMusic = null;

function playMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic = null;
    }
    backgroundMusic = new Audio(musicTracks[currentMusicIndex]);
    backgroundMusic.volume = 0.5;
    backgroundMusic.play().catch(e => console.log('שגיאה בהפעלת מוזיקה:', e));
    backgroundMusic.onended = () => {
        currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length;
        playMusic();
    };
    if (backgroundMusic) {
        backgroundMusic.play();
        const trackName = musicTracks[currentMusicIndex]
            .replace('assets/music/', '')
            .replace('.mp3', '');
        showMessage(trackName + " :שם הטראק");
    }
}

function nextTrack() {
    currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length;
    playMusic();
}

function previousTrack() {
    currentMusicIndex = (currentMusicIndex - 1 + musicTracks.length) % musicTracks.length;
    playMusic();
}

function stopTrack() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic = null;
    }
}

// ====== יצירת הסצנה, המצלמה והרנדרר ======
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// ====== שחקן (המטוס) ======
const player = new THREE.Object3D();
player.position.set(2, 8, 50);
scene.add(player);

// ====== משתנים לשליטה במטוס ======
let currentSpeed = 0;
const maxSpeed = 3.0;
const speedIncrement = 0.;
const liftCoefficient = 0.08;
const dragCoefficient = 0.004;
const minSpeedForLift = 0.5;
const gravity = 0.011;

// ====== משתנים לירי ======
let lastShotTime = 0;
const shootCooldown = 100; // מילישניות בין יריות

// ====== משתנים לסיבוב אוטומטי (barrel roll) ======
let isDoingBarrelRoll = false;
let barrelRollStartTime = 0;
const barrelRollDuration = 1000; // מילישניות

// ====== משתנים למצלמה ======
const cameraOffsets = {
    'TPS': new THREE.Vector3(0, 30, 45),
    'FPS': new THREE.Vector3(0, 5, 10),
    'TPS Far': new THREE.Vector3(0, 10, 200)
};
let currentCameraView = 'TPS';

// ====== נוסיף קווטרניון וסדר צירים (Euler) לשליטה טובה במטוס ======
let planeOrientation = new THREE.Quaternion();         // הקווטרניון של המטוס
let planeEuler = new THREE.Euler(0, 0, 0, 'YXZ');      // נגדיר סדר צירים YXZ: קודם Yaw, אח"כ Pitch, אח"כ Roll

// פונקציה שתתרגם את ה-Euler לתוך ה-Quaternion ותעדכן את המטוס
function updatePlaneQuaternion() {
    planeOrientation.setFromEuler(planeEuler);
    player.quaternion.copy(planeOrientation);
}

// ====== פונקציה ליצירת מטוס ברירת המחדל ======
function createDefaultPlane() {
    const planeGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: randomColor1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    planeGroup.add(body);

    const noseGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
    const noseMat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5 });
    const nose = new THREE.Mesh(noseGeo, bodyMat, noseMat);
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

// ====== טעינת מודל המטוס ======
const loader = new GLTFLoader();
let currentPlane = createDefaultPlane();
player.add(currentPlane);
let currentPlaneType = 'default';

const planeTypes = ['default', '747', 'F35', 'intergalactic'];
function switchPlane() {
    const currentIndex = planeTypes.indexOf(currentPlaneType);
    const nextIndex = (currentIndex + 1) % planeTypes.length;
    const nextPlaneType = planeTypes[nextIndex];

    if (currentPlane) player.remove(currentPlane);

    if (nextPlaneType === 'default') {
        currentPlane = createDefaultPlane();
        player.add(currentPlane);
    } else {
        let path, scale, position, rotation;
        switch (nextPlaneType) {
            case '747':
                path = 'assets/planes/747/airplane.gltf';
                scale = new THREE.Vector3(120, 120, 120);
                position = new THREE.Vector3(0, 2.9, 20);
                rotation = new THREE.Euler(0, Math.PI, 0);
                break;
            case 'F35':
                path = 'assets/planes/F35/F35.gltf';
                scale = new THREE.Vector3(30, 30, 30);
                position = new THREE.Vector3(0, 0.1, 0);
                rotation = new THREE.Euler(0, Math.PI, 0);
                break;
            case 'intergalactic':
                path = 'assets/intergalactic/intergalactic.gltf';
                scale = new THREE.Vector3(1, 1, 1);
                position = new THREE.Vector3(0, 0.9, 1);
                rotation = new THREE.Euler(0, Math.PI, 0);
                break;
        }
        loader.load(path, (gltf) => {
            currentPlane = gltf.scene;
            currentPlane.scale.copy(scale);
            currentPlane.position.copy(position);
            currentPlane.rotation.copy(rotation);
            player.add(currentPlane);
        });
    }
    currentPlaneType = nextPlaneType;
}

// ====== האזנה למקשים ======
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'p' || e.key === 'P') switchPlane();
    if (e.key === 'c' || e.key === 'C') switchCamera();
    if (e.key === 'r' || e.key === 'R') startBarrelRoll();

    // מעבר בין שירים
    if (e.key === ']') nextTrack();
    if (e.key === '[') previousTrack();
    if (e.key === ';') stopTrack();
});
window.addEventListener('keyup', (e) => (keys[e.key] = false));

// ====== תאורה ======
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 200, 100);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// ====== ערפל ======
const fog = new THREE.FogExp2(0x87CEEB, 0.0005);
scene.fog = fog;

// ====== קרקע עם גאומטריית גבעות ======
const terrainGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
const vertices = terrainGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    if (Math.abs(x) < 50) {
        vertices[i + 1] = 0;
    } else {
        vertices[i + 1] = (Math.sin(x / 100) + Math.sin(z / 100)) * 50;
    }
}
terrainGeometry.computeVertexNormals();
const terrainMaterial = new THREE.MeshPhongMaterial({ color: 0x01af10 });
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

// ====== טקסטורת קרקע ======
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(500, 500);
groundTexture.anisotropy = 16;

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshLambertMaterial({ map: groundTexture, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ====== פונקציה ליצירת מסלול מורחב ======
function createRunway() {
    // ניצור Group אחד שיכיל את כל אלמנטי המסלול
    const runwayGroup = new THREE.Group();

    // גוף עיקרי של המסלול
    const runwayMainGeometry = new THREE.BoxGeometry(12, 0.02, 1200);
    const runwayMainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const runwayMain = new THREE.Mesh(runwayMainGeometry, runwayMainMaterial);
    runwayMain.receiveShadow = true;
    // מרכז המסלול ב-Z=0, רוחב 12, אורך 1200
    runwayMain.position.set(0, 1, 0);
    runwayGroup.add(runwayMain);

    // הוספת פסים (שבילים לבנים) לאורך המסלול
    const stripeCount = 12;    // כמות הפסים
    const stripeWidth = 0.8;   // רוחב כל פס
    const stripeLength = 12;   // אורך כל פס
    const gapBetweenStripes = 70; // המרחק על הציר Z בין פס לפס

    const stripeGeometry = new THREE.PlaneGeometry(stripeWidth, stripeLength);
    const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });

    // נגדיר התחלה ונעבור לאורך הציר Z
    const firstStripeZ = -(stripeCount - 1) * gapBetweenStripes * 0.5;

    for (let i = 0; i < stripeCount; i++) {
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        // נציב את הפס במרכז הציר X
        stripe.position.set(0, 1.01, firstStripeZ + i * gapBetweenStripes);
        runwayGroup.add(stripe);
    }

    // אפשר להוסיף "אורות" קטנים בצידי המסלול לדוגמה:
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const coneMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0x444400 });
    // כדי למקם בקצוות הזד, נעשה כך:
    const xOffsets = [-5.5, 5.5]; // קצוות רוחב המסלול

    xOffsets.forEach(xPos => {
        const cone1 = new THREE.Mesh(coneGeometry, coneMaterial);
        cone1.position.set(xPos, 1, -550);
        cone1.rotation.x = -Math.PI / 2;
        runwayGroup.add(cone1);

        const cone2 = new THREE.Mesh(coneGeometry, coneMaterial);
        cone2.position.set(xPos, 1, 550);
        cone2.rotation.x = -Math.PI / 2;
        runwayGroup.add(cone2);
    });

    return runwayGroup;
}

// ניצור את המסלול ונוסיף לסצנה
const runwayGroup = createRunway();
scene.add(runwayGroup);

// ====== פונקציה עזר לבדיקת אם נקודה בתוך אזור המסלול ======
function isInRunwayZone(x, z) {
    // נגדיר את תחום המסלול לפי createRunway:
    // רוחב מ- -6 עד 6 (קצת מרווח מה-12)
    // אורך מ- -600 עד 600
    const runwayMinX = -6;
    const runwayMaxX = 6;
    const runwayMinZ = -600;
    const runwayMaxZ = 600;

    return (x >= runwayMinX && x <= runwayMaxX &&
        z >= runwayMinZ && z <= runwayMaxZ);
}

// ====== אזורי מגורים (בתים) ======
for (let i = 0; i < 2000; i++) {
    let x, y, z;
    do {
        x = (Math.random() - 0.5) * 9000;
        y = (Math.random() - 0.5) * 9000;
        z = (Math.random() - 0.5) * 9000;
    } while (isInRunwayZone(x, y, z)); // כל עוד נופל במסלול, נגריל מחדש

    const size = 50 + Math.random() * 100;
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const houseGeometry = new THREE.BoxGeometry(size, size, size);
    const houseMaterial = new THREE.MeshPhongMaterial({ color });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, size / 2, z);
    scene.add(house);
}

// ====== עננים ======
function createClouds() {
    const cloudGeometry = new THREE.SphereGeometry(20, 8, 8);
    const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 500; i++) {
        const cloud = new THREE.Group();
        const numBlobs = 6 + Math.floor(Math.random() * 5);
        for (let j = 0; j < numBlobs; j++) {
            const blob = new THREE.Mesh(cloudGeometry, cloudMaterial);
            blob.position.set(Math.random() * 30 - 10, Math.random() * 20, Math.random() * 25 - 10);
            blob.scale.set(0.8 + Math.random() * 0.9, 0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.4);
            cloud.add(blob);
        }
        cloud.position.set((Math.random() - 0.5) * 5000, 600 + Math.random() * 200, (Math.random() - 0.5) * 5000);
        scene.add(cloud);
    }
}
createClouds();

// ====== בלונים ======
const balloons = [];
function createBalloon() {
    const balloonGeometry = new THREE.SphereGeometry(6, 16, 16);
    const balloonMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.castShadow = true;
    balloon.position.set(
        (Math.random() - 0.5) * 2500,
        10 + Math.random() * 1500,
        (Math.random() - 0.5) * 1000
    );
    scene.add(balloon);
    balloons.push(balloon);
}
for (let i = 0; i < 50; i++) createBalloon();

// ====== ירי ======
const bullets = [];
function shootBullet() {
    const bulletGeometry = new THREE.SphereGeometry(1, 8, 5);
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: randomColor1, emissive: randomColor2 });

    // מיקום הרובים בשני צידי המטוס
    const leftGunPosition = new THREE.Vector3(-10, 1, 1)
        .applyQuaternion(player.quaternion)
        .add(player.position);
    const rightGunPosition = new THREE.Vector3(10, 1, 1)
        .applyQuaternion(player.quaternion)
        .add(player.position);

    // כדור שמאלי
    const leftBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    leftBullet.position.copy(leftGunPosition);
    leftBullet.velocity = new THREE.Vector3(0.04, 0, -2)
        .applyQuaternion(player.quaternion);
    scene.add(leftBullet);
    bullets.push(leftBullet);

    // כדור ימני
    const rightBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    rightBullet.position.copy(rightGunPosition);
    rightBullet.velocity = new THREE.Vector3(-0.04, 0, -2)
        .applyQuaternion(player.quaternion);
    scene.add(rightBullet);
    bullets.push(rightBullet);

    // אפקט הבזק ירי
    createMuzzleFlash(leftGunPosition);
    createMuzzleFlash(rightGunPosition);
}

function createMuzzleFlash(position) {
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);

    // אנימציית הבזק
    let frame = 0;
    const animateFlash = () => {
        frame++;
        flash.scale.multiplyScalar(0.9);
        flash.material.opacity -= 0.2;

        if (frame < 10 && flash.material.opacity > 0) {
            requestAnimationFrame(animateFlash);
        } else {
            scene.remove(flash);
        }
    };
    animateFlash();
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.velocity);
        if (bullet.position.distanceTo(player.position) > 1200) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

// ====== ניקוד ורמת קושי ======
let score = 0;
let difficultyLevel = 1;

function checkCollisions() {
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];

        for (let balloonIndex = balloons.length - 1; balloonIndex >= 0; balloonIndex--) {
            const balloon = balloons[balloonIndex];
            const distance = bullet.position.distanceTo(balloon.position);

            if (distance < 15) {
                createEnhancedExplosion(balloon.position);
                scene.remove(balloon);
                balloons.splice(balloonIndex, 1);
                scene.remove(bullet);
                bullets.splice(bulletIndex, 1);
                score += 10;
                updateDifficulty();

                // יצירת בלון חדש
                setTimeout(createBalloon, 2000);
                break;
            }
        }
    }
}

function updateDifficulty() {
    if (score >= 100 && difficultyLevel < 2) {
        difficultyLevel = 2;
        showMessage("רמת קושי עלתה ל-2!");
    } else if (score >= 200 && difficultyLevel < 3) {
        difficultyLevel = 3;
        showMessage("רמת קושי עלתה ל-3!");
    }
}

// ====== אפקט פיצוץ ======
function createEnhancedExplosion(position) {
    // 1. גל הדף - טבעת מתרחבת
    const ringGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(camera.position);
    scene.add(ring);

    const expandRing = () => {
        if (ring.scale.x < 20) {
            ring.scale.x += 0.5;
            ring.scale.y += 0.5;
            ring.material.opacity -= 0.02;
            requestAnimationFrame(expandRing);
        } else {
            scene.remove(ring);
        }
    };
    expandRing();

    // 2. חלקיקים צבעוניים
    const particleCount = 50;
    let particleColors = [Math.random() * 0xffffff, Math.random() * 0xffffff, Math.random() * 0xffffff];
    const colors = particleColors.map(color => new THREE.Color(color));

    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        particle.position.copy(position);
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 0.7
        );

        scene.add(particle);

        let frame = 0;
        const animateParticle = () => {
            frame++;
            particle.position.add(velocity);
            particle.material.opacity -= 0.2;
            particle.scale.multiplyScalar(0.98);

            if (frame < 60 && particle.material.opacity > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        };
        animateParticle();
    }

    // 3. הבהוב אור
    const flashLight = new THREE.PointLight(0xffff00, 5, 50);
    flashLight.position.copy(position);
    scene.add(flashLight);

    let intensity = 5;
    const animateFlash = () => {
        intensity -= 0.2;
        flashLight.intensity = intensity;

        if (intensity > 0) {
            requestAnimationFrame(animateFlash);
        } else {
            scene.remove(flashLight);
        }
    };
    animateFlash();
}

// ====== פונקציה להצגת הודעות ======
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.position = 'absolute';
    messageDiv.style.top = '20%';
    messageDiv.style.left = '10%';
    messageDiv.style.transform = 'translate(-20%, -10%)';
    messageDiv.style.backgroundColor = ({ color: 'white', fontSize: '24px', padding: '10px', borderRadius: '5px', transparent: true, opacity: 0.8 })
    messageDiv.style.padding = '30px';
    messageDiv.style.fontSize = '34px';
    messageDiv.innerText = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => document.body.removeChild(messageDiv), 2000);
}

// ====== פונקציה להחלפת מצלמה ======
function switchCamera() {
    const views = Object.keys(cameraOffsets);
    const currentIndex = views.indexOf(currentCameraView);
    const nextIndex = (currentIndex + 1) % views.length;
    currentCameraView = views[nextIndex];
    showMessage(`מצלמה: ${currentCameraView}`);
}

// ====== פונקציה להתחלת סיבוב חבית (barrel roll) ======
function startBarrelRoll() {
    if (!isDoingBarrelRoll && currentSpeed > 0.5) {
        isDoingBarrelRoll = true;
        barrelRollStartTime = Date.now();
        showMessage("סיבוב חבית!");
    }
}

// ====== פונקציית עדכון סיבוב החבית לפי קווטרניון ======
function updateBarrelRoll() {
    const elapsedTime = Date.now() - barrelRollStartTime;
    const progress = Math.min(elapsedTime / barrelRollDuration, 1);

    // ציר ה-Roll המקומי (Z)
    const rollAxisLocal = new THREE.Vector3(0, 0, 1);
    const rollAxisWorld = rollAxisLocal.clone().applyQuaternion(planeOrientation).normalize();

    // שמירת התחלת ה-Roll אם עוד לא שמרנו
    if (!window.planeOrientationStartRoll) {
        window.planeOrientationStartRoll = planeOrientation.clone();
    }

    // חישוב זווית הגלגול (360 מעלות כש-progress==1)
    const angle = progress * Math.PI * 2;

    // קווטרניון המייצג את הגלגול
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(rollAxisWorld, angle);

    // הכפלת הקווטרניון ההתחלתי בגלגול
    const newOrientation = window.planeOrientationStartRoll.clone().multiply(rollQuat);

    player.quaternion.copy(newOrientation);

    if (progress >= 1) {
        isDoingBarrelRoll = false;
        planeOrientation.copy(newOrientation);
        window.planeOrientationStartRoll = null;
    }
}

// ====== יצירת ממשק משתמש (HUD) ======
let hudCreated = false;
let altitudeElement, scoreElement, difficultyElement;

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

    altitudeElement.innerText = `גובה: ${player.position.y.toFixed(2)} מ'`;
    scoreElement.innerText = `ניקוד: ${score}`;
    difficultyElement.innerText = `רמת קושי: ${difficultyLevel}`;
}

// ====== לולאת אנימציה ======
function animate() {
    requestAnimationFrame(animate);

    if (isDoingBarrelRoll) {
        updateBarrelRoll();
    } else {
        const rotationSpeed = 0.005;
        // Pitch: למעלה/למטה
        if (keys['w'] || keys['W']) planeEuler.x -= rotationSpeed;
        if (keys['s'] || keys['S']) planeEuler.x += rotationSpeed;

        // Roll: שמאלה/ימינה
        if (keys['a'] || keys['A']) {
            planeEuler.z += rotationSpeed;
            planeEuler.y += rotationSpeed;
        }
        if (keys['d'] || keys['D']) {
            planeEuler.z -= rotationSpeed;
            planeEuler.y -= rotationSpeed;
        }

        // Yaw: Q/E
        if (keys['q'] || keys['Q']) planeEuler.y += rotationSpeed + 0.01;
        if (keys['e'] || keys['E']) planeEuler.y -= rotationSpeed + 0.01;
        if (keys['r'] || keys['R']) startBarrelRoll();

        if (keys['ArrowLeft']) planeEuler.z += rotationSpeed + 0.001;
        if (keys['ArrowRight']) planeEuler.z -= rotationSpeed + 0.001;

        // מעדכן את הקווטרניון
        updatePlaneQuaternion();
    }

    // האצה/האטה
    if (keys['ArrowUp']) currentSpeed = Math.min(maxSpeed, currentSpeed + speedIncrement);
    if (keys['ArrowDown']) currentSpeed = Math.max(0, currentSpeed - speedIncrement);

    // הגבלת קצב הירי
    const now = Date.now();
    if ((keys[' '] || keys['Spacebar']) && (!lastShotTime || now - lastShotTime > shootCooldown)) {
        shootBullet();
        lastShotTime = now;
    }

    // חישוב עילוי
    const angleOfAttack = planeEuler.x;
    const lift = currentSpeed > minSpeedForLift
        ? liftCoefficient * currentSpeed * Math.sin(angleOfAttack)
        : 0;

    // דראג
    const drag = dragCoefficient * currentSpeed * currentSpeed;
    currentSpeed = Math.max(0, currentSpeed - drag);

    // וקטור תנועה קדימה
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(forwardVector.multiplyScalar(currentSpeed));

    // עלייה/ירידה (עילוי מול כבידה)
    const verticalSpeed = lift - gravity;
    player.position.y += verticalSpeed;

    // מניעת חדירה מתחת לקרקע
    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        currentSpeed = 0;
    }

    // עדכון כדורים והתנגשויות
    updateBullets();
    checkCollisions();

    // תנועת בלונים אם רמת קושי > 1
    if (difficultyLevel > 1) {
        balloons.forEach(balloon => {
            balloon.position.x += Math.sin(Date.now() / 1500) * 0.2 * difficultyLevel;
            balloon.position.z += Math.cos(Date.now() / 1500) * 0.2 * difficultyLevel;
        });
    }

    // עדכון מצלמה
    const offset = cameraOffsets[currentCameraView].clone().applyQuaternion(player.quaternion);
    camera.position.copy(player.position).add(offset);

    if (currentCameraView === 'FPS') {
        // FPS - מבט קדימה
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        camera.lookAt(player.position.clone().add(lookDir));
    } else {
        camera.lookAt(player.position);
    }

    camera.updateProjectionMatrix();

    // עדכון HUD
    updateHUD();

    renderer.render(scene, camera);
}

// ====== הפעלת המשחק ======
animate();

// ====== הפעלת המוזיקה באופן התחלתי (ייתכן ויידרש אינטראקציה) ======
try {
    playMusic();
} catch (e) {
    console.log('שגיאה בהפעלת מוזיקת רקע:', e);
}

// ====== התאמה לגודל חלון ======
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
