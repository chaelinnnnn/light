// ===== 캔버스 설정 =====
const canvas = document.getElementById('lightCanvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('audio');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== 사용자 선택 저장 =====
let userChoices = {
  emotion: null,
  movement: null,
  intensity: null
};

// ===== 감정별 빛 데이터 =====
const emotionData = {
  calm: {
    name: "평온의 빛",
    color: { r: 255, g: 215, b: 0 }, // 따뜻한 노란색
    observation: "01.28 / 15:47 / -2°C",
    quotes: ["편안해요", "오래 보고 싶어요"],
    warning: "⚠️ 이 빛은 당신을 기다립니다",
    audio: "calm.mp3"
  },
  hope: {
    name: "희망의 빛",
    color: { r: 176, g: 224, b: 230 }, // 청록색
    observation: "01.30 / 13:15 / 맑음",
    quotes: ["새로 시작하는 느낌", "가능성"],
    warning: "⚠️ 이 빛은 당신을 인도합니다",
    audio: "hope.mp3"
  },
  joy: {
    name: "기쁨의 빛",
    color: { r: 255, g: 255, b: 255 }, // 밝은 흰색
    observation: "01.30 / 13:15 / 맑음",
    quotes: ["신나요", "에너지 넘쳐요"],
    warning: "⚠️ 이 빛은 당신을 채웁니다",
    audio: "joy.mp3"
  },
  excitement: {
    name: "설렘의 빛",
    color: { r: 255, g: 140, b: 0 }, // 주황색
    observation: "01.31 / 17:58 / 일몰",
    quotes: ["두근거려요", "뭔가 일어날 것 같아요"],
    warning: "⚠️ 이 빛은 당신을 부릅니다",
    audio: "excitement.mp3"
  }
};

// ===== 빛 클래스 =====
class Light {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // 초기 회색
    this.color = { r: 128, g: 128, b: 128 };
    this.targetColor = { ...this.color };
    
    this.size = 80;
    this.targetSize = 80;
    
    this.opacity = 0.5;
    this.targetOpacity = 0.5;
    
    this.blur = 15;
    this.targetBlur = 15;
    
    this.particles = [];
    this.particleCount = 300;
    this.createParticles();
    
    this.movement = 'idle';
    this.time = 0;
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.size;
      
      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        baseX: Math.cos(angle) * radius,
        baseY: Math.sin(angle) * radius,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }
  
  setColor(emotion) {
    this.targetColor = { ...emotionData[emotion].color };
  }
  
  setMovement(movement) {
    this.movement = movement;
    
    switch(movement) {
      case 'still':
        // 정적
        break;
      case 'walk':
        // 천천히 좌우 이동
        break;
      case 'play':
        // 활발히 여러 방향
        this.particleCount = 500;
        this.createParticles();
        break;
      case 'run':
        // 빠르게 한 방향
        break;
    }
  }
  
  setIntensity(intensity) {
    switch(intensity) {
      case 'whisper':
        this.targetOpacity = 0.3;
        this.targetSize = 60;
        this.targetBlur = 20;
        break;
      case 'talk':
        this.targetOpacity = 0.7;
        this.targetSize = 80;
        this.targetBlur = 10;
        break;
      case 'song':
        this.targetOpacity = 0.9;
        this.targetSize = 100;
        this.targetBlur = 5;
        break;
      case 'shout':
        this.targetOpacity = 1;
        this.targetSize = 120;
        this.targetBlur = 0;
        break;
    }
  }
  
  update() {
    this.time += 0.01;
    
    // 부드러운 색 전환
    this.color.r += (this.targetColor.r - this.color.r) * 0.05;
    this.color.g += (this.targetColor.g - this.color.g) * 0.05;
    this.color.b += (this.targetColor.b - this.color.b) * 0.05;
    
    // 크기/투명도 전환
    this.size += (this.targetSize - this.size) * 0.05;
    this.opacity += (this.targetOpacity - this.opacity) * 0.05;
    this.blur += (this.targetBlur - this.blur) * 0.05;
    
    // 움직임 패턴
    switch(this.movement) {
      case 'idle':
        // 숨쉬기
        this.targetSize = 80 + Math.sin(this.time * 2) * 5;
        break;
        
      case 'still':
        // 정적
        this.targetX = canvas.width / 2;
        this.targetY = canvas.height / 2;
        break;
        
      case 'walk':
        // 좌우 이동
        this.targetX = canvas.width / 2 + Math.sin(this.time) * 100;
        this.targetY = canvas.height / 2;
        break;
        
      case 'play':
        // 활발한 움직임
        this.particles.forEach(p => {
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = (Math.random() - 0.5) * 2;
        });
        break;
        
      case 'run':
        // 빠른 이동
        this.targetX = canvas.width / 2 + Math.sin(this.time * 3) * 150;
        this.targetY = canvas.height / 2;
        break;
    }
    
    // 위치 부드럽게
    this.x += (this.targetX - this.x) * 0.05;
    this.y += (this.targetY - this.y) * 0.05;
    
    // 입자 업데이트
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      // 범위 벗어나면 재생성
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      if (dist > this.size * 1.5) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.size * 0.5;
        p.x = Math.cos(angle) * radius;
        p.y = Math.sin(angle) * radius;
      }
    });
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // 입자 그리기
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${p.opacity * this.opacity})`;
      ctx.fill();
    });
    
    // 중심 빛 (그라데이션)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.6})`);
    gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
    
    ctx.filter = `blur(${this.blur}px)`;
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
    ctx.filter = 'none';
    
    ctx.restore();
  }
}

