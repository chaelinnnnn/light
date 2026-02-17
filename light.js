const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');
const leftImage = document.getElementById('leftImage');

let W = 0, H = 0, DPR = 1;

function resizeCanvas() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  W = canvas.offsetWidth;
  H = canvas.offsetHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resizeCanvas();

let currentStage = 1;
let userChoices = { time: null, shape: null, intensity: null };
let stage1Blobs = {};
let stage2Blobs = {};
let centerLight = null;
let isDragging = false;
let isAnimating = false;
let guideShown = false;
let lightBeam = null;
let lightIntensity = 0.5;
let sliderDragging = false;
let sliderX = 0;

/* =========================================================
   ★ 배경음악 — change.mp3 (볼륨 0.15, 루프)
========================================================= */
let bgm = null;

function startBGM() {
  if (bgm) return;
  bgm = new Audio('change.mp3');
  bgm.loop = true;
  bgm.volume = 0.15;
  bgm.play().catch(() => {
    // 자동재생 차단 시 첫 인터랙션에서 재생
    const startOnce = () => {
      bgm.play().catch(() => {});
      window.removeEventListener('pointerdown', startOnce);
    };
    window.addEventListener('pointerdown', startOnce);
  });
}

/* =========================================================
   ★ 지침 시스템
========================================================= */
const DIRECTIVE2_STAGE = Math.ceil(Math.random() * 3);
let DIRECTIVE3_STAGE;
do { DIRECTIVE3_STAGE = Math.ceil(Math.random() * 3); }
while (DIRECTIVE3_STAGE === DIRECTIVE2_STAGE);

let directive2Fired = false;
let directive3Fired = false;

const DIRECTIVE2_DELAY = 8000 + Math.random() * 12000;

let directive2Timer = null;

/* =========================================================
   ★ 지침1 — 6초 방치 → 서서히 shrink 애니메이션 → 3초 후 인트로
========================================================= */
const IDLE_TIMEOUT   = 6000;
const SHRINK_DURATION = 3000;  // shrink 애니메이션 지속 시간
const SHRINK_GRACE   = 3000;   // shrink 완료 후 터치 대기

let lastInteractionTime = Date.now();
let idleWarningActive   = false;
let idleShrinkStart     = 0;      // shrink 시작 시각
let idleGraceTimer      = null;
let _savedBaseRadius    = 70;
let _savedGlowIntensity = 1.0;

function resetIdleTimer() {
  lastInteractionTime = Date.now();
  if (idleWarningActive) {
    idleWarningActive = false;
    clearTimeout(idleGraceTimer);
    idleGraceTimer = null;
    // 빛 즉시 복구
    if (centerLight) {
      centerLight.baseRadius    = _savedBaseRadius;
      centerLight.glowIntensity = _savedGlowIntensity;
    }
  }
}

function checkIdle() {
  if (idleWarningActive) {
    // shrink 진행 중 → 애니메이션 업데이트
    const elapsed = Date.now() - idleShrinkStart;
    const p = Math.min(elapsed / SHRINK_DURATION, 1);
    const e = easeInOutCubic(p);
    if (centerLight) {
      centerLight.baseRadius    = _savedBaseRadius    * (1 - e * 0.82);  // 최소 18%까지 줄어듦
      centerLight.glowIntensity = _savedGlowIntensity * (1 - e * 0.88);  // 거의 꺼짐
    }
    return;
  }
  if (Date.now() - lastInteractionTime >= IDLE_TIMEOUT) {
    idleWarningActive = true;
    idleShrinkStart   = Date.now();
    if (centerLight) {
      _savedBaseRadius    = centerLight.baseRadius;
      _savedGlowIntensity = centerLight.glowIntensity;
    }
    // shrink 완료 후 대기 시간 뒤 인트로 복귀
    idleGraceTimer = setTimeout(() => {
      if (idleWarningActive) goToIntro();
    }, SHRINK_DURATION + SHRINK_GRACE);
  }
}

['pointerdown','pointermove','touchstart','touchmove','keydown'].forEach(ev => {
  window.addEventListener(ev, resetIdleTimer, { passive: true });
});

/* =========================================================
   인트로 복귀
========================================================= */
function goToIntro() {
  clearTimeout(idleGraceTimer);
  clearTimeout(directive2Timer);
  removePopup();
  removeFairy();

  idleWarningActive = false;
  directive2Fired   = false;
  directive3Fired   = false;
  lastInteractionTime = Date.now();

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:#000;z-index:9999;
    opacity:0;transition:opacity 0.8s ease;pointer-events:none;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  setTimeout(() => {
    overlay.remove();
    currentStage = 1;
    userChoices  = { time: null, shape: null, intensity: null };
    stage1Blobs  = {};
    stage2Blobs  = {};
    centerLight  = null;
    lightBeam    = null;
    isDragging   = false;
    isAnimating  = false;
    guideShown   = false;
    startOpening();
  }, 900);
}

/* =========================================================
   ★ 지침2 — pop.png 팝업 + 10초 카운트다운
========================================================= */
let popupEl = null;
let popupCountdownTimer = null;

function scheduleDirective2() {
  if (directive2Fired) return;
  clearTimeout(directive2Timer);
  directive2Timer = setTimeout(() => {
    if (!directive2Fired && currentStage === DIRECTIVE2_STAGE) {
      directive2Fired = true;
      showPopup();
    }
  }, DIRECTIVE2_DELAY);
}

