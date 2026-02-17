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
   Stage 1 데이터
========================================================= */
function getStage1Data() {
  return {
    '1pm':  { colors: ['#FF6B9D', '#E91E63', '#C2185B'], position: { x: W * 0.25, y: H * 0.22 } },
    '5pm':  { colors: ['#FFEAA7', '#FDD835', '#F9A825'], position: { x: W * 0.75, y: H * 0.22 } },
    '11pm': { colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'], position: { x: W * 0.25, y: H * 0.68 } },
    '7am':  { colors: ['#74B9FF', '#42A5F5', '#1E88E5'], position: { x: W * 0.75, y: H * 0.68 } }
  };
}

const stage1Labels = {
  '1pm': '(1) 1:00 pm',
  '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm',
  '7am': '(4) 7:00 am'
};

/* =========================================================
   Util
========================================================= */
function hexA(hex, a255) {
  const a = Math.max(0, Math.min(255, Math.round(a255)));
  return hex + a.toString(16).padStart(2, '0');
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* =========================================================
   EnhancedBlob 클래스
========================================================= */
class EnhancedBlob {
  constructor(x, y, radius, colors, label, shapeType = 'circle', isBottomIcon = false) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.colors = colors;
    this.label = label;
    this.shapeType = shapeType;
    this.offset = Math.random() * Math.PI * 2;
    this.glowIntensity = 1.0;
    this.isBottomIcon = isBottomIcon;
  }

  update(time) {
    this.radius = this.baseRadius + Math.sin(time * 0.001 + this.offset) * 6;
  }

  draw() {
    if (this.shapeType === 'circle')        this.drawCircle();
    else if (this.shapeType === 'clover')   this.drawClover();
    else if (this.shapeType === 'heart')    this.drawHeart();
    else if (this.shapeType === 'star')     this.drawStar();
    else if (this.shapeType === 'triangle') this.drawTriangle();

    if (this.label) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = '14px Helvetica Neue, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(this.label, this.x, this.y + this.radius + 40);
      ctx.restore();
    }
  }

  drawCircle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const intensity = this.glowIntensity;

    if (this.isBottomIcon) {
      ctx.filter = 'blur(8px)';
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.2);
      gradient.addColorStop(0, '#eeeeee');
      gradient.addColorStop(0.7, '#aaaaaa');
      gradient.addColorStop(1, '#55555500');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
      return;
    }

    const bigBlur  = currentStage === 2 ? 25 : 60;
    const midBlur  = currentStage === 2 ? 15 : 35;
    const coreBlur = currentStage === 2 ? 10 : 20;

    ctx.filter = `blur(${bigBlur}px)`;
    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.8);
    glow.addColorStop(0,   hexA(this.colors[0], 102 * intensity));
    glow.addColorStop(0.5, hexA(this.colors[1],  68 * intensity));
    glow.addColorStop(1,   hexA(this.colors[2],   0));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.filter = `blur(${midBlur}px)`;
    const mid = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.2);
    mid.addColorStop(0,   hexA(this.colors[0], 221 * intensity));
    mid.addColorStop(0.7, hexA(this.colors[1], 170 * intensity));
    mid.addColorStop(1,   hexA(this.colors[2],  68 * intensity));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = mid;
    ctx.fill();

    ctx.filter = `blur(${coreBlur}px)`;
    const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.9);
    core.addColorStop(0,   hexA(this.colors[0], 255 * intensity));
    core.addColorStop(0.7, hexA(this.colors[1], 238 * intensity));
    core.addColorStop(1,   hexA(this.colors[2], 153 * intensity));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  drawClover() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const intensity = this.glowIntensity;
    const leafR = this.radius * 0.35;
    const leaves = [
      { x: this.x,              y: this.y - leafR * 1.6 },
      { x: this.x - leafR * 1.4, y: this.y + leafR * 0.2 },
      { x: this.x + leafR * 1.4, y: this.y + leafR * 0.2 }
    ];

    for (const lf of leaves) {
      const blur1 = this.isBottomIcon ? 'blur(8px)' : (currentStage === 2 ? 'blur(12px)' : 'blur(25px)');
      ctx.filter = blur1;
      const g1 = ctx.createRadialGradient(lf.x, lf.y, 0, lf.x, lf.y, leafR * 1.5);
      if (this.isBottomIcon) {
        g1.addColorStop(0, '#dddddd'); g1.addColorStop(0.5, '#999999'); g1.addColorStop(1, '#55555500');
      } else {
        g1.addColorStop(0, hexA(this.colors[0], 68 * intensity));
        g1.addColorStop(0.5, hexA(this.colors[1], 51 * intensity));
        g1.addColorStop(1, hexA(this.colors[2], 0));
      }
      ctx.beginPath(); ctx.arc(lf.x, lf.y, leafR * 1.5, 0, Math.PI * 2); ctx.fillStyle = g1; ctx.fill();

      const blur2 = this.isBottomIcon ? 'blur(4px)' : (currentStage === 2 ? 'blur(6px)' : 'blur(8px)');
      ctx.filter = blur2;
      const g2 = ctx.createRadialGradient(lf.x, lf.y, 0, lf.x, lf.y, leafR * 1.2);
      if (this.isBottomIcon) {
        g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.5, '#cccccc'); g2.addColorStop(1, '#888888');
      } else {
        g2.addColorStop(0, hexA(this.colors[0], 255 * intensity));
        g2.addColorStop(0.5, hexA(this.colors[1], 255 * intensity));
        g2.addColorStop(1, hexA(this.colors[2], 204 * intensity));
      }
      ctx.beginPath(); ctx.arc(lf.x, lf.y, leafR * 1.2, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();
    }

    // stem
    ctx.filter = 'blur(10px)';
    ctx.save();
    ctx.translate(this.x, this.y + leafR * 1.8);
    ctx.scale(0.4, 1);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, leafR * 1.2);
    if (this.isBottomIcon) {
      sg.addColorStop(0, '#eeeeee'); sg.addColorStop(0.8, '#aaaaaa'); sg.addColorStop(1, '#55555500');
    } else {
      sg.addColorStop(0, this.colors[0] + 'ff');
      sg.addColorStop(0.8, this.colors[1] + 'cc');
      sg.addColorStop(1, this.colors[2] + '00');
    }
    ctx.beginPath(); ctx.arc(0, 0, leafR * 1.2, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
    ctx.restore();
    ctx.filter = 'none';
    ctx.restore();
  }

  drawHeart() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const size = this.radius * 0.8;
    const intensity = this.glowIntensity;
    const blur1 = this.isBottomIcon ? 'blur(8px)'  : (currentStage === 2 ? 'blur(12px)' : 'blur(25px)');
    const blur2 = this.isBottomIcon ? 'blur(4px)'  : (currentStage === 2 ? 'blur(6px)'  : 'blur(8px)');

    const parts = [
      { cx: this.x - size * 0.5, cy: this.y - size * 0.3, r: size * 0.65, gr: size * 1.0,
        c0: this.colors[0], c1: this.colors[1], c2: this.colors[2] },
      { cx: this.x + size * 0.5, cy: this.y - size * 0.3, r: size * 0.65, gr: size * 1.0,
        c0: this.colors[1], c1: this.colors[2], c2: this.colors[0] }
    ];

    for (const p of parts) {
      ctx.filter = blur1;
      const g1 = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, p.gr);
      if (this.isBottomIcon) {
        g1.addColorStop(0,'#dddddd'); g1.addColorStop(0.5,'#999999'); g1.addColorStop(1,'#55555500');
      } else {
        g1.addColorStop(0, hexA(p.c0, 68 * intensity));
        g1.addColorStop(0.5, hexA(p.c1, 51 * intensity));
        g1.addColorStop(1, hexA(p.c2, 0));
      }
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.gr, 0, Math.PI * 2); ctx.fillStyle = g1; ctx.fill();

      ctx.filter = blur2;
      const g2 = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, p.r);
      if (this.isBottomIcon) {
        g2.addColorStop(0,'#ffffff'); g2.addColorStop(0.6,'#cccccc'); g2.addColorStop(1,'#888888');
      } else {
        g2.addColorStop(0, hexA(p.c0, 255 * intensity));
        g2.addColorStop(0.6, hexA(p.c1, 255 * intensity));
        g2.addColorStop(1, hexA(p.c2, 204 * intensity));
      }
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();
    }

    // bottom triangle
    ctx.filter = blur1;
    const g3 = ctx.createRadialGradient(this.x, this.y + size * 0.3, 0, this.x, this.y + size * 0.3, size * 1.5);
    if (this.isBottomIcon) {
      g3.addColorStop(0,'#dddddd'); g3.addColorStop(0.5,'#999999'); g3.addColorStop(1,'#55555500');
    } else {
      g3.addColorStop(0, hexA(this.colors[2], 68 * intensity));
      g3.addColorStop(0.5, hexA(this.colors[0], 51 * intensity));
      g3.addColorStop(1, hexA(this.colors[1], 0));
    }
    ctx.beginPath();
    ctx.moveTo(this.x - size * 1.3, this.y - size * 0.2);
    ctx.lineTo(this.x + size * 1.3, this.y - size * 0.2);
    ctx.lineTo(this.x, this.y + size * 1.6);
    ctx.closePath();
    ctx.fillStyle = g3; ctx.fill();

    ctx.filter = blur2;
    const g4 = ctx.createRadialGradient(this.x, this.y + size * 0.3, 0, this.x, this.y + size * 0.3, size * 1.0);
    if (this.isBottomIcon) {
      g4.addColorStop(0,'#ffffff'); g4.addColorStop(0.5,'#cccccc'); g4.addColorStop(1,'#888888');
    } else {
      g4.addColorStop(0, hexA(this.colors[2], 255 * intensity));
      g4.addColorStop(0.5, hexA(this.colors[0], 255 * intensity));
      g4.addColorStop(1, hexA(this.colors[1], 204 * intensity));
    }
    ctx.beginPath();
    ctx.moveTo(this.x - size * 1.0, this.y - size * 0.1);
    ctx.lineTo(this.x + size * 1.0, this.y - size * 0.1);
    ctx.lineTo(this.x, this.y + size * 1.3);
    ctx.closePath();
    ctx.fillStyle = g4; ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  drawStar() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const spikes = 5;
    const outerR = this.radius * 0.9;
    const innerR = this.radius * 0.4;
    const intensity = this.glowIntensity;
    const blur1 = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(15px)' : 'blur(30px)');
    const blur2 = this.isBottomIcon ? 'blur(5px)'  : (currentStage === 2 ? 'blur(6px)'  : 'blur(8px)');

    ctx.filter = blur1;
    const g1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerR * 1.5);
    if (this.isBottomIcon) {
      g1.addColorStop(0,'#eeeeee'); g1.addColorStop(0.5,'#aaaaaa'); g1.addColorStop(1,'#55555500');
    } else {
      g1.addColorStop(0, hexA(this.colors[0], 85 * intensity));
      g1.addColorStop(0.5, hexA(this.colors[1], 68 * intensity));
      g1.addColorStop(1, hexA(this.colors[2], 0));
    }
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const r = i % 2 === 0 ? outerR * 1.5 : innerR * 1.5;
      i === 0 ? ctx.moveTo(this.x + Math.cos(angle)*r, this.y + Math.sin(angle)*r)
              : ctx.lineTo(this.x + Math.cos(angle)*r, this.y + Math.sin(angle)*r);
    }
    ctx.closePath(); ctx.fillStyle = g1; ctx.fill();

    ctx.filter = blur2;
    const g2 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerR * 1.1);
    if (this.isBottomIcon) {
      g2.addColorStop(0,'#ffffff'); g2.addColorStop(0.4,'#dddddd');
      g2.addColorStop(0.8,'#aaaaaa'); g2.addColorStop(1,'#55555500');
    } else {
      g2.addColorStop(0,   hexA(this.colors[0], 255 * intensity));
      g2.addColorStop(0.4, hexA(this.colors[1], 255 * intensity));
      g2.addColorStop(0.8, hexA(this.colors[2], 238 * intensity));
      g2.addColorStop(1,   hexA(this.colors[0], 0));
    }
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      i === 0 ? ctx.moveTo(this.x + Math.cos(angle)*r, this.y + Math.sin(angle)*r)
              : ctx.lineTo(this.x + Math.cos(angle)*r, this.y + Math.sin(angle)*r);
    }
    ctx.closePath(); ctx.fillStyle = g2; ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  drawTriangle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const size = this.radius * 1.2;
    const intensity = this.glowIntensity;
    const blur1 = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(15px)' : 'blur(30px)');
    const blur2 = this.isBottomIcon ? 'blur(5px)'  : (currentStage === 2 ? 'blur(8px)'  : 'blur(10px)');

    ctx.filter = blur1;
    const g1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.5);
    if (this.isBottomIcon) {
      g1.addColorStop(0,'#eeeeee'); g1.addColorStop(0.5,'#aaaaaa'); g1.addColorStop(1,'#55555500');
    } else {
      g1.addColorStop(0, hexA(this.colors[0], 85 * intensity));
      g1.addColorStop(0.5, hexA(this.colors[1], 68 * intensity));
      g1.addColorStop(1, hexA(this.colors[2], 0));
    }
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size * 1.3);
    ctx.lineTo(this.x - size * 1.2, this.y + size * 0.8);
    ctx.lineTo(this.x + size * 1.2, this.y + size * 0.8);
    ctx.closePath(); ctx.fillStyle = g1; ctx.fill();

    ctx.filter = blur2;
    const g2 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.0);
    if (this.isBottomIcon) {
      g2.addColorStop(0,'#ffffff'); g2.addColorStop(0.4,'#dddddd');
      g2.addColorStop(0.8,'#aaaaaa'); g2.addColorStop(1,'#55555500');
    } else {
      g2.addColorStop(0,   hexA(this.colors[0], 255 * intensity));
      g2.addColorStop(0.4, hexA(this.colors[1], 255 * intensity));
      g2.addColorStop(0.8, hexA(this.colors[2], 238 * intensity));
      g2.addColorStop(1,   hexA(this.colors[0], 0));
    }
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size);
    ctx.lineTo(this.x - size * 0.9, this.y + size * 0.6);
    ctx.lineTo(this.x + size * 0.9, this.y + size * 0.6);
    ctx.closePath(); ctx.fillStyle = g2; ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }
}

