const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');
const leftImage = document.getElementById('leftImage');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let currentStage = 1;
let userChoices = {
  time: null,
  shape: null
};

// ===== Stage 1 데이터 =====
const stage1Data = {
  '1pm': {
    colors: ['#FF6B9D', '#E91E63', '#C2185B'],
    position: { x: canvas.width * 0.3, y: canvas.height * 0.25 }
  },
  '5pm': {
    colors: ['#FFEAA7', '#FDD835', '#F9A825'],
    position: { x: canvas.width * 0.7, y: canvas.height * 0.25 }
  },
  '11pm': {
    colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'],
    position: { x: canvas.width * 0.3, y: canvas.height * 0.6 }
  },
  '7am': {
    colors: ['#74B9FF', '#42A5F5', '#1E88E5'],
    position: { x: canvas.width * 0.7, y: canvas.height * 0.6 }
  }
};

const stage1Labels = {
  '1pm': '(1) 1:00 pm',
  '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm',
  '7am': '(4) 7:00 am'
};

// ===== Blob 클래스 =====
class EnhancedBlob {
  constructor(x, y, radius, colors, label, shapeType = 'circle') {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.colors = colors;
    this.label = label;
    this.shapeType = shapeType;
    this.offset = Math.random() * Math.PI * 2;
  }
  
  update(time) {
    this.radius = this.baseRadius + Math.sin(time * 0.001 + this.offset) * 6;
  }
  
