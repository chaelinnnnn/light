const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

//시간대별 위치
const timeData = {
  '1pm': {
    colors: ['#FF6B9D', '#E91E63', '#C2185B'],
    position: { x: canvas.width * 0.28, y: canvas.height * 0.28 },
    type: 'single'
  },
  '5pm': {
    colors: ['#FFEAA7', '#FDD835', '#F9A825'],
    position: { x: canvas.width * 0.72, y: canvas.height * 0.28 },
    type: 'single'
  },
  '11pm': {
    colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'],
    position: { x: canvas.width * 0.28, y: canvas.height * 0.72 },
    type: 'single'
  },
  '7am': {
    colors: ['#74B9FF', '#42A5F5', '#1E88E5'],
    position: { x: canvas.width * 0.72, y: canvas.height * 0.72 },
    type: 'single'
  }
};

// 개선된 Blob 클래스
class EnhancedBlob {
  constructor(x, y, radius, colors, label) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.colors = colors;
    this.label = label;
    this.offset = Math.random() * Math.PI * 2;
  }
  
  update(time) {
    this.radius = this.baseRadius + Math.sin(time * 0.001 + this.offset) * 8;
  }
  
  draw() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // 외곽 glow (blur 강함)
    ctx.filter = 'blur(80px)';
    for (let i = 0; i < 2; i++) {
      const glowRadius = this.radius * 1.5;
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
    
    // 중간 레이어 (blur 중간)
    ctx.filter = 'blur(50px)';
    const midGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 1.2
    );
    midGradient.addColorStop(0, this.colors[0] + 'dd');
    midGradient.addColorStop(0.6, this.colors[1] + '99');
    midGradient.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = midGradient;
    ctx.fill();
    
    // 코어 (blur 약함)
    ctx.filter = 'blur(30px)';
    const coreGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 0.8
    );
    coreGradient.addColorStop(0, this.colors[0] + 'ff');
    coreGradient.addColorStop(0.7, this.colors[1] + 'cc');
    coreGradient.addColorStop(1, this.colors[2] + '00');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
    
    // 라벨 (blur 없음)
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = '16px Helvetica Neue, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x, this.y + this.radius + 40);
    ctx.restore();
  }
}

// 4개 시간대 blobs 생성
const timeBlobs = {};
const labels = {
  '1pm': '(1) 1:00 pm',
  '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm',
  '7am': '(4) 7:00 am'
};

for (const [key, data] of Object.entries(timeData)) {
  timeBlobs[key] = new EnhancedBlob(
    data.position.x,
    data.position.y,
    120,  // 더 크게
    data.colors,
    labels[key]
  );
}

// 중앙 흰 빛 (드래그 가능)
const centerLight = new EnhancedBlob(
  canvas.width / 2,
  canvas.height / 2,
  100,
  ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
  ''
);
centerLight.draggable = true;

let isDragging = false;
let selectedTime = null;
let isAnimating = false;

// 드래그 이벤트
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
  
  // 호버 효과
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

// 드롭 감지
function checkDrop() {
  for (const [key, blob] of Object.entries(timeBlobs)) {
    const dist = Math.sqrt(
      (centerLight.x - blob.x) ** 2 + (centerLight.y - blob.y) ** 2
    );
    
    if (dist < blob.radius + centerLight.radius) {
      absorbColor(key, blob);
      return;
    }
  }
}

// 색 흡수 애니메이션
function absorbColor(timeKey, targetBlob) {
  isAnimating = true;
  selectedTime = timeKey;
  
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

// 색 변환
function changeColor(timeKey, originalX, originalY, originalRadius) {
  const newColors = timeData[timeKey].colors;
  const duration = 1000;
  const startTime = Date.now();
  const oldColors = centerLight.colors;
  
  function animateColor() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 색 전환
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

// 원래 위치로
function returnToCenter(x, y, radius) {
  const duration = 600;
  const startTime = Date.now();
  const startX = centerLight.x;
  const startY = centerLight.y;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
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

// Easing 함수
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 애니메이션 루프
function animate() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const time = Date.now();
  
  // 4개 시간대 blobs
  Object.values(timeBlobs).forEach(blob => {
    blob.update(time);
    blob.draw();
  });
  
  // 중앙 빛
  centerLight.update(time);
  centerLight.draw();
  
  requestAnimationFrame(animate);
}

animate();

// Next 버튼
nextBtn.disabled = true;
nextBtn.addEventListener('click', () => {
  console.log('Selected time:', selectedTime);
  // Stage 2로 이동
  alert(`다음 Stage로! 선택: ${selectedTime}`);
});

// 리사이즈
window.addEventListener('resize', () => {
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  // blob 위치 비율 유지
  const scaleX = canvas.width / oldWidth;
  const scaleY = canvas.height / oldHeight;
  
  for (const blob of Object.values(timeBlobs)) {
    blob.x *= scaleX;
    blob.y *= scaleY;
  }
  
  centerLight.x = canvas.width / 2;
  centerLight.y = canvas.height / 2;
});