function showPopup() {
  if (popupEl) return;

  popupEl = document.createElement('div');
  popupEl.style.cssText = `
    position:fixed;inset:0;z-index:8000;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    background:rgba(0,0,0,0.80);
  `;

  const img = document.createElement('img');
  img.src = 'pop.png';
  img.style.cssText = `max-width:80%;max-height:50vh;object-fit:contain;margin-bottom:20px;`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '키워드를 입력하십시오';
  input.style.cssText = `
    font-size:18px;padding:10px 20px;border:2px solid #fff;
    background:transparent;color:#fff;outline:none;
    text-align:center;letter-spacing:0.15em;width:260px;
  `;

  // 10초 카운트다운 표시
  const timerEl = document.createElement('div');
  timerEl.style.cssText = `
    color:rgba(255,255,255,0.55);font-size:13px;
    margin-top:14px;letter-spacing:0.1em;
  `;

  const hint = document.createElement('div');
  hint.style.cssText = `color:#ff4444;font-size:12px;margin-top:6px;min-height:18px;`;

  popupEl.appendChild(img);
  popupEl.appendChild(input);
  popupEl.appendChild(timerEl);
  popupEl.appendChild(hint);
  document.body.appendChild(popupEl);

  setTimeout(() => input.focus(), 100);

  // 10초 카운트다운
  let remaining = 10;
  timerEl.textContent = `${remaining}초 내에 입력하십시오`;

  popupCountdownTimer = setInterval(() => {
    remaining--;
    timerEl.textContent = `${remaining}초 내에 입력하십시오`;
    if (remaining <= 3) timerEl.style.color = '#ff6666';
    if (remaining <= 0) {
      clearInterval(popupCountdownTimer);
      removePopup();
      goToIntro();
    }
  }, 1000);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (input.value.trim().toUpperCase() === 'LIGHT') {
        clearInterval(popupCountdownTimer);
        removePopup();
        resetIdleTimer();
      } else {
        hint.textContent = '오류 — 잘못된 키워드';
        input.style.borderColor = '#ff4444';
        input.style.animation = 'shake 0.4s';
        setTimeout(() => { input.style.animation = ''; input.value = ''; }, 500);
      }
    }
  });
}

function removePopup() {
  clearInterval(popupCountdownTimer);
  if (popupEl) { popupEl.remove(); popupEl = null; }
}

/* =========================================================
   ★ 지침3 — 캔버스 바깥 흰 영역(left-panel) 클릭 시 발동
========================================================= */
let fairyEl = null;
let _vanishedSnapshot = null;

// left-panel 클릭 감지
document.addEventListener('DOMContentLoaded', () => {
  const leftPanel = document.getElementById('left-panel');
  if (leftPanel) {
    leftPanel.addEventListener('pointerdown', () => {
      if (!directive3Fired && currentStage === DIRECTIVE3_STAGE) {
        directive3Fired = true;
        vanishLight();
      }
    });
  }
});

// left-panel이 없을 경우 canvas 바깥 body 클릭으로 fallback
document.body.addEventListener('pointerdown', (e) => {
  if (e.target === document.body || e.target === document.documentElement) {
    if (!directive3Fired && currentStage === DIRECTIVE3_STAGE) {
      directive3Fired = true;
      vanishLight();
    }
  }
});

function vanishLight() {
  if (!centerLight) return;
  _vanishedSnapshot = {
    baseRadius:    centerLight.baseRadius,
    glowIntensity: centerLight.glowIntensity,
  };
  const dur = 1800, t0 = Date.now();
  const startGlow = centerLight.glowIntensity;
  const startR    = centerLight.baseRadius;
  function fade() {
    const p = Math.min((Date.now() - t0) / dur, 1);
    centerLight.glowIntensity = startGlow * (1 - p);
    centerLight.baseRadius    = startR    * (1 - p * 0.85);
    if (p < 1) requestAnimationFrame(fade);
    else showFairy();
  }
  fade();
}

function showFairy() {
  if (fairyEl) return;
  fairyEl = document.createElement('div');
  fairyEl.style.cssText = `
    position:fixed;inset:0;z-index:8000;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    pointer-events:none;
  `;

  const img = document.createElement('img');
  img.src = 'fairy.png';
  img.style.cssText = `
    width:160px;height:auto;object-fit:contain;
    opacity:0;transition:opacity 0.7s ease;
    margin-bottom:24px;
  `;

  const btn = document.createElement('button');
  btn.textContent = '요정을 부르다';
  btn.style.cssText = `
    pointer-events:all;cursor:pointer;
    font-size:15px;padding:12px 32px;
    border:1.5px solid rgba(255,255,255,0.7);
    background:rgba(255,255,255,0.08);
    color:#fff;letter-spacing:0.12em;
    transition:background 0.2s;
  `;
  btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.22)';
  btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.08)';
  btn.addEventListener('click', () => restoreLight());

  fairyEl.appendChild(img);
  fairyEl.appendChild(btn);
  document.body.appendChild(fairyEl);
  requestAnimationFrame(() => { img.style.opacity = '1'; });
}

function removeFairy() {
  if (fairyEl) { fairyEl.remove(); fairyEl = null; }
}

function restoreLight() {
  removeFairy();
  if (!centerLight || !_vanishedSnapshot) return;
  const dur = 1200, t0 = Date.now();
  const targetR    = _vanishedSnapshot.baseRadius;
  const targetGlow = _vanishedSnapshot.glowIntensity;
  const startR    = centerLight.baseRadius;
  const startGlow = centerLight.glowIntensity;
  function rise() {
    const p = Math.min((Date.now() - t0) / dur, 1), e = easeInOutCubic(p);
    centerLight.glowIntensity = startGlow + (targetGlow - startGlow) * e;
    centerLight.baseRadius    = startR    + (targetR    - startR)    * e;
    if (p < 1) requestAnimationFrame(rise);
    else {
      centerLight.glowIntensity = targetGlow;
      centerLight.baseRadius    = targetR;
      resetIdleTimer();
    }
  }
  rise();
}