/* =========================================================
   LightBeam
========================================================= */
class LightBeam {
  constructor(startX, startY, endX, endY, colors) {
    this.startX = startX; this.startY = startY;
    this.endX = endX;     this.endY = endY;
    this.colors = colors; this.progress = 0;
  }
  update(delta) { this.progress += delta * 0.0008; return this.progress >= 1; }
  draw() {
    const cx = this.startX + (this.endX - this.startX) * this.progress;
    const cy = this.startY + (this.endY - this.startY) * this.progress;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createLinearGradient(this.startX, this.startY, cx, cy);
    grad.addColorStop(0, this.colors[0]+'ff');
    grad.addColorStop(0.5, this.colors[1]+'ff');
    grad.addColorStop(1, this.colors[2]+'ff');
    ctx.strokeStyle = grad;
    ctx.filter = 'blur(30px)'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(this.startX, this.startY); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.filter = 'blur(10px)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(this.startX, this.startY); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.filter = 'none'; ctx.restore();
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
  guide.innerHTML = currentStage === 1
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
  for (const [key, d] of Object.entries(data)) {
    stage1Blobs[key] = new EnhancedBlob(d.position.x, d.position.y, 85, d.colors, stage1Labels[key], 'circle', false);
  }
  centerLight = new EnhancedBlob(W / 2, H * 0.45, 70, ['#FFFFFF', '#F5F5F5', '#E0E0E0'], '', 'circle', false);
  nextBtn.disabled = true;
  setTimeout(() => showDragGuide(), 500);
}

function initStage2() {
  leftImage.src = 'art2.png';
  const data = getStage1Data();
  const selectedColors = data[userChoices.time]?.colors || ['#FFFFFF', '#F5F5F5', '#E0E0E0'];
  const grayColors = ['#999999', '#777777', '#555555'];
  const shapeY = H * 0.72;
  const shapeR = 50;
  stage2Blobs = {};
  stage2Blobs['clover']   = new EnhancedBlob(W * 0.25, shapeY, shapeR, grayColors, '', 'clover',   true);
  stage2Blobs['star']     = new EnhancedBlob(W * 0.42, shapeY, shapeR, grayColors, '', 'star',     true);
  stage2Blobs['heart']    = new EnhancedBlob(W * 0.58, shapeY, shapeR, grayColors, '', 'heart',    true);
  stage2Blobs['triangle'] = new EnhancedBlob(W * 0.75, shapeY, shapeR, grayColors, '', 'triangle', true);
  centerLight = new EnhancedBlob(W / 2, H * 0.35, 90, selectedColors, '', 'circle', false);
  nextBtn.disabled = true;
  guideShown = false;
  setTimeout(() => showDragGuide(), 500);
}

function initStage3() {
  leftImage.src = 'art3.png';
  const data = getStage1Data();
  const selectedColors = data[userChoices.time]?.colors || ['#FFFFFF', '#F5F5F5', '#E0E0E0'];
  const selectedShape = userChoices.shape || 'circle';
  centerLight = new EnhancedBlob(W / 2, H * 0.35, 120, selectedColors, '', selectedShape, false);
  lightIntensity = 0.5;
  centerLight.glowIntensity = 1.0;
  nextBtn.disabled = true;
  setTimeout(() => showSliderGuide(), 500);
}

/* =========================================================
   Slider
========================================================= */
const sliderUI = { y: 0, left: 0, right: 0, w: 0, handleR: 8 };

function computeSliderUI() {
  sliderUI.y     = H * 0.68;
  sliderUI.w     = W * 0.5;
  sliderUI.left  = W * 0.25;
  sliderUI.right = sliderUI.left + sliderUI.w;
  sliderX = sliderUI.left + lightIntensity * sliderUI.w;
}

function drawSlider() {
  computeSliderUI();
  const { left, right, w, y, handleR } = sliderUI;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';

  // track
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  // left end cap
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.5)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(left, y, handleR, 0, Math.PI * 2);
  ctx.fill();

