const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// 시간대별 색상
const timeColors = {
  '1pm': {
    colors: ['#FF6B9D', '#C06C84', '#F67280'],
    position: { x: canvas.width * 0.3, y: canvas.height * 0.25 }
  },
  '5pm': {
    colors: ['#FFEAA7', '#FDCB6E', '#F8B500'],
    position: { x: canvas.width * 0.7, y: canvas.height * 0.25 }
  },
  '11pm': {
    colors: ['#DFE4EA', '#A29BFE', '#6C5CE7'],
    position: { x: canvas.width * 0.3, y: canvas.height * 0.65 }
  },
  '7am': {
    colors: ['#74B9FF', '#0984E3', '#00B894'],
    position: { x: canvas.width * 0.7, y: canvas.height * 0.65 }
  }
};

// Blob 클래스
class Blob {
  constructor(x, y, radius, colors) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.colors = colors;
    this.offset = Math.random() * Math.PI * 2;
  }
  
  update(time) {
    this.radius = this.baseRadius + Math.sin(time * 0.001 + this.offset) * 10;
  }
  
  draw() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(60px)';
    
    for (let i = 0; i < 3; i++) {
      const layerRadius = this.radius * (1 - i * 0.15);
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, layerRadius
      );
      
      const colorIndex = i % this.colors.length;
      gradient.addColorStop(0, this.colors[colorIndex] + 'ff');
      gradient.addColorStop(0.5, this.colors[colorIndex] + '88');
      gradient.addColorStop(1, this.colors[colorIndex] + '00');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, layerRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    ctx.filter = 'none';
    ctx.restore();
  }
}

// 4개 시간대 blobs
const timeBlobs = {};
for (const [key, data] of Object.entries(timeColors)) {
  timeBlobs[key] = new Blob(data.position.x, data.position.y, 100, data.colors);
}

// 중앙 흰 빛 (드래그 가능)
const centerLight = new Blob(canvas.width / 2, canvas.height / 2, 80, ['#FFFFFF', '#F0F0F0', '#E0E0E0']);
centerLight.draggable = true;

let isDragging = false;
let selectedTime = null;

// 드래그 이벤트
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
  if (dist < centerLight.radius) {
    isDragging = true;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    centerLight.x = e.clientX - rect.left;
    centerLight.y = e.clientY - rect.top;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (isDragging) {
    isDragging = false;
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
  selectedTime = timeKey;
  
  // 1. 빛이 시계로 빨려들어감
  const startX = centerLight.x;
  const startY = centerLight.y;
  const startRadius = centerLight.radius;
  const duration = 500;
  const startTime = Date.now();
  
  function animateAbsorb() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    centerLight.x = startX + (targetBlob.x - startX) * progress;
    centerLight.y = startY + (targetBlob.y - startY) * progress;
    centerLight.radius = startRadius * (1 - progress * 0.5);
    
    if (progress < 1) {
      requestAnimationFrame(animateAbsorb);
    } else {
      // 2. 색 변환
      setTimeout(() => {
        changeColor(timeKey, startX, startY, startRadius);
      }, 200);
    }
  }
  
  animateAbsorb();
}

// 색 변환
function changeColor(timeKey, originalX, originalY, originalRadius) {
  const newColors = timeColors[timeKey].colors;
  const duration = 500;
  const startTime = Date.now();
  
  function animateColor() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 색 서서히 변환
    centerLight.colors = newColors;
    centerLight.radius = originalRadius * (0.5 + progress * 0.5);
    
    if (progress < 1) {
      requestAnimationFrame(animateColor);
    } else {
      // 3. 원래 위치로
      returnToCenter(originalX, originalY, originalRadius);
    }
  }
  
  animateColor();
}

// 원래 위치로
function returnToCenter(x, y, radius) {
  const duration = 300;
  const startTime = Date.now();
  const startX = centerLight.x;
  const startY = centerLight.y;
  
  function animateReturn() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    centerLight.x = startX + (canvas.width / 2 - startX) * progress;
    centerLight.y = startY + (canvas.height / 2 - startY) * progress;
    centerLight.radius = radius;
    
    if (progress < 1) {
      requestAnimationFrame(animateReturn);
    } else {
      // 완료 - Next 버튼 활성화
      nextBtn.disabled = false;
    }
  }
  
  animateReturn();
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
});

// 리사이즈
window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});