/* =========================================================
   지침 타이머 시작
========================================================= */
function startDirectiveTimers() {
  scheduleDirective2();
  // 지침3은 타이머 없음 — 흰 영역 클릭으로만 발동
}

/* =========================================================
   Stage 1 데이터
========================================================= */
function getStage1Data() {
  return {
    '1pm':  { colors: ['#FF6B9D', '#E91E63', '#C2185B'], position: { x: W*0.25, y: H*0.22 } },
    '5pm':  { colors: ['#FFEAA7', '#FDD835', '#F9A825'], position: { x: W*0.75, y: H*0.22 } },
    '11pm': { colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'], position: { x: W*0.25, y: H*0.68 } },
    '7am':  { colors: ['#74B9FF', '#42A5F5', '#1E88E5'], position: { x: W*0.75, y: H*0.68 } }
  };
}
const stage1Labels = {
  '1pm': '(1) 1:00 pm', '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm', '7am': '(4) 7:00 am'
};

/* =========================================================
   클로버 SVG Path
========================================================= */
const CLOVER_VIEWBOX = 106;
const CLOVER_CENTER  = 53;
const CLOVER_PATH = new Path2D(
  'M97.4026 53.0522C103.659 48.4719 106.786 42.105 105.781 35.627C104.999 30.6005 100.643 26.0202 94.8327 23.8985C94.3865 23.6745 93.8273 23.5634 93.3811 23.4524C93.2701 23.4524 93.1571 23.3413 92.9349 23.3413C92.4887 23.2302 92.1536 23.1173 91.7055 23.1173C91.5945 23.1173 91.4815 23.1173 91.3704 23.0062C90.9242 22.8951 90.365 22.8951 89.9188 22.7822H89.5837C89.2486 22.7822 88.8024 22.7822 88.4673 22.6711H88.1322C87.686 22.6711 87.1268 22.6711 86.6806 22.7822H86.5696C86.1234 22.7822 85.6753 22.8932 85.2291 23.0062C85.118 23.0062 85.005 23.0062 84.894 23.1173C84.5588 23.2283 84.1126 23.2283 83.7775 23.3413C83.6665 23.3413 83.5535 23.3413 83.5535 23.4524C83.1073 23.5634 82.6592 23.6764 82.213 23.8985H82.1019C83.5535 19.9884 83.6665 15.521 81.9909 11.1647C79.8691 5.35695 75.2884 1.11171 70.2616 0.217473C63.8924 -0.898889 57.5251 2.34105 52.9445 8.59498C48.362 2.34105 41.9947 -0.785913 35.5163 0.219388C30.4895 1.00065 25.9089 5.35695 23.7871 11.1666C22.2226 15.5229 22.2226 19.9903 23.676 23.9004H23.565C23.1188 23.7894 22.6707 23.5653 22.2245 23.4543C22.1504 23.4543 22.0757 23.4173 22.0004 23.3432C21.6653 23.2322 21.2191 23.1192 20.884 23.1192C20.7729 23.1192 20.6599 23.1192 20.5489 23.0081C20.1027 22.8971 19.6546 22.8971 19.2084 22.7841C18.7622 22.7841 18.203 22.673 17.7568 22.673H17.4217C16.9755 22.673 16.6404 22.673 16.1923 22.7841H15.8572C15.411 22.7841 14.8518 22.8951 14.4056 23.0081C14.2946 23.0081 14.1816 23.0081 14.1816 23.1192C13.7354 23.2302 13.4003 23.3432 12.9522 23.3432C12.8411 23.3432 12.7281 23.4543 12.617 23.4543C12.1708 23.5653 11.6117 23.7894 11.1655 23.9004C5.35545 26.0221 1.10995 30.6005 0.217572 35.627C-0.898859 41.9939 2.33937 48.4719 8.59559 53.0522C2.33937 57.6326 -0.78779 63.9995 0.217572 70.4774C0.998882 75.504 5.35545 80.0843 11.1655 82.206C11.7247 82.43 12.2819 82.5411 12.8411 82.7651C13.0651 82.8762 13.2873 82.8762 13.5113 82.8762C13.8465 82.9872 14.1816 82.9872 14.4056 83.1002C14.6297 83.1002 14.9648 83.2113 15.1869 83.2113C15.5221 83.2113 15.7461 83.3223 16.0812 83.3223H17.6438C18.203 83.3223 18.6492 83.3223 19.0954 83.2113H19.4305C19.7656 83.2113 20.2118 83.1002 20.547 83.1002C20.771 83.1002 20.8821 82.9891 21.1061 82.9891C21.4412 82.8781 21.7764 82.8781 22.0004 82.7651C22.2245 82.7651 22.3355 82.654 22.5596 82.5411C22.8947 82.43 23.1188 82.317 23.4539 82.206C23.5279 82.206 23.6026 82.1689 23.6779 82.0949C22.2264 86.005 22.1134 90.4724 23.789 94.8287C25.9108 100.636 30.4914 104.882 35.5182 105.776C36.2995 105.887 37.1938 106 37.9751 106C43.5611 106 48.9231 102.873 52.9445 97.3984C57.5251 103.654 63.8924 106.781 70.3708 105.776C75.3976 104.995 79.9782 100.638 82.1 94.8287C83.6645 90.4724 83.6645 86.005 82.2111 82.0949C82.2851 82.0949 82.3598 82.1319 82.4351 82.206C82.6592 82.317 82.9943 82.43 83.3294 82.5411C83.5535 82.6521 83.6645 82.6521 83.8886 82.7651C84.2237 82.8762 84.4478 82.8762 84.7829 82.9891C85.0069 82.9891 85.118 83.1002 85.3421 83.1002C85.6772 83.2113 86.0123 83.2113 86.4585 83.2113H86.9047C87.3509 83.2113 87.91 83.3223 88.3562 83.3223H89.9188C90.365 83.3223 90.8131 83.2113 91.1483 83.0983H91.4834C91.9296 82.9872 92.3777 82.8742 92.8239 82.7632C92.9349 82.7632 93.0479 82.7632 93.159 82.6521C93.7182 82.5411 94.2754 82.317 94.8346 82.093C100.643 79.9713 104.888 75.391 105.783 70.3645C106.899 63.9976 103.659 57.6307 97.4045 53.0522H97.4026Z'
);

/* =========================================================
   Util
========================================================= */
function hexA(hex, a255) {
  const a = Math.max(0, Math.min(255, Math.round(a255)));
  return hex + a.toString(16).padStart(2, '0');
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

/* =========================================================
   EnhancedBlob
========================================================= */
class EnhancedBlob {
  constructor(x, y, radius, colors, label, shapeType = 'circle', isBottomIcon = false) {
    this.x = x; this.y = y;
    this.baseRadius = radius; this.radius = radius;
    this.colors = colors; this.label = label;
    this.shapeType = shapeType;
    this.offset = Math.random() * Math.PI * 2;
    this.glowIntensity = 1.0;
    this.isBottomIcon = isBottomIcon;
  }
  update(time) {
    this.radius = this.baseRadius + Math.sin(time*0.001 + this.offset) * 6;
  }
  draw() {
    if      (this.shapeType === 'circle')   this.drawCircle();
    else if (this.shapeType === 'clover')   this.drawCloverSVG();
    else if (this.shapeType === 'heart')    this.drawHeart();
    else if (this.shapeType === 'star')     this.drawStar();
    else if (this.shapeType === 'triangle') this.drawTriangle();
    if (this.label) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = '14px Helvetica Neue, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
      ctx.fillText(this.label, this.x, this.y + this.radius + 40);
      ctx.restore();
    }
  }
  drawCircle() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const intensity = this.glowIntensity;
    if (this.isBottomIcon) {
      ctx.filter = 'blur(8px)';
      const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*1.2);
      g.addColorStop(0,'#eeeeee'); g.addColorStop(0.7,'#aaaaaa'); g.addColorStop(1,'#55555500');
      ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*1.2,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill(); ctx.filter='none'; ctx.restore(); return;
    }
    const bB=currentStage===2?25:60, mB=currentStage===2?15:35, cB=currentStage===2?10:20;
    ctx.filter=`blur(${bB}px)`;
    const gw=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*1.8);
    gw.addColorStop(0,hexA(this.colors[0],102*intensity)); gw.addColorStop(0.5,hexA(this.colors[1],68*intensity)); gw.addColorStop(1,hexA(this.colors[2],0));
    ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*1.8,0,Math.PI*2); ctx.fillStyle=gw; ctx.fill();
    ctx.filter=`blur(${mB}px)`;
    const md=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*1.2);
    md.addColorStop(0,hexA(this.colors[0],221*intensity)); md.addColorStop(0.7,hexA(this.colors[1],170*intensity)); md.addColorStop(1,hexA(this.colors[2],68*intensity));
    ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*1.2,0,Math.PI*2); ctx.fillStyle=md; ctx.fill();
    ctx.filter=`blur(${cB}px)`;
    const cr=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*0.9);
    cr.addColorStop(0,hexA(this.colors[0],255*intensity)); cr.addColorStop(0.7,hexA(this.colors[1],238*intensity)); cr.addColorStop(1,hexA(this.colors[2],153*intensity));
    ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*0.9,0,Math.PI*2); ctx.fillStyle=cr; ctx.fill();
    ctx.filter='none'; ctx.restore();
  }
  drawCloverSVG() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const target = this.radius * 2.2;
    const scale  = target / CLOVER_VIEWBOX;
    ctx.translate(this.x, this.y); ctx.scale(scale, scale); ctx.translate(-CLOVER_CENTER, -CLOVER_CENTER);
    const intensity = this.glowIntensity;
    ctx.filter = this.isBottomIcon ? 'blur(10px)' : (currentStage===2 ? 'blur(14px)' : 'blur(26px)');
    const g1 = ctx.createRadialGradient(CLOVER_CENTER,CLOVER_CENTER,0,CLOVER_CENTER,CLOVER_CENTER,70);
    if (this.isBottomIcon) { g1.addColorStop(0,'rgba(255,255,255,0.35)'); g1.addColorStop(0.6,'rgba(200,200,200,0.18)'); g1.addColorStop(1,'rgba(120,120,120,0)'); }
    else { g1.addColorStop(0,hexA(this.colors[0],80*intensity)); g1.addColorStop(0.6,hexA(this.colors[1],50*intensity)); g1.addColorStop(1,hexA(this.colors[2],0)); }
    ctx.fillStyle = g1; ctx.fill(CLOVER_PATH);
    ctx.filter = this.isBottomIcon ? 'blur(5px)' : (currentStage===2 ? 'blur(7px)' : 'blur(10px)');
    const g2 = ctx.createRadialGradient(CLOVER_CENTER,CLOVER_CENTER,0,CLOVER_CENTER,CLOVER_CENTER,55);
    if (this.isBottomIcon) { g2.addColorStop(0,'rgba(255,255,255,0.95)'); g2.addColorStop(0.7,'rgba(220,220,220,0.65)'); g2.addColorStop(1,'rgba(180,180,180,0.15)'); }
    else { g2.addColorStop(0,hexA(this.colors[0],255*intensity)); g2.addColorStop(0.7,hexA(this.colors[1],235*intensity)); g2.addColorStop(1,hexA(this.colors[2],140*intensity)); }
    ctx.fillStyle = g2; ctx.fill(CLOVER_PATH);
    ctx.filter='none'; ctx.restore();
  }
  drawHeart() {
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const size=this.radius*0.8, intensity=this.glowIntensity;
    const b1=this.isBottomIcon?'blur(8px)':(currentStage===2?'blur(12px)':'blur(25px)');
    const b2=this.isBottomIcon?'blur(4px)':(currentStage===2?'blur(6px)':'blur(8px)');
    const parts=[
      {cx:this.x-size*0.5,cy:this.y-size*0.3,r:size*0.65,gr:size*1.0,c0:this.colors[0],c1:this.colors[1],c2:this.colors[2]},
      {cx:this.x+size*0.5,cy:this.y-size*0.3,r:size*0.65,gr:size*1.0,c0:this.colors[1],c1:this.colors[2],c2:this.colors[0]}
    ];
    for (const p of parts) {
      ctx.filter=b1;
      const g1=ctx.createRadialGradient(p.cx,p.cy,0,p.cx,p.cy,p.gr);
      if(this.isBottomIcon){g1.addColorStop(0,'#dddddd');g1.addColorStop(0.5,'#999999');g1.addColorStop(1,'#55555500');}
      else{g1.addColorStop(0,hexA(p.c0,68*intensity));g1.addColorStop(0.5,hexA(p.c1,51*intensity));g1.addColorStop(1,hexA(p.c2,0));}
      ctx.beginPath();ctx.arc(p.cx,p.cy,p.gr,0,Math.PI*2);ctx.fillStyle=g1;ctx.fill();
      ctx.filter=b2;
      const g2=ctx.createRadialGradient(p.cx,p.cy,0,p.cx,p.cy,p.r);
      if(this.isBottomIcon){g2.addColorStop(0,'#ffffff');g2.addColorStop(0.6,'#cccccc');g2.addColorStop(1,'#888888');}
      else{g2.addColorStop(0,hexA(p.c0,255*intensity));g2.addColorStop(0.6,hexA(p.c1,255*intensity));g2.addColorStop(1,hexA(p.c2,204*intensity));}
      ctx.beginPath();ctx.arc(p.cx,p.cy,p.r,0,Math.PI*2);ctx.fillStyle=g2;ctx.fill();
    }
    ctx.filter=b1;
    const g3=ctx.createRadialGradient(this.x,this.y+size*0.3,0,this.x,this.y+size*0.3,size*1.5);
    if(this.isBottomIcon){g3.addColorStop(0,'#dddddd');g3.addColorStop(0.5,'#999999');g3.addColorStop(1,'#55555500');}
    else{g3.addColorStop(0,hexA(this.colors[2],68*intensity));g3.addColorStop(0.5,hexA(this.colors[0],51*intensity));g3.addColorStop(1,hexA(this.colors[1],0));}
    ctx.beginPath();ctx.moveTo(this.x-size*1.3,this.y-size*0.2);ctx.lineTo(this.x+size*1.3,this.y-size*0.2);ctx.lineTo(this.x,this.y+size*1.6);ctx.closePath();ctx.fillStyle=g3;ctx.fill();
    ctx.filter=b2;
    const g4=ctx.createRadialGradient(this.x,this.y+size*0.3,0,this.x,this.y+size*0.3,size*1.0);
    if(this.isBottomIcon){g4.addColorStop(0,'#ffffff');g4.addColorStop(0.5,'#cccccc');g4.addColorStop(1,'#888888');}
    else{g4.addColorStop(0,hexA(this.colors[2],255*intensity));g4.addColorStop(0.5,hexA(this.colors[0],255*intensity));g4.addColorStop(1,hexA(this.colors[1],204*intensity));}
    ctx.beginPath();ctx.moveTo(this.x-size*1.0,this.y-size*0.1);ctx.lineTo(this.x+size*1.0,this.y-size*0.1);ctx.lineTo(this.x,this.y+size*1.3);ctx.closePath();ctx.fillStyle=g4;ctx.fill();
    ctx.filter='none';ctx.restore();
  }
  drawStar() {
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const spikes=5,outerR=this.radius*0.9,innerR=this.radius*0.4,intensity=this.glowIntensity;
    const b1=this.isBottomIcon?'blur(10px)':(currentStage===2?'blur(15px)':'blur(30px)');
    const b2=this.isBottomIcon?'blur(5px)':(currentStage===2?'blur(6px)':'blur(8px)');
    ctx.filter=b1;
    const g1=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,outerR*1.5);
    if(this.isBottomIcon){g1.addColorStop(0,'#eeeeee');g1.addColorStop(0.5,'#aaaaaa');g1.addColorStop(1,'#55555500');}
    else{g1.addColorStop(0,hexA(this.colors[0],85*intensity));g1.addColorStop(0.5,hexA(this.colors[1],68*intensity));g1.addColorStop(1,hexA(this.colors[2],0));}
    ctx.beginPath();
    for(let i=0;i<spikes*2;i++){const angle=(Math.PI*i)/spikes-Math.PI/2;const r=i%2===0?outerR*1.5:innerR*1.5;i===0?ctx.moveTo(this.x+Math.cos(angle)*r,this.y+Math.sin(angle)*r):ctx.lineTo(this.x+Math.cos(angle)*r,this.y+Math.sin(angle)*r);}
    ctx.closePath();ctx.fillStyle=g1;ctx.fill();
    ctx.filter=b2;
    const g2=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,outerR*1.1);
    if(this.isBottomIcon){g2.addColorStop(0,'#ffffff');g2.addColorStop(0.4,'#dddddd');g2.addColorStop(0.8,'#aaaaaa');g2.addColorStop(1,'#55555500');}
    else{g2.addColorStop(0,hexA(this.colors[0],255*intensity));g2.addColorStop(0.4,hexA(this.colors[1],255*intensity));g2.addColorStop(0.8,hexA(this.colors[2],238*intensity));g2.addColorStop(1,hexA(this.colors[0],0));}
    ctx.beginPath();
    for(let i=0;i<spikes*2;i++){const angle=(Math.PI*i)/spikes-Math.PI/2;const r=i%2===0?outerR:innerR;i===0?ctx.moveTo(this.x+Math.cos(angle)*r,this.y+Math.sin(angle)*r):ctx.lineTo(this.x+Math.cos(angle)*r,this.y+Math.sin(angle)*r);}
    ctx.closePath();ctx.fillStyle=g2;ctx.fill();
    ctx.filter='none';ctx.restore();
  }
  drawTriangle() {
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const size=this.radius*1.2,intensity=this.glowIntensity;
    const b1=this.isBottomIcon?'blur(10px)':(currentStage===2?'blur(15px)':'blur(30px)');
    const b2=this.isBottomIcon?'blur(5px)':(currentStage===2?'blur(8px)':'blur(10px)');
    ctx.filter=b1;
    const g1=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,size*1.5);
    if(this.isBottomIcon){g1.addColorStop(0,'#eeeeee');g1.addColorStop(0.5,'#aaaaaa');g1.addColorStop(1,'#55555500');}
    else{g1.addColorStop(0,hexA(this.colors[0],85*intensity));g1.addColorStop(0.5,hexA(this.colors[1],68*intensity));g1.addColorStop(1,hexA(this.colors[2],0));}
    ctx.beginPath();ctx.moveTo(this.x,this.y-size*1.3);ctx.lineTo(this.x-size*1.2,this.y+size*0.8);ctx.lineTo(this.x+size*1.2,this.y+size*0.8);ctx.closePath();ctx.fillStyle=g1;ctx.fill();
    ctx.filter=b2;
    const g2=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,size*1.0);
    if(this.isBottomIcon){g2.addColorStop(0,'#ffffff');g2.addColorStop(0.4,'#dddddd');g2.addColorStop(0.8,'#aaaaaa');g2.addColorStop(1,'#55555500');}
    else{g2.addColorStop(0,hexA(this.colors[0],255*intensity));g2.addColorStop(0.4,hexA(this.colors[1],255*intensity));g2.addColorStop(0.8,hexA(this.colors[2],238*intensity));g2.addColorStop(1,hexA(this.colors[0],0));}
    ctx.beginPath();ctx.moveTo(this.x,this.y-size);ctx.lineTo(this.x-size*0.9,this.y+size*0.6);ctx.lineTo(this.x+size*0.9,this.y+size*0.6);ctx.closePath();ctx.fillStyle=g2;ctx.fill();
    ctx.filter='none';ctx.restore();
  }
}