  // right end cap
  ctx.beginPath();
  ctx.arc(right, y, handleR, 0, Math.PI * 2);
  ctx.fill();

  // current position dot
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  ctx.arc(sliderX, y, 5, 0, Math.PI * 2);
  ctx.fill();

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

function isOnSlider(x, y) {
  computeSliderUI();
  const { left, right, y: sy } = sliderUI;
  return y >= sy - 25 && y <= sy + 25 && x >= left - 12 && x <= right + 12;
}

function setSliderFromX(x) {
  computeSliderUI();
  updateIntensity((x - sliderUI.left) / sliderUI.w);
}

/* =========================================================
   Stage 1: Drag & Drop
========================================================= */
function checkDrop() {
  for (const [key, blob] of Object.entries(stage1Blobs)) {
    const dist = Math.hypot(centerLight.x - blob.x, centerLight.y - blob.y);
    if (dist < blob.radius + centerLight.radius) {
      absorbColor(key, blob);
      return;
    }
  }
}

function absorbColor(timeKey, targetBlob) {
  isAnimating = true;
  userChoices.time = timeKey;
  const startX = centerLight.x, startY = centerLight.y, startR = centerLight.radius;
  const dur = 800, t0 = Date.now();
  function step() {
    const p = Math.min((Date.now() - t0) / dur, 1);
    const e = easeInOutCubic(p);
    centerLight.x = startX + (targetBlob.x - startX) * e;
    centerLight.y = startY + (targetBlob.y - startY) * e;
    centerLight.radius = startR * (1 - e * 0.4);
    if (p < 1) requestAnimationFrame(step);
    else setTimeout(() => changeColor(timeKey, startX, startY, startR), 300);
  }
  step();
}

function changeColor(timeKey, ox, oy, or_) {
  const newColors = getStage1Data()[timeKey].colors;
  const dur = 1000, t0 = Date.now();
  function step() {
    const p = Math.min((Date.now() - t0) / dur, 1);
    centerLight.colors = newColors;
    centerLight.radius = or_ * (0.6 + p * 0.4);
    if (p < 1) requestAnimationFrame(step);
    else setTimeout(() => returnToCenter(ox, oy, or_), 200);
  }
  step();
}

function returnToCenter(ox, oy, or_) {
  const dur = 600, t0 = Date.now();
  const sx = centerLight.x, sy = centerLight.y;
  const tx = W / 2, ty = H * 0.45;
  function step() {
    const p = Math.min((Date.now() - t0) / dur, 1);
    const e = easeInOutCubic(p);
    centerLight.x = sx + (tx - sx) * e;
    centerLight.y = sy + (ty - sy) * e;
    centerLight.radius = or_;
    if (p < 1) requestAnimationFrame(step);
    else { isAnimating = false; nextBtn.disabled = false; }
  }
  step();
}

/* =========================================================
   Stage 2: Shoot Light
========================================================= */
function shootLight(shapeKey, targetBlob) {
  isAnimating = true;
  userChoices.shape = shapeKey;
  lightBeam = new LightBeam(centerLight.x, centerLight.y, targetBlob.x, targetBlob.y, centerLight.colors);
  const t0 = Date.now();
  function phase1() {
    const done = lightBeam.update(Date.now() - t0);
    if (!done) requestAnimationFrame(phase1);
    else { lightBeam = null; setTimeout(() => phase2(), 200); }
  }
  function phase2() {
    const dur = 1000, t1 = Date.now();
    function step() {
      const p = Math.min((Date.now() - t1) / dur, 1);
      centerLight.shapeType = shapeKey;
      if (p < 1) requestAnimationFrame(step);
      else { isAnimating = false; nextBtn.disabled = false; }
    }
    step();
  }
  phase1();
}

/* =========================================================
   Pointer Events (통합)
========================================================= */
canvas.style.touchAction = 'none';

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
  if (isAnimating) return;
  const { x, y } = getPos(e);

