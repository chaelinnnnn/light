const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');
const leftImage = document.getElementById('leftImage');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let currentStage = 1;
let userChoices = {
  time: null,
  shape: null,
  intensity: null
};

// Stage 1 Data
const stage1Data = {
  '1pm': {
    colors: ['#FF6B9D', '#E91E63', '#C2185B'],
    position: { x: canvas.width * 0.25, y: canvas.height * 0.22 }
  },
  '5pm': {
    colors: ['#FFEAA7', '#FDD835', '#F9A825'],
    position: { x: canvas.width * 0.75, y: canvas.height * 0.22 }
  },
  '11pm': {
    colors: ['#FFB6C1', '#F8BBD0', '#E1BEE7'],
    position: { x: canvas.width * 0.25, y: canvas.height * 0.68 }
  },
  '7am': {
    colors: ['#74B9FF', '#42A5F5', '#1E88E5'],
    position: { x: canvas.width * 0.75, y: canvas.height * 0.68 }
  }
};

const stage1Labels = {
  '1pm': '(1) 1:00 pm',
  '5pm': '(2) 5:00 pm',
  '11pm': '(3) 11:00 pm',
  '7am': '(4) 7:00 am'
};

// Enhanced Blob Class
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
    
    // Label
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
  
  // Circle
  drawCircle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    const intensity = this.glowIntensity;
    
    if (this.isBottomIcon) {
      // Bottom icon: sharp and clear
      ctx.filter = 'blur(8px)';
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 1.2
      );
      gradient.addColorStop(0, '#eeeeee');
      gradient.addColorStop(0.7, '#aaaaaa');
      gradient.addColorStop(1, '#55555500');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    } else if (currentStage === 2) {
      // Stage 2 center light: sharper
      ctx.filter = 'blur(25px)';
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 1.5
      );
      glowGradient.addColorStop(0, this.colors[0] + Math.floor(102 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(1, this.colors[2] + '00');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      ctx.filter = 'blur(15px)';
      const midGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 1.1
      );
      midGradient.addColorStop(0, this.colors[0] + Math.floor(221 * intensity).toString(16).padStart(2, '0'));
      midGradient.addColorStop(0.7, this.colors[1] + Math.floor(170 * intensity).toString(16).padStart(2, '0'));
      midGradient.addColorStop(1, this.colors[2] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = midGradient;
      ctx.fill();
      
      ctx.filter = 'blur(10px)';
      const coreGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 0.9
      );
      coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.7, this.colors[1] + Math.floor(238 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(1, this.colors[2] + Math.floor(153 * intensity).toString(16).padStart(2, '0'));
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    } else {
      // Stage 1 & 3: original soft blur
      ctx.filter = 'blur(60px)';
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 1.8
      );
      glowGradient.addColorStop(0, this.colors[0] + Math.floor(102 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(1, this.colors[2] + '00');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      ctx.filter = 'blur(35px)';
      const midGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 1.2
      );
      midGradient.addColorStop(0, this.colors[0] + Math.floor(221 * intensity).toString(16).padStart(2, '0'));
      midGradient.addColorStop(0.7, this.colors[1] + Math.floor(170 * intensity).toString(16).padStart(2, '0'));
      midGradient.addColorStop(1, this.colors[2] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = midGradient;
      ctx.fill();
      
      ctx.filter = 'blur(20px)';
      const coreGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 0.9
      );
      coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.7, this.colors[1] + Math.floor(238 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(1, this.colors[2] + Math.floor(153 * intensity).toString(16).padStart(2, '0'));
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    }
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  // Clover
  drawClover() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    const leafRadius = this.radius * 0.35;
    
    this.drawClearLeaf(this.x, this.y - leafRadius * 1.6, leafRadius);
    this.drawClearLeaf(this.x - leafRadius * 1.4, this.y + leafRadius * 0.2, leafRadius);
    this.drawClearLeaf(this.x + leafRadius * 1.4, this.y + leafRadius * 0.2, leafRadius);
    
    const blurAmount = this.isBottomIcon ? 'blur(5px)' : 'blur(10px)';
    ctx.filter = blurAmount;
    ctx.save();
    ctx.translate(this.x, this.y + leafRadius * 1.8);
    ctx.scale(0.4, 1);
    
    const stemGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, leafRadius * 1.2);
    if (this.isBottomIcon) {
      stemGradient.addColorStop(0, '#eeeeee');
      stemGradient.addColorStop(0.8, '#aaaaaa');
      stemGradient.addColorStop(1, '#55555500');
    } else {
      stemGradient.addColorStop(0, this.colors[0] + 'ff');
      stemGradient.addColorStop(0.8, this.colors[1] + 'cc');
      stemGradient.addColorStop(1, this.colors[2] + '00');
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, leafRadius * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = stemGradient;
    ctx.fill();
    ctx.restore();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  drawClearLeaf(x, y, r) {
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(8px)' : (currentStage === 2 ? 'blur(12px)' : 'blur(25px)');
    
    ctx.filter = blurAmount;
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
    if (this.isBottomIcon) {
      glowGradient.addColorStop(0, '#dddddd');
      glowGradient.addColorStop(0.5, '#999999');
      glowGradient.addColorStop(1, '#55555500');
    } else {
      glowGradient.addColorStop(0, this.colors[0] + Math.floor(68 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(0.5, this.colors[1] + Math.floor(51 * intensity).toString(16).padStart(2, '0'));
      glowGradient.addColorStop(1, this.colors[2] + '00');
    }
    
    ctx.beginPath();
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    const coreBlur = this.isBottomIcon ? 'blur(4px)' : (currentStage === 2 ? 'blur(6px)' : 'blur(8px)');
    ctx.filter = coreBlur;
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.2);
    if (this.isBottomIcon) {
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.5, '#cccccc');
      coreGradient.addColorStop(1, '#888888');
    } else {
      coreGradient.addColorStop(0, this.colors[0] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(0.5, this.colors[1] + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
      coreGradient.addColorStop(1, this.colors[2] + Math.floor(204 * intensity).toString(16).padStart(2, '0'));
    }
    
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
  }
  
  // Heart
  drawHeart() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    const size = this.radius * 0.8;
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(8px)' : (currentStage === 2 ? 'blur(12px)' : 'blur(25px)');
    const coreBlur = this.isBottomIcon ? 'blur(4px)' : (currentStage === 2 ? 'blur(6px)' : 'blur(8px)');
    
    ctx.filter = blurAmount;
    const glow1 = ctx.createRadialGradient(
      this.x - size * 0.5, this.y - size * 0.3, 0,
      this.x - size * 0.5, this.y - size * 0.3, size * 1.0
    );
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
    const core1 = ctx.createRadialGradient(
      this.x - size * 0.5, this.y - size * 0.3, 0,
      this.x - size * 0.5, this.y - size * 0.3, size * 0.65
    );
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
    const glow2 = ctx.createRadialGradient(
      this.x + size * 0.5, this.y - size * 0.3, 0,
      this.x + size * 0.5, this.y - size * 0.3, size * 1.0
    );
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
    const core2 = ctx.createRadialGradient(
      this.x + size * 0.5, this.y - size * 0.3, 0,
      this.x + size * 0.5, this.y - size * 0.3, size * 0.65
    );
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
    const glow3 = ctx.createRadialGradient(
      this.x, this.y + size * 0.3, 0,
      this.x, this.y + size * 0.3, size * 1.5
    );
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
    const core3 = ctx.createRadialGradient(
      this.x, this.y + size * 0.3, 0,
      this.x, this.y + size * 0.3, size * 1.0
    );
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
  
  // Star
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
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, outerRadius * 1.5
    );
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
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    ctx.filter = coreBlur;
    const coreGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, outerRadius * 1.1
    );
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
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    ctx.filter = 'none';
    ctx.restore();
  }
  
  // Triangle
  drawTriangle() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    const size = this.radius * 1.2;
    const intensity = this.glowIntensity;
    const blurAmount = this.isBottomIcon ? 'blur(10px)' : (currentStage === 2 ? 'blur(15px)' : 'blur(30px)');
    const coreBlur = this.isBottomIcon ? 'blur(5px)' : (currentStage === 2 ? 'blur(8px)' : 'blur(10px)');
    
    ctx.filter = blurAmount;
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, size * 1.5
    );
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
    const coreGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, size * 1.0
    );
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