// ===== 빛 생성 =====
const light = new Light();

// ===== 애니메이션 루프 =====
function animate() {
  // 배경 (잔상 효과)
  ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 빛 업데이트 & 그리기
  light.update();
  light.draw();
  
  requestAnimationFrame(animate);
}

animate();

// ===== UI 함수들 =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function startExperience() {
  showScreen('stage1');
  light.movement = 'idle';
}

function selectEmotion(emotion) {
  userChoices.emotion = emotion;
  
  // 빛 색 변경
  light.setColor(emotion);
  
  // 오디오 재생 (파일 있으면)
  // audio.src = `assets/${emotionData[emotion].audio}`;
  // audio.play();
  
  // 다음 스테이지로
  setTimeout(() => {
    showScreen('stage2');
  }, 2000);
}

function selectMovement(movement) {
  userChoices.movement = movement;
  
  // 빛 움직임 변경
  light.setMovement(movement);
  
  // 다음 스테이지로
  setTimeout(() => {
    showScreen('stage3');
  }, 2000);
}

function selectIntensity(intensity) {
  userChoices.intensity = intensity;
  
  // 빛 강도 변경
  light.setIntensity(intensity);
  
  // 생성 화면으로
  setTimeout(() => {
    showScreen('generating');
    generateCard();
  }, 2000);
}

// ===== 카드 생성 =====
function generateCard() {
  setTimeout(() => {
    const emotion = emotionData[userChoices.emotion];
    
    // 결과 화면 업데이트
    document.getElementById('emotionName').textContent = emotion.name;
    document.getElementById('observationData').textContent = `관찰: ${emotion.observation}`;
    document.getElementById('quote1').textContent = `"${emotion.quotes[0]}"`;
    document.getElementById('quote2').textContent = `"${emotion.quotes[1]}"`;
    document.getElementById('warningText').textContent = emotion.warning;
    document.getElementById('cardId').textContent = `#L-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // 카드 캔버스에 빛 그리기
    drawCardCanvas();
    
    showScreen('result');
  }, 3000);
}

function drawCardCanvas() {
  const cardCanvas = document.getElementById('cardCanvas');
  const cardCtx = cardCanvas.getContext('2d');
  
  cardCanvas.width = 400;
  cardCanvas.height = 400;
  
  // 배경
  cardCtx.fillStyle = '#1a1a1a';
  cardCtx.fillRect(0, 0, 400, 400);
  
  // 현재 빛 상태를 카드에 그리기
  const centerX = 200;
  const centerY = 200;
  
  // 입자들
  light.particles.slice(0, 200).forEach(p => {
    cardCtx.beginPath();
    cardCtx.arc(
      centerX + p.x * 0.8, 
      centerY + p.y * 0.8, 
      p.size, 
      0, Math.PI * 2
    );
    cardCtx.fillStyle = `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${p.opacity * light.opacity})`;
    cardCtx.fill();
  });
  
  // 중심 그라데이션
  const gradient = cardCtx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, light.size * 0.8
  );
  gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${light.opacity * 0.6})`);
  gradient.addColorStop(1, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, 0)`);
  
  cardCtx.fillStyle = gradient;
  cardCtx.fillRect(0, 0, 400, 400);
}

function saveCard() {
  showScreen('qr');
  
  // QR 코드 생성
  const qrcodeDiv = document.getElementById('qrcode');
  qrcodeDiv.innerHTML = ''; // 기존 QR 제거
  
  const cardData = {
    emotion: userChoices.emotion,
    movement: userChoices.movement,
    intensity: userChoices.intensity,
    timestamp: new Date().toISOString()
  };
  
  new QRCode(qrcodeDiv, {
    text: JSON.stringify(cardData),
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
  });
}

function closeQR() {
  showScreen('result');
}

function restart() {
  // 리셋
  userChoices = {
    emotion: null,
    movement: null,
    intensity: null
  };
  
  light.movement = 'idle';
  light.targetColor = { r: 128, g: 128, b: 128 };
  light.targetOpacity = 0.5;
  light.targetSize = 80;
  light.targetBlur = 15;
  light.particleCount = 300;
  light.createParticles();
  
  showScreen('intro');
}

// ===== 윈도우 리사이즈 =====
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  light.x = canvas.width / 2;
  light.y = canvas.height / 2;
  light.targetX = light.x;
  light.targetY = light.y;
});

// ===== 스킵 기능 (크리틱용 - ESC) =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // 바로 결과로
    userChoices.emotion = 'calm';
    userChoices.movement = 'still';
    userChoices.intensity = 'talk';
    light.setColor('calm');
    light.setMovement('still');
    light.setIntensity('talk');
    generateCard();
  }
});
