const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');
const leftImage = document.getElementById('leftImage');

/* =========================================================
   ✅ DPR(레티나) 대응 + 좌표계 통일 (CSS px 기준)
========================================================= */
let W = 0;
let H = 0;
let DPR = 1;

function resizeCanvas() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  W = canvas.offsetWidth;
  H = canvas.offsetHeight;

  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);

  // 이후 모든 그리기는 CSS 픽셀 좌표(W,H) 기준
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resizeCanvas();

/* =========================================================
   상태
========================================================= */
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
   Stage 데이터
========================================================= */
function getStage1Data() {
  return {
    '1pm': {
      colors: ['#FF6B9D', '#E91E63', '#C2185B'],
      position: { x: W * 0.25, y: H * 0.22 }
    },
    '5pm': {
      colors: ['#FFEAA7', '#FDD835', '#F9A825'],
      position: { x: W * 0.75, y: H * 0.22 }
    },
    '11pm': {
      colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'],
      position: { x: W * 0.25, y: H * 0.68 }
    },
    '7am': {
      colors: ['#74B9FF', '#42A5F5', '#1E88E5'],
      position: { x: W * 0.75, y: H * 0.68 }
    }
  };
}

const stage1Labels = {
  '1pm': '(1) 1:00 pm',
  '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm',
  '7am': '(4) 7:00 am'
};

