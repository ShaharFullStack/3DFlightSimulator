import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

// ====== משתנים גלובליים ======
const randomColor1 = Math.random() * 0xffffff;
const randomColor2 = Math.random() * 0xffffff;

// ====== מערך מוזיקה ופעולות מעבר שיר ======
const musicTracks = [
    'assets/music/Dog Trap.mp3',
    'assets/music/Slow J-Dog.mp3',
    'assets/music/Trapdog.mp3',
    'assets/music/Scratch Dog.mp3',
    'assets/music/Dogbalism.mp3',
    'assets/music/Dogfight.mp3',
    'assets/music/Hip Dog.mp3',
    'assets/music/Metaldog.mp3',
    'assets/music/Pixledog.mp3'
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

// ====== משתנים לשליטה במטוס ======
let currentSpeed = 0;
const maxSpeed = 2.0;
const speedIncrement = 0.1;
const liftCoefficient = 0.08;
const dragCoefficient = 0.004;
const minSpeedForLift = 0.5;
const gravity = 0.0098;

// ====== משתנים לירי ======
let lastShotTime = 0;
const shootCooldown = 100; // מילישניות בין יריות
const bulletSpeed = 5; // מהירות הכדור - חייבת להיות גבוהה משל המטוס

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

// ====== יצירת קבוצה בסיסית עבור השחקן (המטוס) ======
const player = new THREE.Object3D();
player.position.set(2, 8, 50);
scene.add(player);

// ====== קווטרניון ואוילר לשליטת המטוס ======
let planeOrientation = new THREE.Quaternion();
let planeEuler = new THREE.Euler(0, 0, 0, 'YXZ'); // סדר הצירים YXZ

function updatePlaneQuaternion() {
    planeOrientation.setFromEuler(planeEuler);
    player.quaternion.copy(planeOrientation);
}

// ====== פונקציה ליצירת מטוס בסיסי 1 ======
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

// ====== יצירת מטוס התחלתי ושמירת הסוג הנוכחי ======
let currentPlaneType = 'planeOne';
let currentPlane = createPlaneOne();
player.add(currentPlane);

// ====== פונקציה להחלפת המטוס (p או P) ======
function switchPlane() {
    if (currentPlane) {
        player.remove(currentPlane);
    }
    if (currentPlaneType === 'planeOne') {
        currentPlane = createPlaneTwo();
        currentPlaneType = 'planeTwo';
    } else {
        currentPlane = createPlaneOne();
        currentPlaneType = 'planeOne';
    }
    player.add(currentPlane);
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

// ====== טקסטורת קרקע (דמויית דשא) ======
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

// ====== פונקציה ליצירת מסלול נחיתה מורחב ======
function createRunway() {
    const runwayGroup = new THREE.Group();

    // גוף עיקרי של המסלול
    const runwayMainGeometry = new THREE.BoxGeometry(12, 0.02, 1200);
    const runwayMainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const runwayMain = new THREE.Mesh(runwayMainGeometry, runwayMainMaterial);
    runwayMain.receiveShadow = true;
    runwayMain.position.set(0, 1, 0);
    runwayGroup.add(runwayMain);

    // פסים לבנים לאורך המסלול
    const stripeCount = 12;
    const stripeWidth = 0.8;
    const stripeLength = 12;
    const gapBetweenStripes = 70;

    const stripeGeometry = new THREE.PlaneGeometry(stripeWidth, stripeLength);
    const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const firstStripeZ = -(stripeCount - 1) * gapBetweenStripes * 0.5;

    for (let i = 0; i < stripeCount; i++) {
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 1.01, firstStripeZ + i * gapBetweenStripes);
        runwayGroup.add(stripe);
    }

    // אורות קטנים בצידי המסלול
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const coneMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0x444400 });
    const xOffsets = [-5.5, 5.5];

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

const runwayGroup = createRunway();
scene.add(runwayGroup);

// ====== אזור המסלול (למניעת בתים) - נרחיב קצת את הטווח כדי שלא יהיו בתים קרובים מדי ======
function isInRunwayZone(x, z) {
    const runwayMinX = -100;
    const runwayMaxX = 100;
    const runwayMinZ = -600;
    const runwayMaxZ = 600;
    return (x >= runwayMinX && x <= runwayMaxX && z >= runwayMinZ && z <= runwayMaxZ);
}

// ====== הגדרת עקומה (Curved Path) עבור הנהר ======
const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4000, 1, -2000),
    new THREE.Vector3(-3000, 1, -1000),
    new THREE.Vector3(-2000, 1, 0),
    new THREE.Vector3(-1000, 1, 1000),
    new THREE.Vector3(0, 1, 2000),
    new THREE.Vector3(1000, 1, 3000),
    new THREE.Vector3(2000, 1, 4000)
]);
const riverRadius = 80; // רוחב "חצי הנהר" (כלומר סה"כ 160)