// Light Beam Class
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
    const gradient = ctx.createLinearGradient(
      this.startX, this.startY,
      currentX, currentY
    );
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
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    ctx.filter = 'none';
    ctx.restore();
  }
}

// Global Variables
let stage1Blobs = {};
let stage2Blobs = {};
let centerLight;
let isDragging = false;
let isAnimating = false;
let guideShown = false;
let lightBeam = null;
let lightIntensity = 0.5;
let sliderDragging = false;
let sliderX = 0;

// Stage 1 Initialization
function initStage1() {
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
  
  centerLight = new EnhancedBlob(
    canvas.width / 2,
    canvas.height * 0.45,
    70,
    ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
    '',
    'circle',
    false
  );
  
  setTimeout(() => showDragGuide(), 500);
}

// Stage 2 Initialization
function initStage2() {
  leftImage.src = 'art2.png';
  
  stage2Blobs = {};
  const selectedColors = stage1Data[userChoices.time].colors;
  const grayColors = ['#999999', '#777777', '#555555'];
  
  const shapeY = canvas.height * 0.72;
  const shapeRadius = 50;
  
  stage2Blobs['clover'] = new EnhancedBlob(
    canvas.width * 0.25,
    shapeY,
    shapeRadius,
    grayColors,
    '',
    'clover',
    true
  );
  
  stage2Blobs['star'] = new EnhancedBlob(
    canvas.width * 0.42,
    shapeY,
    shapeRadius,
    grayColors,
    '',
    'star',
    true
  );
  
  stage2Blobs['heart'] = new EnhancedBlob(
    canvas.width * 0.58,
    shapeY,
    shapeRadius,
    grayColors,
    '',
    'heart',
    true
  );
  
  stage2Blobs['triangle'] = new EnhancedBlob(
    canvas.width * 0.75,
    shapeY,
    shapeRadius,
    grayColors,
    '',
    'triangle',
    true
  );
  
  centerLight = new EnhancedBlob(
    canvas.width / 2,
    canvas.height * 0.35,
    90,
    selectedColors,
    '',
    'circle',
    false
  );
  
  nextBtn.disabled = true;
  setTimeout(() => showDragGuide(), 500);
}