  if (currentStage === 1) {
    const dist = Math.hypot(x - centerLight.x, y - centerLight.y);
    if (dist < centerLight.radius + 20) {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    }
  } else if (currentStage === 2) {
    for (const [key, blob] of Object.entries(stage2Blobs)) {
      const dist = Math.hypot(x - blob.x, y - blob.y);
      if (dist < blob.radius + 30) { shootLight(key, blob); return; }
    }
  } else if (currentStage === 3) {
    if (isOnSlider(x, y)) {
      sliderDragging = true;
      setSliderFromX(x);
      canvas.setPointerCapture(e.pointerId);
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  const { x, y } = getPos(e);
  if (currentStage === 1 && isDragging && !isAnimating) {
    centerLight.x = x;
    centerLight.y = y;
  } else if (currentStage === 3 && sliderDragging) {
    setSliderFromX(x);
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (currentStage === 1 && isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
    checkDrop();
  }
  sliderDragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
});

/* =========================================================
   Animate
========================================================= */
function animate() {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const time = Date.now();

  // ✅ Stage 1: 4개 시간 blob + 중앙 빛
  if (currentStage === 1) {
    for (const blob of Object.values(stage1Blobs)) {
      blob.update(time);
      blob.draw();
    }
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  }
  // ✅ Stage 2: 하단 shape blob + 중앙 빛
  else if (currentStage === 2) {
    for (const blob of Object.values(stage2Blobs)) {
      blob.update(time);
      blob.draw();
    }
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  }
  // ✅ Stage 3: 중앙 빛만
  else if (currentStage === 3) {
    if (centerLight) { centerLight.update(time); centerLight.draw(); }
  }

  if (lightBeam) lightBeam.draw();

  // ✅ 슬라이더: 항상 맨 마지막에 source-over로 (절대 안 묻힘)
  if (currentStage === 3) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    drawSlider();
    ctx.restore();
  }

  requestAnimationFrame(animate);
}

/* =========================================================
   Next 버튼
========================================================= */
nextBtn.disabled = true;
nextBtn.addEventListener('click', () => {
  if (currentStage === 1) {
    currentStage = 2;
    initStage2();
  } else if (currentStage === 2) {
    currentStage = 3;
    initStage3();
  } else if (currentStage === 3) {
    alert(`Complete!\nTime: ${userChoices.time}\nShape: ${userChoices.shape}\nIntensity: ${(userChoices.intensity ?? 0).toFixed(2)}`);
  }
});

/* =========================================================
   Resize
========================================================= */
window.addEventListener('resize', () => {
  resizeCanvas();
  if (currentStage === 1)      initStage1();
  else if (currentStage === 2) initStage2();
  else if (currentStage === 3) initStage3();
});

/* =========================================================
   Start
========================================================= */
initStage1();
animate();