// פונקציית עזר לבדיקת מרחק מנקודת העקומה, כדי למנוע הנחת בתים בנהר
function isInRiverZone(x, z) {
    const samples = 100;
    let minDist = Infinity;
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const cp = riverCurve.getPoint(t);
        const dist = new THREE.Vector2(x, z).distanceTo(new THREE.Vector2(cp.x, cp.z));
        if (dist < minDist) {
            minDist = dist;
        }
    }
    return minDist < riverRadius * 1.2;
}

// ====== יצירת נהר בצורת רצועה (Ribbon) ======
function createRiver() {
    // נקודות לאורך העקומה
    const points = riverCurve.getPoints(300);
    const positions = [];
    const uvs = [];

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        // וקטור כיוון (tangent)
        const tangent = new THREE.Vector3().subVectors(next, current).normalize();

        // יוצרים וקטור ניצב להפרדה שמאלה/ימינה
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

        // ננקב על 2 צדדי "הרצועה" - שמאל וימין
        const leftCurrent = new THREE.Vector3().copy(current).addScaledVector(side, -riverRadius);
        const rightCurrent = new THREE.Vector3().copy(current).addScaledVector(side, riverRadius);
        const leftNext = new THREE.Vector3().copy(next).addScaledVector(side, -riverRadius);
        const rightNext = new THREE.Vector3().copy(next).addScaledVector(side, riverRadius);

        // משולש ראשון (leftCurrent, rightCurrent, rightNext)
        positions.push(leftCurrent.x, leftCurrent.y, leftCurrent.z);
        positions.push(rightCurrent.x, rightCurrent.y, rightCurrent.z);
        positions.push(rightNext.x, rightNext.y, rightNext.z);

        // משולש שני (leftCurrent, rightNext, leftNext)
        positions.push(leftCurrent.x, leftCurrent.y, leftCurrent.z);
        positions.push(rightNext.x, rightNext.y, rightNext.z);
        positions.push(leftNext.x, leftNext.y, leftNext.z);

        // UV פשוט (ניצול של i כאינדקס לאורך, 0/1 לרוחב)
        const t1 = i / points.length;
        const t2 = (i + 1) / points.length;

        // עבור כל משולש צריך 3 זוגות UV
        // משולש ראשון
        uvs.push(0, t1, 1, t1, 1, t2);
        // משולש שני
        uvs.push(0, t1, 1, t2, 0, t2);
    }

    const riverGeometry = new THREE.BufferGeometry();
    riverGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    riverGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    riverGeometry.computeVertexNormals();

    // טקסטורת הנהר
    const riverTexture = textureLoader.load(
        'https://t3.ftcdn.net/jpg/00/81/38/10/360_F_81381061_bWZNA5A4G6ru9tnG61gTV0U8ub0nHBMi.jpg'
    );
    riverTexture.wrapS = THREE.RepeatWrapping;
    riverTexture.wrapT = THREE.RepeatWrapping;
    // כיוון שהרצועה ארוכה, אפשר להגדיל/להקטין את החזרות:
    riverTexture.repeat.set(1, 5);

    const riverMaterial = new THREE.MeshPhongMaterial({ map: riverTexture });
    const riverMesh = new THREE.Mesh(riverGeometry, riverMaterial);
    riverMesh.receiveShadow = true;

    scene.add(riverMesh);
}

createRiver();

// ====== אזורי מגורים (בתים) ======
const houses = [];
for (let i = 0; i < 2000; i++) {
    let x, z;
    do {
        x = (Math.random() - 0.5) * 9000;
        z = (Math.random() - 0.5) * 9000;
    } while (isInRunwayZone(x, z) || isInRiverZone(x, z));

    const size = 50 + Math.random() * 100;
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const houseGeometry = new THREE.BoxGeometry(size, size, size);
    const houseMaterial = new THREE.MeshPhongMaterial({ color });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, size / 2, z);
    scene.add(house);
    houses.push(house);
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
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0xffe400, emissive: 0xff0000 });

    // מיקום הרובים בשני צידי המטוס
    const leftGunPosition = new THREE.Vector3(-12, 1, 1)
        .applyQuaternion(player.quaternion)
        .add(player.position);
    const rightGunPosition = new THREE.Vector3(12, 1, 1)
        .applyQuaternion(player.quaternion)
        .add(player.position);

    // יצירת כדור שמאלי
    const leftBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    leftBullet.position.copy(leftGunPosition);
    // וקטור קדימה
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    leftBullet.velocity = forwardVector.clone().multiplyScalar(bulletSpeed);
    scene.add(leftBullet);
    bullets.push(leftBullet);

    // יצירת כדור ימני
    const rightBullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    rightBullet.position.copy(rightGunPosition);
    rightBullet.velocity = forwardVector.clone().multiplyScalar(bulletSpeed);
    scene.add(rightBullet);
    bullets.push(rightBullet);

    // אפקט הבזק ירי (Muzzle Flash)
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
    for (let index = bullets.length - 1; index >= 0; index--) {
        const bullet = bullets[index];
        bullet.position.add(bullet.velocity);
        if (bullet.position.distanceTo(player.position) > 1200) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    }
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