/* =========================================================
   LightBeam
========================================================= */
class LightBeam {
  constructor(startX,startY,endX,endY,colors){
    this.startX=startX;this.startY=startY;this.endX=endX;this.endY=endY;this.colors=colors;this.progress=0;
  }
  update(delta){this.progress+=delta*0.0008;return this.progress>=1;}
  draw(){
    const cx=this.startX+(this.endX-this.startX)*this.progress;
    const cy=this.startY+(this.endY-this.startY)*this.progress;
    ctx.save();ctx.globalCompositeOperation='lighter';
    const grad=ctx.createLinearGradient(this.startX,this.startY,cx,cy);
    grad.addColorStop(0,this.colors[0]+'ff');grad.addColorStop(0.5,this.colors[1]+'ff');grad.addColorStop(1,this.colors[2]+'ff');
    ctx.strokeStyle=grad;ctx.filter='blur(30px)';ctx.lineWidth=15;
    ctx.beginPath();ctx.moveTo(this.startX,this.startY);ctx.lineTo(cx,cy);ctx.stroke();
    ctx.filter='blur(10px)';ctx.lineWidth=8;
    ctx.beginPath();ctx.moveTo(this.startX,this.startY);ctx.lineTo(cx,cy);ctx.stroke();
    ctx.filter='none';ctx.restore();
  }
}

