// ===== Three.js 초기 설정 =====
let scene, camera, renderer, raycaster, mouse;
let floatingLight, glassContainers = [];
let isDragging = false;
let selectedGlass = null;

const container = document.getElementById('three-container');

// 데이터
const observedLights = {
  window: {
    name: "평온의 빛",
    color: 0xFFD700,
    colorRGB: { r: 255, g: 215, b: 0 },
    observation: "01.28 / 15:47 / -2°C",
    location: "창문 빛",
    quotes: ["편안해요", "오래 보고 싶어요"],
    warning: "⚠️ 이 빛은 당신을 기억합니다"
  },
  street: {
    name: "긴장의 빛",
    color: 0xB0E0E6,
    colorRGB: { r: 176, g: 224, b: 230 },
    observation: "01.29 / 19:22 / -4°C",
    location: "가로등",
    quotes: ["긴장돼요", "빨리 지나가고 싶어요"],
    warning: "⚠️ 이 빛은 당신을 경계합니다"
  },
  snow: {
    name: "기쁨의 빛",
    color: 0xFFFFFF,
    colorRGB: { r: 255, g: 255, b: 255 },
    observation: "01.30 / 13:15 / 맑음",
    location: "눈 반사",
    quotes: ["신기해요", "반짝거려요"],
    warning: "⚠️ 이 빛은 당신을 채웁니다"
  },
  sunset: {
    name: "설렘의 빛",
    color: 0xFF8C00,
    colorRGB: { r: 255, g: 140, b: 0 },
    observation: "01.31 / 17:58 / 일몰",
    location: "해질녘",
    quotes: ["아쉬워요", "아름다워요"],
    warning: "⚠️ 이 빛은 당신을 부릅니다"
  }
};

let userChoices = {
  light: null,
  time: 15,
  movement: null
};

// ===== Scene 초기화 =====
function initThree() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8, 12);
  camera.lookAt(0, 0, 0);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  
  // Raycaster (마우스 감지용)
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // 바닥 (그림자용)
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // 떠있는 빛 생성
  createFloatingLight();
  
  // 유리 컨테이너 4개 생성
  createGlassContainers();
  
  // 이벤트
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  
  // 애니메이션 시작
  animate();
}

// ===== 떠있는 빛 =====
function createFloatingLight() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  
  floatingLight = new THREE.Mesh(geometry, material);
  floatingLight.position.set(0, 3, 0);
  floatingLight.castShadow = true;
  
  // Glow 효과
  const glowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  floatingLight.add(glow);
  
  // PointLight 추가
  const pointLight = new THREE.PointLight(0xffffff, 1, 10);
  floatingLight.add(pointLight);
  
  scene.add(floatingLight);
  floatingLight.userData = { type: 'light', draggable: true };
}

// ===== 유리 컨테이너 4개 =====
function createGlassContainers() {
  const positions = [
    { x: -3, z: 2, type: 'window' },
    { x: 3, z: 2, type: 'street' },
    { x: -3, z: -2, type: 'snow' },
    { x: 3, z: -2, type: 'sunset' }
  ];
  
  positions.forEach(pos => {
    const glass = createGlassContainer(pos.type);
    glass.position.set(pos.x, 0, pos.z);
    scene.add(glass);
    glassContainers.push(glass);
  });
}

function createGlassContainer(type) {
  const group = new THREE.Group();
  
  // 유리 박스
  const geometry = new THREE.BoxGeometry(1.5, 2, 1.5);
  const material = new THREE.MeshPhysicalMaterial({
    color: observedLights[type].color,
    transparent: true,
    opacity: 0.2,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });
  
  const box = new THREE.Mesh(geometry, material);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  
  // 테두리
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: observedLights[type].color,
    opacity: 0.6,
    transparent: true
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  group.add(wireframe);
  
  group.userData = { type: 'glass', lightType: type };
  
  return group;
}

// ===== 마우스 이벤트 =====
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.parent && object.parent.userData.draggable) {
      isDragging = true;
      selectedGlass = null;
    }
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  if (isDragging && floatingLight) {
    // 빛을 마우스 위치로 이동
    raycaster.setFromCamera(mouse, camera);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersectPoint);
    
    floatingLight.position.x = intersectPoint.x;
    floatingLight.position.y = Math.max(intersectPoint.y, 1);
  }
}

function onMouseUp(event) {
  if (isDragging) {
    isDragging = false;
    
    // 빛이 어느 유리통 위에 있는지 확인
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(glassContainers, true);
    
    if (intersects.length > 0) {
      const glassGroup = intersects[0].object.parent;
      if (glassGroup.userData.type === 'glass') {
        absorbLight(glassGroup);
      } else {
        triggerAbnormalPopup();
      }
    } else {
      triggerAbnormalPopup();
    }
  }
}

// ===== 빛 흡수 애니메이션 =====
function absorbLight(glassGroup) {
  const lightType = glassGroup.userData.lightType;
  userChoices.light = lightType;
  
  // 빛이 유리통으로 이동
  const targetPos = glassGroup.position.clone();
  targetPos.y = 0.5;
  
  animateLightToGlass(floatingLight.position, targetPos, () => {
    // 흡수 완료
    scene.remove(floatingLight);
    
    // 유리통 안에 빛 생성
    const innerLight = createInnerLight(observedLights[lightType].color);
    glassGroup.add(innerLight);
    
    showRuleOverlay(`Color Selected:<br>${observedLights[lightType].name}`, 2000);
    
    setTimeout(() => {
      showScreen('stage2');
      setupStage2();
    }, 2500);
  });
}