// ====== אפקט פיצוץ משודרג ======
function createEnhancedExplosion(position) {
    // טבעת הדף
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

    // חלקיקים צבעוניים
    const particleCount = 50;
    let particleColors = [
        Math.random() * 0xffffff,
        Math.random() * 0xffffff,
        Math.random() * 0xffffff
    ];
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

    // הבהוב אור נקודתי
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
    messageDiv.style.backgroundColor = 'white';
    messageDiv.style.padding = '30px';
    messageDiv.style.fontSize = '34px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.opacity = '0.8';
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

// ====== התחלת סיבוב חבית (barrel roll) ======
function startBarrelRoll() {
    if (!isDoingBarrelRoll && currentSpeed > 0.5) {
        isDoingBarrelRoll = true;
        barrelRollStartTime = Date.now();
        showMessage("סיבוב חבית!");
    }
}

// ====== עדכון סיבוב חבית ======
function updateBarrelRoll() {
    const elapsedTime = Date.now() - barrelRollStartTime;
    const progress = Math.min(elapsedTime / barrelRollDuration, 1);

    // ציר Z המקומי ל-Roll
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

// ====== HUD ======
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
    altitudeElement.innerText = `גובה: ${player.position.y.toFixed(2)} מ'`;
    scoreElement.innerText = `ניקוד: ${score}`;
    difficultyElement.innerText = `רמת קושי: ${difficultyLevel}`;
}

// ====== לולאת אנימציה ======
function animate() {
    requestAnimationFrame(animate);

    // טיפול בסיבוב חבית
    if (isDoingBarrelRoll) {
        updateBarrelRoll();
    } else {
        // Pitch
        if (keys['w'] || keys['W']) planeEuler.x -= 0.005;
        if (keys['s'] || keys['S']) planeEuler.x += 0.005;

        // Roll + Yaw
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

        if (keys['r'] || keys['R']) startBarrelRoll();

        updatePlaneQuaternion();
    }

    // האצה/האטה
    if (keys['ArrowUp']) currentSpeed = Math.min(maxSpeed, currentSpeed + speedIncrement);
    if (keys['ArrowDown']) currentSpeed = Math.max(0, currentSpeed - speedIncrement);
    if (keys['ArrowLeft']) planeEuler.z += 0.01;
    if (keys['ArrowRight']) planeEuler.z -= 0.01;

    // ירי
    const now = Date.now();
    if ((keys[' '] || keys['Spacebar']) && (!lastShotTime || now - lastShotTime > shootCooldown)) {
        shootBullet();
        lastShotTime = now;
    }

    // עילוי
    const angleOfAttack = planeEuler.x;
    const lift = currentSpeed > minSpeedForLift ? liftCoefficient * currentSpeed * Math.sin(angleOfAttack) : 0;

    // דראג
    const drag = dragCoefficient * currentSpeed * currentSpeed;
    currentSpeed = Math.max(0, currentSpeed - drag);

    // תנועה קדימה
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(forwardVector.multiplyScalar(currentSpeed));

    // עלייה/ירידה
    const verticalSpeed = lift - gravity;
    player.position.y += verticalSpeed;

    // מניעת חדירה לקרקע
    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        currentSpeed = 0;
    }

    // עדכון כדורים והתנגשויות
    updateBullets();
    checkCollisions();

    // עדכון תנועת בלונים אם רמת קושי > 1
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
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        camera.lookAt(player.position.clone().add(lookDir));
    } else {
        camera.lookAt(player.position);
    }

    camera.updateProjectionMatrix();
    updateHUD();
    renderer.render(scene, camera);
}

// ====== הפעלת המשחק ======
animate();

// ====== הפעלת מוזיקה בהתחלה (ייתכן ויידרש קליק משתמש) ======
try {
    playMusic();
} catch (e) {
    console.log('שגיאה בהפעלת מוזיקה:', e);
}

// ====== התאמה לגודל חלון ======
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