/* =========================================================
   Guide
========================================================= */
function showDragGuide() {
  if (guideShown) return;
  guideShown = true;
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  guide.innerHTML = currentStage===1
    ? `<div class="drag-guide-text">Drag the light to a time</div><div class="drag-arrow">↕</div>`
    : `<div class="drag-guide-text">Click a shape</div>`;
  document.getElementById('right-panel').appendChild(guide);
  setTimeout(() => guide.remove(), 3000);
}
function showSliderGuide() {
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  guide.innerHTML = `<div class="drag-guide-text">Drag the slider to adjust intensity</div>`;
  document.getElementById('right-panel').appendChild(guide);
  setTimeout(() => guide.remove(), 3000);
}

/* =========================================================
   Stage Init
========================================================= */
function initStage1() {
  const data = getStage1Data();
  stage1Blobs = {};
  for (const [key,d] of Object.entries(data)) {
    stage1Blobs[key] = new EnhancedBlob(d.position.x,d.position.y,85,d.colors,stage1Labels[key],'circle',false);
  }
  centerLight = new EnhancedBlob(W/2,H*0.45,70,['#FFFFFF','#F5F5F5','#E0E0E0'],'','circle',false);
  nextBtn.disabled = true;
  resetIdleTimer();
  setTimeout(() => showDragGuide(), 500);
  startDirectiveTimers();
}
function initStage2() {
  leftImage.src = 'art2.png';
  const data = getStage1Data();
  const sel = data[userChoices.time]?.colors || ['#FFFFFF','#F5F5F5','#E0E0E0'];
  const gray = ['#999999','#777777','#555555'];
  const sy = H*0.72, sr = 50;
  stage2Blobs = {};
  stage2Blobs['clover']   = new EnhancedBlob(W*0.25,sy,sr,gray,'','clover',true);
  stage2Blobs['star']     = new EnhancedBlob(W*0.42,sy,sr,gray,'','star',true);
  stage2Blobs['heart']    = new EnhancedBlob(W*0.58,sy,sr,gray,'','heart',true);
  stage2Blobs['triangle'] = new EnhancedBlob(W*0.75,sy,sr,gray,'','triangle',true);
  centerLight = new EnhancedBlob(W/2,H*0.35,90,sel,'','circle',false);
  nextBtn.disabled = true; guideShown = false;
  resetIdleTimer();
  setTimeout(() => showDragGuide(), 500);
  startDirectiveTimers();
}
function initStage3() {
  leftImage.src = 'art3.png';
  const data = getStage1Data();
  const sel = data[userChoices.time]?.colors || ['#FFFFFF','#F5F5F5','#E0E0E0'];
  centerLight = new EnhancedBlob(W/2,H*0.35,120,sel,'',userChoices.shape||'circle',false);
  lightIntensity = 0.5;
  centerLight.glowIntensity = 1.0;
  nextBtn.disabled = true;
  resetIdleTimer();
  setTimeout(() => showSliderGuide(), 500);
  startDirectiveTimers();
}