/* =========================================================
   ✅ Clover SVG (Vector.svg) path 그대로
   viewBox: 0 0 106 106, 중심은 (53,53)
========================================================= */
const CLOVER_VIEWBOX = 106;
const CLOVER_CENTER = 53;
const CLOVER_SVG_D =
  'M97.4026 53.0522C103.659 48.4719 106.786 42.105 105.781 35.627C104.999 30.6005 100.643 26.0202 94.8327 23.8985C94.3865 23.6745 93.8273 23.5634 93.3811 23.4524C93.2701 23.4524 93.1571 23.3413 92.9349 23.3413C92.4887 23.2302 92.1536 23.1173 91.7055 23.1173C91.5945 23.1173 91.4815 23.1173 91.3 23.1173C90.9668 23.1173 90.6317 23.1173 90.2985 23.1173C89.8523 23.1173 89.4042 23.1173 88.958 23.2283C88.958 23.2283 88.958 23.2283 88.847 23.2283C88.2888 23.3394 87.7296 23.4505 87.1734 23.5634C86.6161 23.6745 86.0559 23.7856 85.5007 23.8985C82.7101 18.8719 78.2428 14.9634 72.7671 12.6178C70.0885 11.4995 67.2979 10.8281 64.5073 10.6041C63.8361 10.4912 63.166 10.4912 62.4948 10.4912C61.4896 10.4912 60.4844 10.6041 59.4792 10.7152C58.0262 10.9392 56.5743 11.1632 55.1213 11.6102C55.1213 11.6102 55.1213 11.6102 55.0103 11.6102C55.0103 11.6102 54.8991 11.6102 54.8991 11.6102C54.0068 11.8342 53.1135 12.1702 52.2201 12.5068C51.3268 12.1702 50.4334 11.8342 49.5411 11.6102C49.43 11.6102 49.3188 11.6102 49.2076 11.6102C49.2076 11.6102 49.2076 11.6102 49.0965 11.6102C47.6446 11.1632 46.1916 10.9392 44.7386 10.7152C43.7345 10.6041 42.7283 10.4912 41.7231 10.4912C41.053 10.4912 40.3818 10.4912 39.7116 10.6041C36.921 10.8281 34.1304 11.4995 31.4518 12.6178C25.9761 14.9634 21.5088 18.8719 18.7182 23.8985C18.163 23.7856 17.6028 23.6745 17.0455 23.5634C16.4893 23.4505 15.9301 23.3394 15.3719 23.2283C15.3719 23.2283 15.3719 23.2283 15.2609 23.2283C14.8147 23.1173 14.3666 23.1173 13.9204 23.1173C13.5872 23.1173 13.2521 23.1173 12.9189 23.1173C12.7374 23.1173 12.6244 23.1173 12.5134 23.1173C12.0653 23.1173 11.7302 23.2302 11.284 23.3413C11.0618 23.3413 10.9488 23.4524 10.8378 23.4524C10.3916 23.5634 9.83238 23.6745 9.3862 23.8985C3.57592 26.0202 -0.780828 30.6005 0.0014463 35.627C-1.00376 42.105 2.12225 48.4719 8.37922 53.0522C2.12225 57.6324 -1.00376 63.9993 0.0014463 70.4773C0.783721 75.5038 5.14047 80.0841 10.9507 82.2058C11.3969 82.4298 11.9561 82.541 12.4023 82.652C12.5134 82.652 12.6264 82.763 12.8486 82.763C13.2948 82.874 13.6299 82.987 14.078 82.987C14.1891 82.987 14.3021 82.987 14.4836 82.987C14.8167 82.987 15.1518 82.987 15.485 82.987C15.9312 82.987 16.3793 82.987 16.8255 82.876C16.8255 82.876 16.8255 82.876 16.9365 82.876C17.4947 82.765 18.0539 82.654 18.6101 82.541C19.1675 82.4298 19.7276 82.3187 20.2828 82.2058C23.0734 87.2324 27.5407 91.1409 33.0164 93.4865C35.695 94.6048 38.4856 95.2761 41.2762 95.5002C41.9474 95.6131 42.6175 95.6131 43.2887 95.6131C44.2939 95.6131 45.2991 95.5002 46.3043 95.3891C47.7573 95.1651 49.2092 94.9411 50.6622 94.4941C50.6622 94.4941 50.6622 94.4941 50.7732 94.4941C50.7732 94.4941 50.8844 94.4941 50.8844 94.4941C51.7767 94.2701 52.67 93.9341 53.5634 93.5975C54.4567 93.9341 55.3501 94.2701 56.2424 94.4941C56.3535 94.4941 56.4647 94.4941 56.5758 94.4941C56.5758 94.4941 56.5758 94.4941 56.6869 94.4941C58.1388 94.9411 59.5918 95.1651 61.0448 95.3891C62.0489 95.5002 63.0551 95.6131 64.0603 95.6131C64.7304 95.6131 65.4016 95.6131 66.0718 95.5002C68.8624 95.2761 71.653 94.6048 74.3316 93.4865C79.8073 91.1409 84.2746 87.2324 87.0652 82.2058C87.6204 82.3187 88.1806 82.4298 88.7379 82.541C89.2941 82.654 89.8533 82.765 90.4115 82.876C90.4115 82.876 90.4115 82.876 90.5225 82.876C90.9687 82.987 91.4168 82.987 91.863 82.987C92.1962 82.987 92.5313 82.987 92.8645 82.987C93.046 82.987 93.159 82.987 93.27 82.987C93.7181 82.987 94.0532 82.874 94.4994 82.763C94.7216 82.763 94.8346 82.652 94.9456 82.652C95.3918 82.541 95.951 82.4298 96.3972 82.2058C102.207 80.0841 106.564 75.5038 105.781 70.4773C106.786 63.9993 103.659 57.6324 97.4026 53.0522Z';
const CLOVER_PATH = new Path2D(CLOVER_SVG_D);