// Stage 3 Initialization
function initStage3() {
  leftImage.src = 'art3.png';
  
  const selectedColors = stage1Data[userChoices.time].colors;
  const selectedShape = userChoices.shape;
  
  centerLight = new EnhancedBlob(
    canvas.width / 2,
    canvas.height * 0.30,
    90,
    selectedColors,
    '',
    selectedShape,
    false
  );
  
  lightIntensity = 0.5;
  centerLight.glowIntensity = 1.0;
  
  nextBtn.disabled = true;
  
  setTimeout(() => showSliderGuide(), 500);
}

// Drag Guide
function showDragGuide() {
  if (guideShown) return;
  guideShown = true;
  
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  
  if (currentStage === 1) {
    guide.innerHTML = `
      <div class="drag-guide-text">Drag the light to a time</div>
      <div class="drag-arrow">↕</div>
    `;
  } else {
    guide.innerHTML = `
      <div class="drag-guide-text">Click a shape</div>
    `;
  }
  
  document.getElementById('right-panel').appendChild(guide);
  
  setTimeout(() => {
    guide.remove();
  }, 3000);
}

// Slider Guide
function showSliderGuide() {
  const guide = document.createElement('div');
  guide.className = 'drag-guide';
  guide.innerHTML = `
    <div class="drag-guide-text">Drag the slider to adjust intensity</div>
  `;
  
  document.getElementById('right-panel').appendChild(guide);
  
  setTimeout(() => {
    guide.remove();
  }, 3000);
}