  draw() {
    if (this.shapeType === 'circle') {
      this.drawCircle();
    } else if (this.shapeType === 'clover') {
      this.drawClover();
    } else if (this.shapeType === 'heart') {
      this.drawHeart();
    } else if (this.shapeType === 'star') {
      this.drawStar();
    } else if (this.shapeType === 'triangle') {
      this.drawTriangle();
    }
    
    // 라벨
    if (this.label) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = '14px Helvetica Neue, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(this.label, this.x, this.y + this.radius + 40);
      ctx.restore();
    }
  }
  
  // Stage 1: 기본 원
  drawCircle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    ctx.filter = 'blur(60px)';
    for (let i = 0; i < 2; i++) {
      const glowRadius = this.radius * 1.3;
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowRadius
      );
      
      gradient.addColorStop(0, this.colors[0] + '66');
      gradient.addColorStop(0.5, this.colors[1] + '33');
      gradient.addColorStop(1, this.colors[2] + '00');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    ctx.filter = 'blur(40px)';
    const midGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    midGradient.addColorStop(0, this.colors[0] + 'dd');
    midGradient.addColorStop(0.6, this.colors[1] + '99');
    midGradient.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = midGradient;
    ctx.fill();
    
    ctx.filter = 'blur(25px)';
    const coreGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 0.7
    );
    coreGradient.addColorStop(0, this.colors[0] + 'ff');
    coreGradient.addColorStop(0.7, this.colors[1] + 'cc');
    coreGradient.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  // Stage 2-1: 클로버 ♣
  drawClover() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(45px)';
    
    const leafRadius = this.radius * 0.35;
    
    // 위쪽 잎
    this.drawLeaf(this.x, this.y - leafRadius * 1.6, leafRadius);
    
    // 왼쪽 잎
    this.drawLeaf(this.x - leafRadius * 1.4, this.y + leafRadius * 0.2, leafRadius);
    
    // 오른쪽 잎
    this.drawLeaf(this.x + leafRadius * 1.4, this.y + leafRadius * 0.2, leafRadius);
    
    // 줄기
    ctx.filter = 'blur(35px)';
    ctx.save();
    ctx.translate(this.x, this.y + leafRadius * 1.8);
    ctx.scale(0.4, 1);
    
    const stemGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, leafRadius * 0.8);
    stemGradient.addColorStop(0, this.colors[0] + 'ff');
    stemGradient.addColorStop(1, this.colors[1] + '00');
    
    ctx.beginPath();
    ctx.arc(0, 0, leafRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = stemGradient;
    ctx.fill();
    ctx.restore();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  drawLeaf(x, y, r) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
    gradient.addColorStop(0, this.colors[0] + 'ff');
    gradient.addColorStop(0.5, this.colors[1] + 'dd');
    gradient.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Stage 2-2: 하트 ♥
  drawHeart() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(50px)';
    
    const size = this.radius * 0.8;
    
    // 왼쪽 반원
    const gradient1 = ctx.createRadialGradient(
      this.x - size * 0.5, this.y - size * 0.3, 0,
      this.x - size * 0.5, this.y - size * 0.3, size * 0.7
    );
    gradient1.addColorStop(0, this.colors[0] + 'ff');
    gradient1.addColorStop(0.6, this.colors[1] + 'cc');
    gradient1.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x - size * 0.5, this.y - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = gradient1;
    ctx.fill();
    
    // 오른쪽 반원
    const gradient2 = ctx.createRadialGradient(
      this.x + size * 0.5, this.y - size * 0.3, 0,
      this.x + size * 0.5, this.y - size * 0.3, size * 0.7
    );
    gradient2.addColorStop(0, this.colors[1] + 'ff');
    gradient2.addColorStop(0.6, this.colors[2] + 'cc');
    gradient2.addColorStop(1, this.colors[0] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x + size * 0.5, this.y - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = gradient2;
    ctx.fill();
    
    // 아래 삼각형
    const gradient3 = ctx.createRadialGradient(
      this.x, this.y + size * 0.3, 0,
      this.x, this.y + size * 0.3, size * 1.2
    );
    gradient3.addColorStop(0, this.colors[2] + 'ff');
    gradient3.addColorStop(0.5, this.colors[0] + 'aa');
    gradient3.addColorStop(1, this.colors[1] + '00');
    
    ctx.beginPath();
    ctx.moveTo(this.x - size * 1.2, this.y - size * 0.2);
    ctx.lineTo(this.x + size * 1.2, this.y - size * 0.2);
    ctx.lineTo(this.x, this.y + size * 1.5);
    ctx.closePath();
    ctx.fillStyle = gradient3;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  // Stage 2-3: 둥근 별 ✦
  drawStar() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(40px)';
    
    const spikes = 5;
    const outerRadius = this.radius * 0.9;
    const innerRadius = this.radius * 0.4;
    
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, outerRadius * 1.3
    );
    gradient.addColorStop(0, this.colors[0] + 'ff');
    gradient.addColorStop(0.4, this.colors[1] + 'ee');
    gradient.addColorStop(0.7, this.colors[2] + 'aa');
    gradient.addColorStop(1, this.colors[0] + '00');
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  // Stage 2-4: 세모 △
  drawTriangle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(50px)';
    
    const size = this.radius * 1.2;
    
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, size * 1.2
    );
    gradient.addColorStop(0, this.colors[0] + 'ff');
    gradient.addColorStop(0.4, this.colors[1] + 'dd');
    gradient.addColorStop(0.7, this.colors[2] + '99');
    gradient.addColorStop(1, this.colors[0] + '00');
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size);
    ctx.lineTo(this.x - size * 0.9, this.y + size * 0.6);
    ctx.lineTo(this.x + size * 0.9, this.y + size * 0.6);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
  }
}

// ===== 전역 변수 =====
let stage1Blobs = {};
let stage2Blobs = {};
let centerLight;
let isDragging = false;
let isAnimating = false;
let guideShown = false;

// ===== Stage 1 초기화 =====
function initStage1() {
  stage1Blobs = {};
  
  for (const [key, data] of Object.entries(stage1Data)) {
    stage1Blobs[key] = new EnhancedBlob(
      data.position.x,
      data.position.y,
      110,
      data.colors,
      stage1Labels[key],
      'circle'
    );
  }
  
  centerLight = new EnhancedBlob(
    canvas.width / 2,
    canvas.height * 0.42,
    85,
    ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
    '',
    'circle'
  );
  
  setTimeout(() => showDragGuide(), 500);
}

