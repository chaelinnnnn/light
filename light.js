const particleCanvas = document.getElementById('particleCanvas');
const particleCtx = particleCanvas.getContext('2d');

particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

class Particle {
  constructor() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.3 + 0.2;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > particleCanvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > particleCanvas.height) this.speedY *= -1;
  }
  
  draw() {
    particleCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    particleCtx.beginPath();
    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    particleCtx.fill();
  }
}

const particles = [];
for (let i = 0; i < 40; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

animateParticles();

const observedLights = {
  window: {
    name: "평온의 빛",
    color: { r: 255, g: 215, b: 0 },
    colorName: "Golden",
    observation: "01.28 / 15:47 / -2°C",
    location: "창문 빛",
    quotes: ["편안해요", "오래 보고 싶어요"],
    warning: "⚠️ 이 빛은 당신을 기다립니다"
  },
  street: {
    name: "긴장의 빛",
    color: { r: 176, g: 224, b: 230 },
    colorName: "Powder Blue",
    observation: "01.29 / 19:22 / -4°C",
    location: "가로등",
    quotes: ["긴장돼요", "빨리 지나가고 싶어요"],
    warning: "⚠️ 이 빛은 당신을 경계합니다"
  },
  snow: {
    name: "기쁨의 빛",
    color: { r: 255, g: 255, b: 255 },
    colorName: "Pure White",
    observation: "01.30 / 13:15 / 맑음",
    location: "눈 반사",
    quotes: ["신기해요", "반짝거려요"],
    warning: "⚠️ 이 빛은 당신을 채웁니다"
  },
  sunset: {
    name: "설렘의 빛",
    color: { r: 255, g: 140, b: 0 },
    colorName: "Dark Orange",
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

let stageTimer = null;
let shrinkTimer = null;
let lightDisappeared = false;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showWarning(elementId, message, duration = 3000) {
  const warning = document.getElementById(elementId);
  warning.textContent = message;
  warning.classList.add('show');
  setTimeout(() => {
    warning.classList.remove('show');
  }, duration);
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
  setupStage1();
}

function setupStage1() {
  setupDragAndDrop();
  startStageTimer(10);
}

function startStageTimer(seconds) {
  let timeLeft = seconds;
  const timerElement = document.getElementById('timer1');
  
  const countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 3) {
      timerElement.classList.add('warning');
    }
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      startShrinking();
    }
  }, 1000);
  
  stageTimer = countdown;
}

function startShrinking() {
  const light = document.getElementById('floatingLight');
  light.classList.add('shrinking');
  showWarning('warning1', '⚠️ 빛이 작아지고 있습니다. 즉시 화면을 터치하십시오', 5000);
  
  shrinkTimer = setTimeout(() => {
    triggerLightDisappear();
  }, 5000);
  
  document.addEventListener('click', stopShrinking, { once: true });
}

function stopShrinking() {
  const light = document.getElementById('floatingLight');
  light.classList.remove('shrinking');
  clearTimeout(shrinkTimer);
  showWarning('warning1', '안전합니다', 2000);
  startStageTimer(10);
}

function triggerLightDisappear() {
  lightDisappeared = true;
  const staffCall = document.getElementById('staffCall');
  staffCall.classList.add('show');
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

function setupDragAndDrop() {
  const light = document.getElementById('floatingLight');
  const glasses = document.querySelectorAll('.glass');
  
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  light.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  light.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
  
  function dragStart(e) {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
    
    if (e.target === light || light.contains(e.target)) {
      isDragging = true;
      light.classList.add('dragging');
    }
  }
  
  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }
      
      xOffset = currentX;
      yOffset = currentY;
      
      setTranslate(currentX, currentY, light);
    }
  }
  
  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      light.classList.remove('dragging');
      
      checkDrop(e);
    }
  }
  
  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
  
  function checkDrop(e) {
    const lightRect = light.getBoundingClientRect();
    const lightCenterX = lightRect.left + lightRect.width / 2;
    const lightCenterY = lightRect.top + lightRect.height / 2;
    
    let droppedOnGlass = false;
    
    glasses.forEach(glass => {
      const glassRect = glass.getBoundingClientRect();
      
      if (lightCenterX > glassRect.left && lightCenterX < glassRect.right &&
          lightCenterY > glassRect.top && lightCenterY < glassRect.bottom) {
        
        const lightType = glass.closest('.glass-wrapper').dataset.light;
        droppedOnGlass = true;
        selectLight(lightType);
      }
    });
    
    if (!droppedOnGlass) {
      triggerAbnormalPopup();
      resetLight();
    }
  }
  
  function resetLight() {
    xOffset = 0;
    yOffset = 0;
    light.style.transform = 'translate(0, 0)';
  }
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

function selectLight(lightType) {
  clearTimeout(stageTimer);
  clearTimeout(shrinkTimer);
  
  userChoices.light = lightType;
  const lightData = observedLights[lightType];
  
  showRuleOverlay(`Color Selected:<br>${lightData.colorName}`, 2000);
  
  setTimeout(() => {
    showScreen('stage2');
    setupStage2();
  }, 2500);
}

function setupStage2() {
  const lightData = observedLights[userChoices.light];
  const lightInside = document.getElementById('lightInside');
  const timeRange = document.getElementById('timeRange');
  const timeValue = document.getElementById('timeValue');
  
  lightInside.style.background = `radial-gradient(circle, 
    rgba(${lightData.color.r}, ${lightData.color.g}, ${lightData.color.b}, 1) 0%, 
    rgba(${lightData.color.r}, ${lightData.color.g}, ${lightData.color.b}, 0.6) 40%, 
    transparent 70%)`;
  
  timeRange.addEventListener('input', (e) => {
    const value = e.target.value;
    timeValue.textContent = value;
    userChoices.time = value;
    
    const duration = 31 - value / 30 * 29;
    lightInside.style.animationDuration = `${duration}s`;
  });
}

function confirmTime() {
  showScreen('stage3');
  setupStage3();
}

function setupStage3() {
  const lightData = observedLights[userChoices.light];
  const previews = document.querySelectorAll('.light-preview');
  
  previews.forEach(preview => {
    preview.style.background = `radial-gradient(circle, 
      rgba(${lightData.color.r}, ${lightData.color.g}, ${lightData.color.b}, 1) 0%, 
      rgba(${lightData.color.r}, ${lightData.color.g}, ${lightData.color.b}, 0.6) 40%, 
      transparent 70%)`;
  });
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
  let rotations = 0;
  let keyPressed = false;
  
  const interval = setInterval(() => {
    rotations++;
    showRuleOverlay(`${rotations}회 회전`, 500);
    
    if (rotations === 3) {
      clearInterval(interval);
      
      const keyListener = (e) => {
        keyPressed = true;
        document.removeEventListener('keydown', keyListener);
        showRuleOverlay('안전합니다', 2000);
        setTimeout(proceedToResult, 2500);
      };
      
      document.addEventListener('keydown', keyListener);
      
      setTimeout(() => {
        if (!keyPressed) {
          document.removeEventListener('keydown', keyListener);
          showRuleOverlay('⚠️ 규칙 위반<br>빛이 불안정해졌습니다', 3000);
          setTimeout(proceedToResult, 3500);
        }
      }, 3000);
    }
  }, 1000);
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
    const gradient = ctx.createRadialGradient(centerX, centerY
                                              }