/* =========================================================
   Blob 클래스
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
    if (this.shapeType === 'circle') this.drawCircle();
    else if (this.shapeType === 'clover') this.drawCloverSVG();
    else if (this.shapeType === 'heart') this.drawHeart();
    else if (this.shapeType === 'star') this.drawStar();
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

  /* ---------- Circle ---------- */
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
      ctx.restore();
      return;
    }

    const bigBlur = currentStage === 2 ? 25 : 60;
    const midBlur = currentStage === 2 ? 15 : 35;
    const coreBlur = currentStage === 2 ? 10 : 20;

    ctx.filter = `blur(${bigBlur}px)`;
    const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.8);
    glowGradient.addColorStop(0, this.colors[0] + Math.floor(102 * intensity).toString(16).padStart(2, '0'));
    glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
    glowGradient.addColorStop(1, this.colors[2] + '00');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.filter = `blur(${midBlur}px)`;
    const midGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.2);
    midGradient.addColorStop(0, this.colors[0] + Math.floor(221 * intensity).toString(16).padStart(2, '0'));
    midGradient.addColorStop(0.7, this.colors[1] + Math.floor(170 * intensity).toString(16).padStart(2, '0'));
    midGradient.addColorStop(1, this.colors[2] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = midGradient;
    ctx.fill();

    ctx.filter = `blur(${coreBlur}px)`;
    const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.9);
    coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
    coreGradient.addColorStop(0.7, this.colors[1] + Math.floor(238 * intensity).toString(16).padStart(2, '0'));
    coreGradient.addColorStop(1, this.colors[2] + Math.floor(153 * intensity).toString(16).padStart(2, '0'));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  /* ---------- ✅ Clover (Vector.svg) ---------- */
  drawCloverSVG() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 스케일: viewBox(106) 기준 → radius에 맞춤
    const target = this.radius * 2.2; // 전체 크기 조절
    const scale = target / CLOVER_VIEWBOX;

    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.translate(-CLOVER_CENTER, -CLOVER_CENTER);

    const intensity = this.glowIntensity;

    // glow
    ctx.filter = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(14px)' : 'blur(26px)');
    let g1 = ctx.createRadialGradient(CLOVER_CENTER, CLOVER_CENTER, 0, CLOVER_CENTER, CLOVER_CENTER, 70);
    if (this.isBottomIcon) {
      g1.addColorStop(0, 'rgba(255,255,255,0.35)');
      g1.addColorStop(0.6, 'rgba(200,200,200,0.18)');
      g1.addColorStop(1, 'rgba(120,120,120,0.0)');
    } else {
      g1.addColorStop(0, hexA(this.colors[0], 80 * intensity));
      g1.addColorStop(0.6, hexA(this.colors[1], 50 * intensity));
      g1.addColorStop(1, hexA(this.colors[2], 0));
    }
    ctx.fillStyle = g1;
    ctx.fill(CLOVER_PATH);

    // core
    ctx.filter = this.isBottomIcon ? 'blur(5px)' : (currentStage === 2 ? 'blur(7px)' : 'blur(10px)');
    let g2 = ctx.createRadialGradient(CLOVER_CENTER, CLOVER_CENTER, 0, CLOVER_CENTER, CLOVER_CENTER, 55);
    if (this.isBottomIcon) {
      g2.addColorStop(0, 'rgba(255,255,255,0.95)');
      g2.addColorStop(0.7, 'rgba(220,220,220,0.65)');
      g2.addColorStop(1, 'rgba(180,180,180,0.15)');
    } else {
      g2.addColorStop(0, hexA(this.colors[0], 255 * intensity));
      g2.addColorStop(0.7, hexA(this.colors[1], 235 * intensity));
      g2.addColorStop(1, hexA(this.colors[2], 140 * intensity));
    }
    ctx.fillStyle = g2;
    ctx.fill(CLOVER_PATH);

    ctx.filter = 'none';
    ctx.restore();
  }

  /* ---------- Heart (원본) ---------- */
  drawHeart() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const size = this.radius * 0.8;
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(8px)' : (currentStage === 2 ? 'blur(12px)' : 'blur(25px)');
    const coreBlur = this.isBottomIcon ? 'blur(4px)' : (currentStage === 2 ? 'blur(6px)' : 'blur(8px)');

    ctx.filter = blurAmount;
    const glow1 = ctx.createRadialGradient(this.x - size * 0.5, this.y - size * 0.3, 0, this.x - size * 0.5, this.y - size * 0.3, size * 1.0);
    if (this.isBottomIcon) {
      glow1.addColorStop(0, '#dddddd');
      glow1.addColorStop(0.5, '#999999');
      glow1.addColorStop(1, '#55555500');
    } else {
      glow1.addColorStop(0, this.colors[0] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glow1.addColorStop(0.5, this.colors[1] + Math.floor(51 * intensity).toString(16).padStart(2, '0'));
      glow1.addColorStop(1, this.colors[2] + '00');
    }
    ctx.beginPath();
    ctx.arc(this.x - size * 0.5, this.y - size * 0.3, size * 1.0, 0, Math.PI * 2);
    ctx.fillStyle = glow1;
    ctx.fill();

    ctx.filter = coreBlur;
    const core1 = ctx.createRadialGradient(this.x - size * 0.5, this.y - size * 0.3, 0, this.x - size * 0.5, this.y - size * 0.3, size * 0.65);
    if (this.isBottomIcon) {
      core1.addColorStop(0, '#ffffff');
      core1.addColorStop(0.6, '#cccccc');
      core1.addColorStop(1, '#888888');
    } else {
      core1.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core1.addColorStop(0.6, this.colors[1] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core1.addColorStop(1, this.colors[2] + Math.floor(204 * intensity).toString(16).padStart(2, '0'));
    }
    ctx.beginPath();
    ctx.arc(this.x - size * 0.5, this.y - size * 0.3, size * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = core1;
    ctx.fill();

    ctx.filter = blurAmount;
    const glow2 = ctx.createRadialGradient(this.x + size * 0.5, this.y - size * 0.3, 0, this.x + size * 0.5, this.y - size * 0.3, size * 1.0);
    if (this.isBottomIcon) {
      glow2.addColorStop(0, '#dddddd');
      glow2.addColorStop(0.5, '#999999');
      glow2.addColorStop(1, '#55555500');
    } else {
      glow2.addColorStop(0, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glow2.addColorStop(0.5, this.colors[2] + Math.floor(51 * intensity).toString(16).padStart(2, '0'));
      glow2.addColorStop(1, this.colors[0] + '00');
    }
    ctx.beginPath();
    ctx.arc(this.x + size * 0.5, this.y - size * 0.3, size * 1.0, 0, Math.PI * 2);
    ctx.fillStyle = glow2;
    ctx.fill();

    ctx.filter = coreBlur;
    const core2 = ctx.createRadialGradient(this.x + size * 0.5, this.y - size * 0.3, 0, this.x + size * 0.5, this.y - size * 0.3, size * 0.65);
    if (this.isBottomIcon) {
      core2.addColorStop(0, '#ffffff');
      core2.addColorStop(0.6, '#cccccc');
      core2.addColorStop(1, '#888888');
    } else {
      core2.addColorStop(0, this.colors[1] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core2.addColorStop(0.6, this.colors[2] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core2.addColorStop(1, this.colors[0] + Math.floor(204 * intensity).toString(16).padStart(2, '0'));
    }
    ctx.beginPath();
    ctx.arc(this.x + size * 0.5, this.y - size * 0.3, size * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = core2;
    ctx.fill();

    ctx.filter = blurAmount;
    const glow3 = ctx.createRadialGradient(this.x, this.y + size * 0.3, 0, this.x, this.y + size * 0.3, size * 1.5);
    if (this.isBottomIcon) {
      glow3.addColorStop(0, '#dddddd');
      glow3.addColorStop(0.5, '#999999');
      glow3.addColorStop(1, '#55555500');
    } else {
      glow3.addColorStop(0, this.colors[2] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glow3.addColorStop(0.5, this.colors[0] + Math.floor(51 * intensity).toString(16).padStart(2, '0'));
      glow3.addColorStop(1, this.colors[1] + '00');
    }
    ctx.beginPath();
    ctx.moveTo(this.x - size * 1.3, this.y - size * 0.2);
    ctx.lineTo(this.x + size * 1.3, this.y - size * 0.2);
    ctx.lineTo(this.x, this.y + size * 1.6);
    ctx.closePath();
    ctx.fillStyle = glow3;
    ctx.fill();

    ctx.filter = coreBlur;
    const core3 = ctx.createRadialGradient(this.x, this.y + size * 0.3, 0, this.x, this.y + size * 0.3, size * 1.0);
    if (this.isBottomIcon) {
      core3.addColorStop(0, '#ffffff');
      core3.addColorStop(0.5, '#cccccc');
      core3.addColorStop(1, '#888888');
    } else {
      core3.addColorStop(0, this.colors[2] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core3.addColorStop(0.5, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      core3.addColorStop(1, this.colors[1] + Math.floor(204 * intensity).toString(16).padStart(2, '0'));
    }
    ctx.beginPath();
    ctx.moveTo(this.x - size * 1.0, this.y - size * 0.1);
    ctx.lineTo(this.x + size * 1.0, this.y - size * 0.1);
    ctx.lineTo(this.x, this.y + size * 1.3);
    ctx.closePath();
    ctx.fillStyle = core3;
    ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  /* ---------- Star (원본) ---------- */
  drawStar() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const spikes = 5;
    const outerRadius = this.radius * 0.9;
    const innerRadius = this.radius * 0.4;
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(15px)' : 'blur(30px)');
    const coreBlur = this.isBottomIcon ? 'blur(5px)' : (currentStage === 2 ? 'blur(6px)' : 'blur(8px)');

    ctx.filter = blurAmount;
    const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerRadius * 1.5);
    if (this.isBottomIcon) {
      glowGradient.addColorStop(0, '#eeeeee');
      glowGradient.addColorStop(0.5, '#aaaaaa');
      glowGradient.addColorStop(1, '#55555500');
    } else {
      glowGradient.addColorStop(0, this.colors[0] + Math.floor(85 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(1, this.colors[2] + '00');
    }
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius * 1.5 : innerRadius * 1.5;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.filter = coreBlur;
    const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, outerRadius * 1.1);
    if (this.isBottomIcon) {
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.4, '#dddddd');
      coreGradient.addColorStop(0.8, '#aaaaaa');
      coreGradient.addColorStop(1, '#55555500');
    } else {
      coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.4, this.colors[1] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.8, this.colors[2] + Math.floor(238 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(1, this.colors[0] + '00');
    }
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }

  /* ---------- Triangle (원본) ---------- */
  drawTriangle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const size = this.radius * 1.2;
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(15px)' : 'blur(30px)');
    const coreBlur = this.isBottomIcon ? 'blur(5px)' : (currentStage === 2 ? 'blur(8px)' : 'blur(10px)');

    ctx.filter = blurAmount;
    const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.5);
    if (this.isBottomIcon) {
      glowGradient.addColorStop(0, '#eeeeee');
      glowGradient.addColorStop(0.5, '#aaaaaa');
      glowGradient.addColorStop(1, '#55555500');
    } else {
      glowGradient.addColorStop(0, this.colors[0] + Math.floor(85 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(1, this.colors[2] + '00');
    }
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size * 1.3);
    ctx.lineTo(this.x - size * 1.2, this.y + size * 0.8);
    ctx.lineTo(this.x + size * 1.2, this.y + size * 0.8);
    ctx.closePath();
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.filter = coreBlur;
    const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.0);
    if (this.isBottomIcon) {
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.4, '#dddddd');
      coreGradient.addColorStop(0.8, '#aaaaaa');
      coreGradient.addColorStop(1, '#55555500');
    } else {
      coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.4, this.colors[1] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.8, this.colors[2] + Math.floor(238 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(1, this.colors[0] + '00');
    }
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size);
    ctx.lineTo(this.x - size * 0.9, this.y + size * 0.6);
    ctx.lineTo(this.x + size * 0.9, this.y + size * 0.6);
    ctx.closePath();
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.filter = 'none';
    ctx.restore();
  }
}

/* =========================================================
   LightBeam
========================================================= */
class LightBeam {
  constructor(startX, startY, endX, endY, colors) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.colors = colors;
    this.progress = 0;
  }

  update(delta) {
    this.progress += delta * 0.0008;
    return this.progress >= 1;
  }

  draw() {
    const currentX = this.startX + (this.endX - this.startX) * this.progress;
    const currentY = this.startY + (this.endY - this.startY) * this.progress;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(30px)';
    const gradient = ctx.createLinearGradient(this.startX, this.startY, currentX, currentY);
    gradient.addColorStop(0, this.colors[0] + 'ff');
    gradient.addColorStop(0.5, this.colors[1] + 'ff');
    gradient.addColorStop(1, this.colors[2] + 'ff');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.filter = 'blur(10px)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.filter = 'none';
    ctx.restore();
  }
}

/* =========================================================
   가이드
========================================================= */
function showDragGuide() {
  if (guideShown) return;
  guideShown = true;
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  if (currentStage === 1) {
    guide.innerHTML = `<div class="drag-guide-text">Drag the light to a time</div><div class="drag-arrow">↕</div>`;
  } else {
    guide.innerHTML = `<div class="drag-guide-text">Click a shape</div>`;
  }
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
   Stage init
========================================================= */
function initStage1() {
  const stage1Data = getStage1Data();
  stage1Blobs = {};
  for (const [key, data] of Object.entries(stage1Data)) {
    stage1Blobs[key] = new EnhancedBlob(
      data.position.x,
      data.position.y,
      85,
      data.colors,
      stage1Labels[key],
      'circle',
      false
    );
  }
  centerLight = new EnhancedBlob(W / 2, H * 0.45, 70, ['#FFFFFF', '#F5F5F5', '#E0E0E0'], '', 'circle', false);
  nextBtn.disabled = true;
  setTimeout(() => showDragGuide(), 500);
}

function initStage2() {
  leftImage.src = 'art2.png';

  const stage1Data = getStage1Data();
  const selectedColors = stage1Data[userChoices.time]?.colors || ['#FFFFFF', '#F5F5F5', '#E0E0E0'];

  stage2Blobs = {};
  const grayColors = ['#999999', '#777777', '#555555'];
  const shapeY = H * 0.72;
  const shapeRadius = 50;

  stage2Blobs['clover'] = new EnhancedBlob(W * 0.25, shapeY, shapeRadius, grayColors, '', 'clover', true);
  stage2Blobs['star'] = new EnhancedBlob(W * 0.42, shapeY, shapeRadius, grayColors, '', 'star', true);
  stage2Blobs['heart'] = new EnhancedBlob(W * 0.58, shapeY, shapeRadius, grayColors, '', 'heart', true);
  stage2Blobs['triangle'] = new EnhancedBlob(W * 0.75, shapeY, shapeRadius, grayColors, '', 'triangle', true);

  centerLight = new EnhancedBlob(W / 2, H * 0.35, 90, selectedColors, '', 'circle', false);

  nextBtn.disabled = true;
  setTimeout(() => showDragGuide(), 500);
}

function initStage3() {
  leftImage.src = 'art3.png';

  const stage1Data = getStage1Data();
  const selectedColors = stage1Data[userChoices.time]?.colors || ['#FFFFFF', '#F5F5F5', '#E0E0E0'];

  // ✅ shape 선택이 안 된 경우에도 빛이 보이도록 fallback
  const selectedShape = userChoices.shape || 'circle';

  centerLight = new EnhancedBlob(W / 2, H * 0.35, 120, selectedColors, '', selectedShape, false);

  lightIntensity = 0.5;
  centerLight.glowIntensity = 1.0;

  nextBtn.disabled = true;
  setTimeout(() => showSliderGuide(), 500);
}

/* =========================================================
   ✅ Slider UI
========================================================= */
const sliderUI = { y: 0, left: 0, right: 0, w: 0, h: 0, handleR: 14, trackH: 10 };

function computeSliderUI() {
  sliderUI.y = H * 0.72;
  sliderUI.w = W * 0.62;
  sliderUI.left = W * 0.19;
  sliderUI.right = sliderUI.left + sliderUI.w;
  sliderUI.h = 52; // 히트박스
  sliderUI.handleR = 14;
  sliderUI.trackH = 10;
  sliderX = sliderUI.left + lightIntensity * sliderUI.w;
}

function roundedRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function drawSlider() {
  computeSliderUI();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  const { left, right, w, y, trackH, handleR } = sliderUI;

  // HUD 배경
  const padX = 18;
  const boxW = w + padX * 2;
  const boxH = 88;
  const boxX = left - padX;
  const boxY = y - 52;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  roundedRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.fill();

  // base track line
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  // gradient fill
  const grad = ctx.createLinearGradient(left, 0, right, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0.20)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.80)');
  grad.addColorStop(1, 'rgba(255,255,255,0.20)');

  const fillW = Math.max(0, Math.min(w, lightIntensity * w));
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundedRect(ctx, left, y - trackH / 2, fillW, trackH, trackH / 2);
  ctx.fill();

  // ticks
  const ticks = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.30)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= ticks; i++) {
    const tx = left + (w * i) / ticks;
    const len = i === 0 || i === ticks ? 14 : 10;
    ctx.beginPath();
    ctx.moveTo(tx, y + 16);
    ctx.lineTo(tx, y + 16 + len);
    ctx.stroke();
  }

  // labels
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '12px Helvetica Neue, Arial';
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.fillText('LOW', left, y - 24);

  ctx.textAlign = 'right';
  ctx.fillText('HIGH', right, y - 24);

  // handle
  const hx = left + lightIntensity * w;
  sliderX = hx;

  ctx.shadowColor = 'rgba(255,255,255,0.55)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(hx, y, handleR, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(hx, y, 5, 0, Math.PI * 2);
  ctx.fill();

  // end caps
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(left, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(right, y, 6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function updateIntensity(v01) {
  lightIntensity = Math.max(0, Math.min(1, v01));

  if (centerLight) {
    centerLight.glowIntensity = 0.3 + lightIntensity * 1.4;

    // Stage3에서는 baseRadius 크게 키워서 UI 가리는 느낌 방지
    if (currentStage !== 3) {
      centerLight.baseRadius = 90 + lightIntensity * 60;
    }
  }

  userChoices.intensity = lightIntensity;
  nextBtn.disabled = false;
}

/* =========================================================
   ✅ Pointer Events (마우스/터치 통합) + slider hit test
========================================================= */
canvas.style.touchAction = 'none';

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function isOnSlider(x, y) {
  computeSliderUI();
  const { left, right, y: sy, h, handleR } = sliderUI;
  const inX = x >= left - 12 && x <= right + 12;
  const inY = y >= sy - h / 2 && y <= sy + h / 2;
  const nearHandle = Math.hypot(x - sliderX, y - sy) <= handleR + 18;
  return (inX && inY) || nearHandle;
}

function setSliderFromX(x) {
  computeSliderUI();
  updateIntensity((x - sliderUI.left) / sliderUI.w);
}

/* =========================================================
   Stage interactions
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

    if (progress < 1) requestAnimationFrame(animateAbsorb);
    else setTimeout(() => changeColor(timeKey, startX, startY, startRadius), 300);
  }
  animateAbsorb();
}

function changeColor(timeKey, originalX, originalY, originalRadius) {
  const newColors = getStage1Data()[timeKey].colors;
  const duration = 1000;
  const startTime = Date.now();

  function animateColor() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    centerLight.colors = newColors;
    centerLight.radius = originalRadius * (0.6 + progress * 0.4);
    if (progress < 1) requestAnimationFrame(animateColor);
    else setTimeout(() => returnToCenter(originalRadius), 200);
  }
  animateColor();
}

function returnToCenter(radius) {
  const duration = 600;
  const startTime = Date.now();
  const startX = centerLight.x;
  const startY = centerLight.y;
  const centerX = W / 2;
  const centerY = H * 0.45;

  function animateReturn() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    centerLight.x = startX + (centerX - startX) * eased;
    centerLight.y = startY + (centerY - startY) * eased;
    centerLight.radius = radius;
    if (progress < 1) requestAnimationFrame(animateReturn);
    else {
      isAnimating = false;
      nextBtn.disabled = false;
    }
  }
  animateReturn();
}

function shootLight(shapeKey, targetBlob) {
  isAnimating = true;
  userChoices.shape = shapeKey;

  lightBeam = new LightBeam(centerLight.x, centerLight.y, targetBlob.x, targetBlob.y, centerLight.colors);
  const phase1Start = Date.now();

  function animatePhase1() {
    const elapsed = Date.now() - phase1Start;
    const done = lightBeam.update(elapsed);
    if (!done) requestAnimationFrame(animatePhase1);
    else {
      lightBeam = null;
      setTimeout(() => animatePhase2(shapeKey), 200);
    }
  }

  function animatePhase2(shapeKey2) {
    const duration = 1000;
    const startTime = Date.now();
    function transform() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      centerLight.shapeType = shapeKey2;
      if (progress < 1) requestAnimationFrame(transform);
      else {
        isAnimating = false;
        nextBtn.disabled = false;
      }
    }
    transform();
  }

  animatePhase1();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* =========================================================
   Pointer handlers
========================================================= */
canvas.addEventListener('pointerdown', (e) => {
  if (isAnimating) return;
  const { x, y } = getPos(e);

  if (currentStage === 1) {
    const dist = Math.hypot(x - centerLight.x, y - centerLight.y);
    if (dist < centerLight.radius) {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
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

  if (currentStage === 1 && !isAnimating) {
    const dist = Math.hypot(x - centerLight.x, y - centerLight.y);
    if (!isDragging) canvas.style.cursor = dist < centerLight.radius ? 'grab' : 'default';
    if (isDragging) {
      centerLight.x = x;
      centerLight.y = y;
    }
  }

  if (currentStage === 3) {
    if (sliderDragging) setSliderFromX(x);
    else canvas.style.cursor = isOnSlider(x, y) ? 'pointer' : 'default';
  }
});

canvas.addEventListener('pointerup', (e) => {
  const { x, y } = getPos(e);

  if (currentStage === 1 && isDragging && !isAnimating) {
    isDragging = false;
    canvas.style.cursor = 'default';
    checkDrop();
  }

  if (currentStage === 2 && !isAnimating) {
    for (const [key, blob] of Object.entries(stage2Blobs)) {
      const dist = Math.hypot(x - blob.x, y - blob.y);
      if (dist < blob.radius + 30) {
        shootLight(key, blob);
        break;
      }
    }
  }

  if (currentStage === 3) sliderDragging = false;

  try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
});

/* =========================================================
   애니메이션
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

  if (currentStage === 1) {
    Object.values(stage1Blobs).forEach(b => { b.update(time); b.draw(); });
    centerLight.update(time); centerLight.draw();
  } else if (currentStage === 2) {
    Object.values(stage2Blobs).forEach(b => { b.update(time); b.draw(); });
    centerLight.update(time); centerLight.draw();
  } else if (currentStage === 3) {
    centerLight.update(time); centerLight.draw();
  }

  if (lightBeam) lightBeam.draw();

  if (currentStage === 3) drawSlider();

  requestAnimationFrame(animate);
}

/* =========================================================
   Next 버튼
========================================================= */
nextBtn.disabled = true;
nextBtn.addEventListener('click', () => {
  if (currentStage === 1) {
    currentStage = 2;
    guideShown = false;
    initStage2();
  } else if (currentStage === 2) {
    currentStage = 3;
    guideShown = false;
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

  // stage 재배치(선택 상태 유지)
  if (currentStage === 1) initStage1();
  else if (currentStage === 2) {
    // time 선택이 없으면 stage1로 복귀
    if (!userChoices.time) { currentStage = 1; initStage1(); }
    else initStage2();
  } else if (currentStage === 3) {
    if (!userChoices.time) { currentStage = 1; initStage1(); }
    else initStage3();
  }
});

/* =========================================================
   유틸: hex + alpha
========================================================= */
function hexA(hex, a255) {
  const a = Math.max(0, Math.min(255, Math.round(a255)));
  return hex + a.toString(16).padStart(2, '0');
}

/* =========================================================
   Start
========================================================= */
initStage1();
animate();