// ===== Stage 2 초기화 =====
function initStage2() {
  leftImage.src = 'art2.png';
  
  stage2Blobs = {};
  const selectedColors = stage1Data[userChoices.time].colors;
  
  stage2Blobs['clover'] = new EnhancedBlob(
    canvas.width * 0.3,
    canvas.height * 0.25,
    110,
    selectedColors,
    '(1) 하나의 완전한 형태',
    'clover'
  );
  
  stage2Blobs['heart'] = new EnhancedBlob(
    canvas.width * 0.7,
    canvas.height * 0.25,
    110,
    selectedColors,
    '(2) 흩어진 조각들',
    'heart'
  );
  
  stage2Blobs['star'] = new EnhancedBlob(
    canvas.width * 0.3,
    canvas.height * 0.6,
    110,
    selectedColors,
    '(3) 날카롭게 빛나는 선들',
    'star'
  );
  
  stage2Blobs['triangle'] = new EnhancedBlob(
    canvas.width * 0.7,
    canvas.height * 0.6,
    110,
    selectedColors,
    '(4) 부드럽게 번지는 색',
    'triangle'
  );
  
  centerLight = new EnhancedBlob(
    canvas.width / 2,
    canvas.height * 0.42,
    85,
    selectedColors,
    '',
    'circle'
  );
  
  nextBtn.disabled = true;
  guideShown = false;
  setTimeout(() => showDragGuide(), 500);
}

// ===== 드래그 가이드 =====
function showDragGuide() {
  if (guideShown) return;
  guideShown = true;
  
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  guide.innerHTML = `
    <div class="drag-guide-text">Drag the light to ${currentStage === 1 ? 'a time' : 'a shape'}</div>
    <div class="drag-arrow">↕</div>
  `;
  
  document.getElementById('right-panel').appendChild(guide);
  
  setTimeout(() => {
    guide.remove();
  }, 3000);
}

// ===== 마우스 이벤트 =====
canvas.addEventListener('mousedown', (e) => {
  if (isAnimating) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
  if (dist < centerLight.radius) {
    isDragging = true;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isAnimating) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
  if (dist < centerLight.radius && !isDragging) {
    canvas.style.cursor = 'grab';
  } else if (!isDragging) {
    canvas.style.cursor = 'default';
  }
  
  if (isDragging) {
    centerLight.x = e.clientX - rect.left;
    centerLight.y = e.clientY - rect.top;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (isDragging && !isAnimating) {
    isDragging = false;
    canvas.style.cursor = 'default';
    checkDrop();
  }
});

// ===== 터치 이벤트 =====
canvas.addEventListener('touchstart', (e) => {
  if (isAnimating) return;
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
  if (dist < centerLight.radius) {
    isDragging = true;
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (isDragging && !isAnimating) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    centerLight.x = touch.clientX - rect.left;
    centerLight.y = touch.clientY - rect.top;
  }
});

canvas.addEventListener('touchend', (e) => {
  if (isDragging && !isAnimating) {
    e.preventDefault();
    isDragging = false;
    checkDrop();
  }
});

// ===== 드롭 감지 =====
function checkDrop() {
  const blobs = currentStage === 1 ? stage1Blobs : stage2Blobs;
  
  for (const [key, blob] of Object.entries(blobs)) {
    const dist = Math.sqrt(
      (centerLight.x - blob.x) ** 2 + (centerLight.y - blob.y) ** 2
    );
    
    if (dist < blob.radius + centerLight.radius) {
      if (currentStage === 1) {
        absorbColor(key, blob);
      } else {
        absorbShape(key, blob);
      }
      return;
    }
  }
}

// ===== Stage 1: 색 흡수 =====
function absorbColor(timeKey, targetBlob) {
  isAnimating = true;
  userChoices.time = timeKey;
  
  const startX = centerLight.x;
  const startY = centerLight.y;
  const startRadius = centerLight.radius;
  const duration = 800;
  const startTime = Date.now();
  
  function animateAbsorb() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    
    centerLight.x = startX + (targetBlob.x - startX) * eased;
    centerLight.y = startY + (targetBlob.y - startY) * eased;
    centerLight.radius = startRadius * (1 - eased * 0.4);
    
    if (progress < 1) {
      requestAnimationFrame(animateAbsorb);
    } else {
      setTimeout(() => {
        changeColor(timeKey, startX, startY, startRadius);
      }, 300);
    }
  }
  
  animateAbsorb();
}