function animateLightToGlass(from, to, onComplete) {
  const duration = 1000; // 1초
  const startTime = Date.now();
  
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    floatingLight.position.lerpVectors(from, to, progress);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      onComplete();
    }
  }
  
  update();
}

function createInnerLight(color) {
  const geometry = new THREE.SphereGeometry(0.3, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8
  });
  
  const light = new THREE.Mesh(geometry, material);
  
  // PointLight
  const pointLight = new THREE.PointLight(color, 0.5, 5);
  light.add(pointLight);
  
  return light;
}

// ===== 애니메이션 루프 =====
function animate() {
  requestAnimationFrame(animate);
  
  // 빛 떠다니기
  if (floatingLight && !isDragging && scene.children.includes(floatingLight)) {
    floatingLight.position.y = 3 + Math.sin(Date.now() * 0.001) * 0.3;
    floatingLight.rotation.y += 0.01;
  }
  
  renderer.render(scene, camera);
}

// ===== 윈도우 리사이즈 =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== UI 함수들 =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showRuleOverlay(message, duration = 2000) {
  const overlay = document.getElementById('ruleOverlay');
  const text = document.getElementById('ruleText');
  text.innerHTML = message;
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
  }, duration);
}

function closeOpening() {
  showScreen('stage1');
  initThree(); // Three.js 시작
}

function triggerAbnormalPopup() {
  const popup = document.getElementById('abnormalPopup');
  popup.classList.add('show');
}

function checkKeyword() {
  const input = document.getElementById('keywordInput');
  const value = input.value.trim().toLowerCase();
  const popup = document.getElementById('abnormalPopup');
  
  const validKeywords = ['light', 'glass', 'color', 'time'];
  
  if (validKeywords.includes(value)) {
    popup.classList.remove('show');
    input.value = '';
    showRuleOverlay('Access Granted', 2000);
  } else {
    showRuleOverlay('⚠️ Invalid Keyword', 2000);
    input.value = '';
  }
}

function setupStage2() {
  const timeRange = document.getElementById('timeRange');
  const timeValue = document.getElementById('timeValue');
  
  timeRange.addEventListener('input', (e) => {
    const value = e.target.value;
    timeValue.textContent = value;
    userChoices.time = value;
  });
}

function confirmTime() {
  showScreen('stage3');
}

function selectMovement(movementType) {
  userChoices.movement = movementType;
  
  if (movementType === 'rotate') {
    showRuleOverlay('⚠️ 빛이 3회 회전합니다<br>3번째 회전 시 아무 키나 누르십시오', 3000);
    setTimeout(() => {
      triggerRotateRule();
    }, 3500);
  } else {
    proceedToResult();
  }
}

function triggerRotateRule() {
  // 간단 버전: 바로 결과로
  proceedToResult();
}

function proceedToResult() {
  showScreen('generating');
  setTimeout(() => {
    generateCard();
  }, 3000);
}

function generateCard() {
  const lightData = observedLights[userChoices.light];
  
  document.getElementById('emotionName').textContent = lightData.name;
  document.getElementById('observationData').textContent = `관찰: ${lightData.observation}`;
  document.getElementById('locationData').textContent = `장소: ${lightData.location}`;
  document.getElementById('quote1').textContent = `"${lightData.quotes[0]}"`;
  document.getElementById('quote2').textContent = `"${lightData.quotes[1]}"`;
  document.getElementById('warningText').textContent = lightData.warning;
  document.getElementById('cardId').textContent = `#L-${Math.floor(Math.random() * 9000) + 1000}`;
  
  drawCardCanvas();
  showScreen('result');
}

function drawCardCanvas() {
  const canvas = document.getElementById('cardCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 400;
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 400, 400);
  
  const lightData = observedLights[userChoices.light];
  const centerX = 200;
  const centerY = 200;
  
  for (let i = 0; i < 3; i++) {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100 + i * 20);
    gradient.addColorStop(0, `rgba(${lightData.colorRGB.r}, ${lightData.colorRGB.g}, ${lightData.colorRGB.b}, 0.1)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);
  }
  
  for (let i = 0; i < 300; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 80;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${lightData.colorRGB.r}, ${lightData.colorRGB.g}, ${lightData.colorRGB.b}, ${Math.random() * 0.6})`;
    ctx.fill();
  }
  
  const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
  coreGradient.addColorStop(0, `rgba(${lightData.colorRGB.r}, ${lightData.colorRGB.g}, ${lightData.colorRGB.b}, 0.9)`);
  coreGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, 400, 400);
}

function downloadCard() {
  const canvas = document.getElementById('cardCanvas');
  const link = document.createElement('a');
  link.download = `my-light-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

function restart() {
  userChoices = { light: null, time: 15, movement: null };
  
  // Three.js 리셋
  scene.clear();
  renderer.dispose();
  container.innerHTML = '';
  
  showScreen('opening');
}

function callStaff() {
  const staffCall = document.getElementById('staffCall');
  const fairy = document.getElementById('fairy');
  
  staffCall.classList.remove('show');
  fairy.classList.add('show');
  
  setTimeout(() => {
    fairy.classList.remove('show');
    restart();
  }, 3000);
}