// Draw Slider
function drawSlider() {
  const sliderY = canvas.height * 0.75;
  const sliderWidth = canvas.width * 0.6;
  const sliderLeft = canvas.width * 0.2;
  const sliderRight = sliderLeft + sliderWidth;
  
  ctx.save();
  
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sliderLeft, sliderY);
  ctx.lineTo(sliderRight, sliderY);
  ctx.stroke();
  
  ctx.fillStyle = 'white';
  ctx.font = '14px Helvetica Neue, Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Calm, Decisive', sliderLeft, sliderY - 20);
  ctx.textAlign = 'right';
  ctx.fillText('Vibrant, Nuanced', sliderRight, sliderY - 20);
  
  sliderX = sliderLeft + lightIntensity * sliderWidth;
  
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(sliderX, sliderY, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Update Intensity
function updateIntensity(value) {
  lightIntensity = Math.max(0, Math.min(1, value));
  
  centerLight.glowIntensity = 0.4 + lightIntensity * 1.1;
  centerLight.baseRadius = 70 + lightIntensity * 35;
  
  nextBtn.disabled = false;
  
  userChoices.intensity = lightIntensity;
}

// Draw Example Lights
function drawExampleLights() {
  const exampleY = canvas.height * 0.30;
  const exampleRadius = 30;
  const spacing = 45;
  
  for (let i = 0; i < 4; i++) {
    const blob = new EnhancedBlob(
      canvas.width * 0.15 + i * spacing,
      exampleY,
      exampleRadius * 0.7,
      stage1Data[userChoices.time].colors,
      '',
      userChoices.shape,
      false
    );
    blob.glowIntensity = 0.4;
    blob.baseRadius = exampleRadius * 0.7;
    blob.draw();
  }
  
  for (let i = 0; i < 5; i++) {
    const blob = new EnhancedBlob(
      canvas.width * 0.68 + i * spacing,
      exampleY,
      exampleRadius,
      stage1Data[userChoices.time].colors,
      '',
      userChoices.shape,
      false
    );
    blob.glowIntensity = 1.5;
    blob.baseRadius = exampleRadius;
    blob.draw();
  }
}

// Slider Events
function handleSliderClick(e) {
  if (currentStage !== 3) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const sliderY = canvas.height * 0.75;
  const sliderWidth = canvas.width * 0.6;
  const sliderLeft = canvas.width * 0.2;
  const sliderRight = sliderLeft + sliderWidth;
  
  if (y >= sliderY - 20 && y <= sliderY + 20 && x >= sliderLeft && x <= sliderRight) {
    sliderDragging = true;
    const newValue = (x - sliderLeft) / sliderWidth;
    updateIntensity(newValue);
  }
}

function handleSliderMove(e) {
  if (currentStage !== 3 || !sliderDragging) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  
  const sliderWidth = canvas.width * 0.6;
  const sliderLeft = canvas.width * 0.2;
  
  const newValue = (x - sliderLeft) / sliderWidth;
  updateIntensity(newValue);
}

function handleSliderRelease() {
  sliderDragging = false;
}

// Event Listeners
canvas.addEventListener('mousedown', (e) => {
  if (currentStage === 1 && !isAnimating) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
    if (dist < centerLight.radius) {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
    }
  } else if (currentStage === 3) {
    handleSliderClick(e);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (currentStage === 1 && !isAnimating) {
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
  } else if (currentStage === 3) {
    handleSliderMove(e);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (currentStage === 1 && isDragging && !isAnimating) {
    isDragging = false;
    canvas.style.cursor = 'default';
    checkDrop();
  } else if (currentStage === 3) {
    handleSliderRelease();
  }
});

canvas.addEventListener('click', (e) => {
  if (currentStage !== 2 || isAnimating) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  for (const [key, blob] of Object.entries(stage2Blobs)) {
    const dist = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
    
    if (dist < blob.radius + 30) {
      shootLight(key, blob);
      return;
    }
  }
});

canvas.addEventListener('touchstart', (e) => {
  if (isAnimating) return;
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  if (currentStage === 1) {
    const dist = Math.sqrt((x - centerLight.x) ** 2 + (y - centerLight.y) ** 2);
    if (dist < centerLight.radius) {
      isDragging = true;
    }
  } else if (currentStage === 2) {
    for (const [key, blob] of Object.entries(stage2Blobs)) {
      const dist = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
      if (dist < blob.radius + 30) {
        shootLight(key, blob);
        return;
      }
    }
  } else if (currentStage === 3) {
    const sliderY = canvas.height * 0.75;
    const sliderWidth = canvas.width * 0.6;
    const sliderLeft = canvas.width * 0.2;
    const sliderRight = sliderLeft + sliderWidth;
    
    if (y >= sliderY - 20 && y <= sliderY + 20 && x >= sliderLeft && x <= sliderRight) {
      sliderDragging = true;
      const newValue = (x - sliderLeft) / sliderWidth;
      updateIntensity(newValue);
    }
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (currentStage === 1 && isDragging && !isAnimating) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    centerLight.x = touch.clientX - rect.left;
    centerLight.y = touch.clientY - rect.top;
  } else if (currentStage === 3 && sliderDragging) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    
    const sliderWidth = canvas.width * 0.6;
    const sliderLeft = canvas.width * 0.2;
    
    const newValue = (x - sliderLeft) / sliderWidth;
    updateIntensity(newValue);
  }
});

canvas.addEventListener('touchend', (e) => {
  if (currentStage === 1 && isDragging && !isAnimating) {
    e.preventDefault();
    isDragging = false;
    checkDrop();
  } else if (currentStage === 3) {
    e.preventDefault();
    sliderDragging = false;
  }
});

// Stage 1: Drop Detection
function checkDrop() {
  const blobs = stage1Blobs;
  
  for (const [key, blob] of Object.entries(blobs)) {
    const dist = Math.sqrt(
      (centerLight.x - blob.x) ** 2 + (centerLight.y - blob.y) ** 2
    );
    
    if (dist < blob.radius + centerLight.radius) {
      absorbColor(key, blob);
      return;
    }
  }
}

// Stage 1: Color Absorption
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

function returnToCenter(x, y, radius) {
  const duration = 600;
  const startTime = Date.now();
  const startX = centerLight.x;
  const startY = centerLight.y;
  const centerX = canvas.width / 2;
  const centerY = canvas.height * 0.45;
  
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

// Stage 2: Shoot Light
function shootLight(shapeKey, targetBlob) {
  isAnimating = true;
  userChoices.shape = shapeKey;
  
  lightBeam = new LightBeam(
    centerLight.x,
    centerLight.y,
    targetBlob.x,
    targetBlob.y,
    centerLight.colors
  );
  
  const phase1Start = Date.now();
  
  function animatePhase1() {
    const elapsed = Date.now() - phase1Start;
    const isComplete = lightBeam.update(elapsed);
    
    if (!isComplete) {
      requestAnimationFrame(animatePhase1);
    } else {
      lightBeam = null;
      setTimeout(() => {
        animatePhase2(shapeKey);
      }, 200);
    }
  }
  
  function animatePhase2(shapeKey) {
    const duration = 1000;
    const startTime = Date.now();
    
    function transform() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      centerLight.shapeType = shapeKey;
      
      if (progress < 1) {
        requestAnimationFrame(transform);
      } else {
        isAnimating = false;
        nextBtn.disabled = false;
      }
    }
    
    transform();
  }
  
  animatePhase1();
}

// Easing Function
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Animation Loop
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
  } else if (currentStage === 3) {
    drawExampleLights();
  }
  
  if (lightBeam) {
    lightBeam.draw();
  }
  
  centerLight.update(time);
  centerLight.draw();
  
  if (currentStage === 3) {
    drawSlider();
  }
  
  requestAnimationFrame(animate);
}

// Next Button
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
    console.log('Final Result!');
    console.log('User Choices:', userChoices);
    alert(`Complete!\nTime: ${userChoices.time}\nShape: ${userChoices.shape}\nIntensity: ${userChoices.intensity.toFixed(2)}`);
  }
});

// Resize Handler
window.addEventListener('resize', () => {
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  const scaleX = canvas.width / oldWidth;
  const scaleY = canvas.height / oldHeight;
  
  const blobs = currentStage === 1 ? stage1Blobs : stage2Blobs;
  if (currentStage <= 2) {
    for (const blob of Object.values(blobs)) {
      blob.x *= scaleX;
      blob.y *= scaleY;
    }
  }
  
  if (currentStage === 1) {
    centerLight.x = canvas.width / 2;
    centerLight.y = canvas.height * 0.45;
  } else if (currentStage === 2) {
    centerLight.x = canvas.width / 2;
    centerLight.y = canvas.height * 0.35;
  } else if (currentStage === 3) {
    centerLight.x = canvas.width / 2;
    centerLight.y = canvas.height * 0.30;
  }
});

// Start
initStage1();
animate();