function changeColor(timeKey, originalX, originalY, originalRadius) {
  const newColors = stage1Data[timeKey].colors;
  const duration = 1000;
  const startTime = Date.now();
  
  function animateColor() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    centerLight.colors = newColors;
    centerLight.radius = originalRadius * (0.6 + progress * 0.4);
    
    if (progress < 1) {
      requestAnimationFrame(animateColor);
    } else {
      setTimeout(() => {
        returnToCenter(originalX, originalY, originalRadius);
      }, 200);
    }
  }
  
  animateColor();
}

// ===== Stage 2: 형태 흡수 =====
function absorbShape(shapeKey, targetBlob) {
  isAnimating = true;
  userChoices.shape = shapeKey;
  
  const startX = centerLight.x;
  const startY = centerLight.y;
  const startRadius = centerLight.radius;
  const duration = 800;
  const startTime = Date.now();
  
  function animateAbsorb() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    
    centerLight.x = startX + (targetBlob.x - startX) * eased;
    centerLight.y = startY + (targetBlob.y - startY) * eased;
    centerLight.radius = startRadius * (1 - eased * 0.4);
    
    if (progress < 1) {
      requestAnimationFrame(animateAbsorb);
    } else {
      setTimeout(() => {
        changeShape(shapeKey, startX, startY, startRadius);
      }, 300);
    }
  }
  
  animateAbsorb();
}

function changeShape(shapeKey, originalX, originalY, originalRadius) {
  const newShapeType = shapeKey; // 'clover', 'heart', 'star', 'triangle'
  const duration = 1000;
  const startTime = Date.now();
  
  function animateShape() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    centerLight.shapeType = newShapeType;
    centerLight.radius = originalRadius * (0.6 + progress * 0.4);
    
    if (progress < 1) {
      requestAnimationFrame(animateShape);
    } else {
      setTimeout(() => {
        returnToCenter(originalX, originalY, originalRadius);
      }, 200);
    }
  }
  
  animateShape();
}

// ===== 원래 위치로 =====
function returnToCenter(x, y, radius) {
  const duration = 600;
  const startTime = Date.now();
  const startX = centerLight.x;
  const startY = centerLight.y;
  const centerX = canvas.width / 2;
  const centerY = canvas.height * 0.42;
  
  function animateReturn() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    
    centerLight.x = startX + (centerX - startX) * eased;
    centerLight.y = startY + (centerY - startY) * eased;
    centerLight.radius = radius;
    
    if (progress < 1) {
      requestAnimationFrame(animateReturn);
    } else {
      isAnimating = false;
      nextBtn.disabled = false;
    }
  }
  
  animateReturn();
}

// ===== Easing =====
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== 애니메이션 루프 =====
function animate() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const time = Date.now();
  
  if (currentStage === 1) {
    Object.values(stage1Blobs).forEach(blob => {
      blob.update(time);
      blob.draw();
    });
  } else if (currentStage === 2) {
    Object.values(stage2Blobs).forEach(blob => {
      blob.update(time);
      blob.draw();
    });
  }
  
  centerLight.update(time);
  centerLight.draw();
  
  requestAnimationFrame(animate);
}

// ===== Next 버튼 =====
nextBtn.disabled = true;
nextBtn.addEventListener('click', () => {
  if (currentStage === 1) {
    currentStage = 2;
    initStage2();
  } else if (currentStage === 2) {
    console.log('Stage 3로!');
    console.log('선택:', userChoices);
    alert(`Stage 3로!\n시간: ${userChoices.time}\n형태: ${userChoices.shape}`);
  }
});

// ===== 리사이즈 =====
window.addEventListener('resize', () => {
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  const scaleX = canvas.width / oldWidth;
  const scaleY = canvas.height / oldHeight;
  
  const blobs = currentStage === 1 ? stage1Blobs : stage2Blobs;
  for (const blob of Object.values(blobs)) {
    blob.x *= scaleX;
    blob.y *= scaleY;
  }
  
  centerLight.x = canvas.width / 2;
  centerLight.y = canvas.height * 0.42;
});

// ===== 시작 =====
initStage1();
animate();