/* =========================================================
   Slider
========================================================= */
const SLIDER = { trackY:0, left:0, right:0, w:0, handleR:14, trackH:6 };

function computeSlider() {
  SLIDER.trackY = H * 0.68;
  SLIDER.w      = W * 0.54;
  SLIDER.left   = (W - SLIDER.w) / 2;
  SLIDER.right  = SLIDER.left + SLIDER.w;
  sliderX       = SLIDER.left + lightIntensity * SLIDER.w;
}
function drawSlider() {
  computeSlider();
  const { trackY, left, right, w, handleR } = SLIDER;
  const labelY = trackY + 20;
  const pad = 24;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.beginPath(); ctx.roundRect(left-pad, trackY-30, w+pad*2, 76, 14); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineWidth = SLIDER.trackH;
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.moveTo(left,trackY); ctx.lineTo(right,trackY); ctx.stroke();
  const fg = ctx.createLinearGradient(left,0,right,0);
  fg.addColorStop(0,'rgba(255,255,255,0.25)'); fg.addColorStop(0.5,'rgba(255,255,255,0.85)'); fg.addColorStop(1,'rgba(255,255,255,0.25)');
  ctx.strokeStyle = fg;
  ctx.beginPath(); ctx.moveTo(left,trackY); ctx.lineTo(left+lightIntensity*w,trackY); ctx.stroke();
  ctx.shadowColor='rgba(255,255,255,0.55)'; ctx.shadowBlur=20;
  ctx.fillStyle='#ffffff';
  ctx.beginPath(); ctx.arc(sliderX,trackY,handleR,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0; ctx.fillStyle='rgba(20,20,20,0.45)';
  ctx.beginPath(); ctx.arc(sliderX,trackY,4.5,0,Math.PI*2); ctx.fill();
  ctx.font='11px Helvetica Neue, Arial'; ctx.fillStyle='rgba(255,255,255,0.60)'; ctx.textBaseline='top';
  ctx.textAlign='left';  ctx.fillText('LOW',  left,  labelY);
  ctx.textAlign='right'; ctx.fillText('HIGH', right, labelY);
  ctx.restore();
}
function updateIntensity(v) {
  lightIntensity = Math.max(0, Math.min(1, v));
  if (centerLight) {
    centerLight.glowIntensity = 0.3 + lightIntensity * 1.4;
    centerLight.baseRadius    = 90  + lightIntensity * 60;
  }
  userChoices.intensity = lightIntensity;
  nextBtn.disabled = false;
}
function isOnSlider(x,y) {
  computeSlider();
  const { trackY, left, right, handleR } = SLIDER;
  return Math.hypot(x-sliderX,y-trackY) <= handleR+16
      || (y>=trackY-20 && y<=trackY+20 && x>=left-12 && x<=right+12);
}
function setSliderFromX(x) {
  computeSlider();
  updateIntensity((x-SLIDER.left)/SLIDER.w);
}

/* =========================================================
   Stage 1 animation
========================================================= */
function checkDrop() {
  for (const [key,blob] of Object.entries(stage1Blobs)) {
    if (Math.hypot(centerLight.x-blob.x,centerLight.y-blob.y) < blob.radius+centerLight.radius) {
      absorbColor(key,blob); return;
    }
  }
}
function absorbColor(timeKey,targetBlob) {
  isAnimating=true; userChoices.time=timeKey;
  const sx=centerLight.x,sy=centerLight.y,sr=centerLight.radius,dur=800,t0=Date.now();
  function step(){
    const p=Math.min((Date.now()-t0)/dur,1),e=easeInOutCubic(p);
    centerLight.x=sx+(targetBlob.x-sx)*e; centerLight.y=sy+(targetBlob.y-sy)*e; centerLight.radius=sr*(1-e*0.4);
    p<1?requestAnimationFrame(step):setTimeout(()=>changeColor(timeKey,sx,sy,sr),300);
  }
  step();
}
function changeColor(timeKey,ox,oy,or_){
  const nc=getStage1Data()[timeKey].colors,dur=1000,t0=Date.now();
  function step(){
    const p=Math.min((Date.now()-t0)/dur,1);
    centerLight.colors=nc; centerLight.radius=or_*(0.6+p*0.4);
    p<1?requestAnimationFrame(step):setTimeout(()=>returnToCenter(ox,oy,or_),200);
  }
  step();
}
function returnToCenter(ox,oy,or_){
  const dur=600,t0=Date.now(),sx=centerLight.x,sy=centerLight.y,tx=W/2,ty=H*0.45;
  function step(){
    const p=Math.min((Date.now()-t0)/dur,1),e=easeInOutCubic(p);
    centerLight.x=sx+(tx-sx)*e; centerLight.y=sy+(ty-sy)*e; centerLight.radius=or_;
    p<1?requestAnimationFrame(step):(isAnimating=false,nextBtn.disabled=false);
  }
  step();
}

/* =========================================================
   Stage 2 animation
========================================================= */
function shootLight(shapeKey,targetBlob) {
  isAnimating=true; userChoices.shape=shapeKey;
  lightBeam=new LightBeam(centerLight.x,centerLight.y,targetBlob.x,targetBlob.y,centerLight.colors);
  const t0=Date.now();
  function phase1(){
    const done=lightBeam.update(Date.now()-t0);
    if(!done)requestAnimationFrame(phase1);
    else{lightBeam=null;setTimeout(()=>phase2(),200);}
  }
  function phase2(){
    const dur=1000,t1=Date.now();
    function step(){
      const p=Math.min((Date.now()-t1)/dur,1);
      centerLight.shapeType=shapeKey;
      p<1?requestAnimationFrame(step):(isAnimating=false,nextBtn.disabled=false);
    }
    step();
  }
  phase1();
}

/* =========================================================
   Pointer Events
========================================================= */
canvas.style.touchAction = 'none';
function getPos(e){ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }

canvas.addEventListener('pointerdown', (e) => {
  resetIdleTimer();
  if (isAnimating) return;
  const {x,y} = getPos(e);
  if (currentStage===1) {
    if (Math.hypot(x-centerLight.x,y-centerLight.y) < centerLight.radius+20) {
      isDragging=true; canvas.style.cursor='grabbing'; canvas.setPointerCapture(e.pointerId);
    }
  } else if (currentStage===2) {
    for (const [key,blob] of Object.entries(stage2Blobs)) {
      if (Math.hypot(x-blob.x,y-blob.y) < blob.radius+30) { shootLight(key,blob); return; }
    }
  } else if (currentStage===3) {
    if (isOnSlider(x,y)) { sliderDragging=true; setSliderFromX(x); canvas.setPointerCapture(e.pointerId); }
  }
});
canvas.addEventListener('pointermove', (e) => {
  const {x,y} = getPos(e);
  if (currentStage===1 && isDragging && !isAnimating) { centerLight.x=x; centerLight.y=y; }
  else if (currentStage===3 && sliderDragging) { setSliderFromX(x); }
});
canvas.addEventListener('pointerup', (e) => {
  if (currentStage===1 && isDragging) { isDragging=false; canvas.style.cursor='default'; checkDrop(); }
  sliderDragging=false;
  try { canvas.releasePointerCapture(e.pointerId); } catch(_) {}
});

/* =========================================================
   Animate
========================================================= */
function animate() {
  if (!popupEl && !fairyEl) checkIdle();

  ctx.save();
  ctx.globalCompositeOperation='source-over'; ctx.filter='none'; ctx.globalAlpha=1;
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  ctx.restore();

  const time = Date.now();
  if (currentStage===1) {
    for (const b of Object.values(stage1Blobs)) { b.update(time); b.draw(); }
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  } else if (currentStage===2) {
    for (const b of Object.values(stage2Blobs)) { b.update(time); b.draw(); }
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  } else if (currentStage===3) {
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  }
  if (lightBeam) lightBeam.draw();
  if (currentStage===3) {
    ctx.save();
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.filter='none';
    drawSlider();
    ctx.restore();
  }
  requestAnimationFrame(animate);
}

/* =========================================================
   Next
========================================================= */
nextBtn.disabled = true;
nextBtn.addEventListener('click', () => {
  resetIdleTimer();
  if (currentStage===1)      { currentStage=2; initStage2(); }
  else if (currentStage===2) { currentStage=3; initStage3(); }
  else if (currentStage===3) {
    alert(`Complete!\nTime: ${userChoices.time}\nShape: ${userChoices.shape}\nIntensity: ${(userChoices.intensity??0).toFixed(2)}`);
  }
});

/* =========================================================
   Resize
========================================================= */
window.addEventListener('resize', () => {
  resizeCanvas();
  if      (currentStage===1) initStage1();
  else if (currentStage===2) initStage2();
  else if (currentStage===3) initStage3();
});

/* =========================================================
   Opening
========================================================= */
function startOpening() {
  clearTimeout(directive2Timer);

  const overlay = document.createElement('div');
  overlay.id = 'opening-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:#000;
    display:flex;align-items:center;justify-content:center;
    z-index:9999;opacity:1;transition:opacity 0.8s ease;
  `;
  const img = document.createElement('img');
  img.src = 'light.png';
  img.style.cssText = `max-width:100%;max-height:100%;object-fit:contain;display:block;`;
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  const audio = new Audio('light.mp3');
  audio.play().catch(() => {
    overlay.style.cursor = 'pointer';
    overlay.addEventListener('click', () => audio.play(), { once: true });
  });
  audio.addEventListener('ended', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      startBGM();   // ← 오프닝 끝나면 배경음악 시작
      initStage1();
      animate();
    }, 800);
  });
}

/* CSS 주입 */
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-6px)}
    80%{transform:translateX(6px)}
  }
`;
document.head.appendChild(styleEl);

startOpening();
