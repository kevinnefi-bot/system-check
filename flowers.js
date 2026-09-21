/**
 * FLOWERS.JS - Digital Flower Engine for Malena's Interactive Experience
 * Generates rich, stylized vector SVG flowers (sunflowers, roses, daisies, wildflowers, foliage),
 * constructs a 25+ flower digital bouquet with wrapping paper & ribbon, and manages blooming & explosion physics.
 */

const FlowerEngine = (() => {
  // Shared gradient & filter definitions for flowers
  const SVG_DEFS = `
    <defs>
      <!-- Sunflowers -->
      <radialGradient id="sun-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2a1506" />
        <stop offset="55%" stop-color="#4e2b0e" />
        <stop offset="85%" stop-color="#7a4413" />
        <stop offset="100%" stop-color="#221105" />
      </radialGradient>
      <radialGradient id="sun-petal" cx="40%" cy="20%" r="80%">
        <stop offset="0%" stop-color="#fff176" />
        <stop offset="45%" stop-color="#ffca28" />
        <stop offset="85%" stop-color="#f57f17" />
        <stop offset="100%" stop-color="#e65100" />
      </radialGradient>
      <radialGradient id="sun-petal-back" cx="40%" cy="20%" r="80%">
        <stop offset="0%" stop-color="#ffe082" />
        <stop offset="60%" stop-color="#ffa000" />
        <stop offset="100%" stop-color="#d84315" />
      </radialGradient>

      <!-- Roses -->
      <radialGradient id="rose-gold" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#fff9c4" />
        <stop offset="35%" stop-color="#ffd54f" />
        <stop offset="70%" stop-color="#ffb300" />
        <stop offset="100%" stop-color="#f57c00" />
      </radialGradient>
      <radialGradient id="rose-deep" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffe082" />
        <stop offset="50%" stop-color="#ff9800" />
        <stop offset="100%" stop-color="#e65100" />
      </radialGradient>
      <linearGradient id="rose-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe57f" />
        <stop offset="60%" stop-color="#ffab00" />
        <stop offset="100%" stop-color="#dd2c00" />
      </linearGradient>

      <!-- Daisies -->
      <radialGradient id="daisy-center" cx="45%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#ffeb3b" />
        <stop offset="40%" stop-color="#fbc02d" />
        <stop offset="85%" stop-color="#f57f17" />
        <stop offset="100%" stop-color="#bf360c" />
      </radialGradient>
      <linearGradient id="daisy-petal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="#fffde7" />
        <stop offset="80%" stop-color="#fff59d" />
        <stop offset="100%" stop-color="#ffd54f" />
      </linearGradient>

      <!-- Wildflower -->
      <radialGradient id="wild-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#ffee58" />
        <stop offset="100%" stop-color="#f57f17" />
      </radialGradient>
      <linearGradient id="wild-petal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff59d" />
        <stop offset="50%" stop-color="#ffca28" />
        <stop offset="100%" stop-color="#ff8f00" />
      </linearGradient>

      <!-- Leaves & Stems -->
      <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#81c784" />
        <stop offset="40%" stop-color="#388e3c" />
        <stop offset="85%" stop-color="#1b5e20" />
        <stop offset="100%" stop-color="#0e3813" />
      </linearGradient>
      <linearGradient id="leaf-eucalyptus" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a5d6a7" />
        <stop offset="50%" stop-color="#4db6ac" />
        <stop offset="100%" stop-color="#004d40" />
      </linearGradient>
      <linearGradient id="stem-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4caf50" />
        <stop offset="50%" stop-color="#2e7d32" />
        <stop offset="100%" stop-color="#1b5e20" />
      </linearGradient>

      <!-- Wrapping Paper & Ribbon -->
      <linearGradient id="paper-left" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f5ebd9" />
        <stop offset="50%" stop-color="#e0d1ba" />
        <stop offset="100%" stop-color="#bda78a" />
      </linearGradient>
      <linearGradient id="paper-right" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#eadecb" />
        <stop offset="50%" stop-color="#cfbe9e" />
        <stop offset="100%" stop-color="#ab9370" />
      </linearGradient>
      <linearGradient id="paper-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#edd9bf" />
        <stop offset="60%" stop-color="#cbb395" />
        <stop offset="100%" stop-color="#9a805e" />
      </linearGradient>
      <linearGradient id="ribbon-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff8e1" />
        <stop offset="30%" stop-color="#ffd54f" />
        <stop offset="70%" stop-color="#ffb300" />
        <stop offset="100%" stop-color="#ff8f00" />
      </linearGradient>

      <!-- Drop Shadows & Glow -->
      <filter id="flower-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="0.38" />
      </filter>
    </defs>
  `;

  function createSunflowerSvg(options = {}) {
    const { size = 120, petals = 18 } = options;
    const centerR = size * 0.22;
    let petalsHtml = '';

    for (let i = 0; i < petals; i++) {
      const angle = (360 / petals) * i;
      petalsHtml += `
        <path d="M 0,-${centerR * 0.9} C -${size * 0.09},-${size * 0.35} -${size * 0.07},-${size * 0.48} 0,-${size * 0.49} C ${size * 0.07},-${size * 0.48} ${size * 0.09},-${size * 0.35} 0,-${centerR * 0.9} Z"
              fill="url(#sun-petal-back)"
              transform="rotate(${angle + 10})" />
      `;
    }

    for (let i = 0; i < petals; i++) {
      const angle = (360 / petals) * i;
      petalsHtml += `
        <path class="petal" d="M 0,-${centerR * 0.85} C -${size * 0.08},-${size * 0.32} -${size * 0.06},-${size * 0.46} 0,-${size * 0.47} C ${size * 0.06},-${size * 0.46} ${size * 0.08},-${size * 0.32} 0,-${centerR * 0.85} Z"
              fill="url(#sun-petal)"
              transform="rotate(${angle})" />
      `;
    }

    let seeds = '';
    const seedCount = 28;
    for (let s = 1; s <= seedCount; s++) {
      const r = (centerR * 0.78) * Math.sqrt(s / seedCount);
      const theta = s * 137.5 * (Math.PI / 180);
      const sx = Math.cos(theta) * r;
      const sy = Math.sin(theta) * r;
      seeds += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(size * 0.014).toFixed(1)}" fill="#fbc02d" opacity="0.68" />`;
    }

    return `
      <svg class="digital-flower sunflower" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
        <g class="flower-head" filter="url(#soft-shadow)">
          <g class="petals-group">${petalsHtml}</g>
          <circle class="flower-center" cx="0" cy="0" r="${centerR}" fill="url(#sun-center)" />
          <g class="seeds-group">${seeds}</g>
          <circle cx="0" cy="0" r="${centerR * 0.95}" fill="none" stroke="#d78519" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.4" />
        </g>
      </svg>
    `;
  }

  function createRoseSvg(options = {}) {
    const { size = 110 } = options;
    return `
      <svg class="digital-flower rose" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
        <g class="flower-head" filter="url(#soft-shadow)">
          <path class="petal petal-out" d="M -${size*0.35},${size*0.2} C -${size*0.5},-${size*0.1} -${size*0.2},-${size*0.45} 0,-${size*0.45} C ${size*0.2},-${size*0.45} ${size*0.5},-${size*0.1} ${size*0.35},${size*0.2} C ${size*0.1},${size*0.45} -${size*0.1},${size*0.45} -${size*0.35},${size*0.2} Z" fill="url(#rose-deep)" />
          <path class="petal petal-mid1" d="M -${size*0.32},-${size*0.05} C -${size*0.4},-${size*0.32} 0,-${size*0.42} ${size*0.25},-${size*0.35} C ${size*0.4},-${size*0.1} ${size*0.28},${size*0.28} 0,${size*0.32} C -${size*0.25},${size*0.25} -${size*0.4},${size*0.1} -${size*0.32},-${size*0.05} Z" fill="url(#rose-gold)" transform="rotate(25)" />
          <path class="petal petal-mid2" d="M -${size*0.26},-${size*0.08} C -${size*0.35},-${size*0.28} 0,-${size*0.38} ${size*0.22},-${size*0.3} C ${size*0.35},-${size*0.08} ${size*0.24},${size*0.24} 0,${size*0.28} C -${size*0.22},${size*0.22} -${size*0.35},${size*0.08} -${size*0.26},-${size*0.08} Z" fill="url(#rose-shadow)" transform="rotate(-35)" />
          <path class="petal petal-in1" d="M -${size*0.18},-${size*0.05} C -${size*0.25},-${size*0.2} 0,-${size*0.26} ${size*0.18},-${size*0.18} C ${size*0.26},0 ${size*0.16},${size*0.18} 0,${size*0.2} C -${size*0.16},${size*0.16} -${size*0.25},0.05 -${size*0.18},-${size*0.05} Z" fill="url(#rose-gold)" transform="rotate(70)" />
          <path class="petal petal-in2" d="M -${size*0.12},-${size*0.04} C -${size*0.16},-${size*0.15} 0,-${size*0.18} ${size*0.12},-${size*0.12} C ${size*0.18},0 ${size*0.12},${size*0.12} 0,${size*0.14} C -${size*0.1},${size*0.1} -${size*0.16},0.04 -${size*0.12},-${size*0.04} Z" fill="url(#rose-deep)" transform="rotate(130)" />
          <ellipse class="flower-center" cx="0" cy="0" rx="${size*0.08}" ry="${size*0.06}" fill="#fff176" transform="rotate(-15)" />
          <path d="M -${size*0.05},0 C -${size*0.05},-${size*0.06} ${size*0.05},-${size*0.06} ${size*0.05},0 C ${size*0.05},${size*0.05} -${size*0.05},${size*0.05} -${size*0.05},0 Z" fill="#ff8f00" opacity="0.8" />
        </g>
      </svg>
    `;
  }

  function createDaisySvg(options = {}) {
    const { size = 95, petals = 14 } = options;
    const centerR = size * 0.18;
    let petalsHtml = '';

    for (let i = 0; i < petals; i++) {
      const angle = (360 / petals) * i;
      petalsHtml += `
        <path class="petal" d="M -${size*0.045},-${centerR*0.9} C -${size*0.065},-${size*0.3} -${size*0.045},-${size*0.46} 0,-${size*0.48} C ${size*0.045},-${size*0.46} ${size*0.065},-${size*0.3} ${size*0.045},-${centerR*0.9} Z"
              fill="url(#daisy-petal)"
              transform="rotate(${angle})" />
      `;
    }

    return `
      <svg class="digital-flower daisy" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
        <g class="flower-head" filter="url(#soft-shadow)">
          <g class="petals-group">${petalsHtml}</g>
          <circle class="flower-center" cx="0" cy="0" r="${centerR}" fill="url(#daisy-center)" />
          <circle cx="0" cy="0" r="${centerR*0.75}" fill="none" stroke="#e65100" stroke-width="1.2" stroke-dasharray="1.5 2" opacity="0.6" />
        </g>
      </svg>
    `;
  }

  function createWildflowerSvg(options = {}) {
    const { size = 70 } = options;
    const centerR = size * 0.16;
    let petalsHtml = '';

    for (let i = 0; i < 6; i++) {
      const angle = 60 * i;
      petalsHtml += `
        <path class="petal" d="M 0,-${centerR} C -${size*0.14},-${size*0.3} -${size*0.08},-${size*0.45} 0,-${size*0.47} C ${size*0.08},-${size*0.45} ${size*0.14},-${size*0.3} 0,-${centerR} Z"
              fill="url(#wild-petal)"
              transform="rotate(${angle})" />
      `;
    }

    return `
      <svg class="digital-flower wildflower" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
        <g class="flower-head" filter="url(#soft-shadow)">
          <g class="petals-group">${petalsHtml}</g>
          <circle class="flower-center" cx="0" cy="0" r="${centerR}" fill="url(#wild-center)" />
        </g>
      </svg>
    `;
  }

  function createLeafSvg(options = {}) {
    const { size = 90, type = 'broad' } = options;
    if (type === 'eucalyptus') {
      return `
        <svg class="digital-leaf leaf-eucalyptus" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
          <g filter="url(#soft-shadow)">
            <path d="M 0,${size*0.45} Q -${size*0.08},0 0,-${size*0.45}" fill="none" stroke="url(#stem-grad)" stroke-width="3" stroke-linecap="round" />
            <circle cx="-${size*0.18}" cy="${size*0.2}" r="${size*0.12}" fill="url(#leaf-eucalyptus)" opacity="0.9" />
            <circle cx="${size*0.18}" cy="${size*0.05}" r="${size*0.14}" fill="url(#leaf-eucalyptus)" opacity="0.95" />
            <circle cx="-${size*0.15}" cy="-${size*0.15}" r="${size*0.12}" fill="url(#leaf-eucalyptus)" opacity="0.9" />
            <circle cx="${size*0.12}" cy="-${size*0.3}" r="${size*0.1}" fill="url(#leaf-eucalyptus)" opacity="0.95" />
            <circle cx="0" cy="-${size*0.42}" r="${size*0.08}" fill="url(#leaf-eucalyptus)" />
          </g>
        </svg>
      `;
    }

    return `
      <svg class="digital-leaf leaf-broad" viewBox="-${size/2} -${size/2} ${size} ${size}" width="${size}" height="${size}">
        <g filter="url(#soft-shadow)">
          <path d="M 0,${size*0.4} C -${size*0.35},${size*0.2} -${size*0.4},-${size*0.15} 0,-${size*0.45} C ${size*0.4},-${size*0.15} ${size*0.35},${size*0.2} 0,${size*0.4} Z" fill="url(#leaf-grad)" />
          <path d="M 0,${size*0.35} Q 0,0 0,-${size*0.4}" stroke="#a5d6a7" stroke-width="1.6" fill="none" opacity="0.6" />
          <path d="M 0,${size*0.15} Q -${size*0.15},${size*0.05} -${size*0.2},${size*0.08} M 0,${size*0.15} Q ${size*0.15},${size*0.05} ${size*0.2},${size*0.08} M 0,-${size*0.05} Q -${size*0.14},-${size*0.15} -${size*0.2},-${size*0.12} M 0,-${size*0.05} Q ${size*0.14},-${size*0.15} ${size*0.2},-${size*0.12}" stroke="#a5d6a7" stroke-width="1.1" fill="none" opacity="0.4" />
        </g>
      </svg>
    `;
  }

  function createGrowingFlower(type = 'sunflower', width = 140, height = 240) {
    const wrap = document.createElement('div');
    wrap.className = `growing-flower-box type-${type}`;
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;

    let flowerMarkup = '';
    if (type === 'sunflower') flowerMarkup = createSunflowerSvg({ size: width * 0.72, petals: 16 });
    else if (type === 'rose') flowerMarkup = createRoseSvg({ size: width * 0.68 });
    else flowerMarkup = createDaisySvg({ size: width * 0.65, petals: 14 });

    wrap.innerHTML = `
      <svg class="growing-stem-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMax meet">
        <path class="grow-stem" d="M ${width*0.5},${height} Q ${width*0.48},${height*0.55} ${width*0.5},${height*0.28}" fill="none" stroke="url(#stem-grad)" stroke-width="7" stroke-linecap="round" />
        <g class="grow-leaf leaf-l" transform="translate(${width*0.46}, ${height*0.62}) rotate(-45)">
          <path d="M 0,0 C -25,-10 -35,-30 0,-45 C 35,-30 25,-10 0,0 Z" fill="url(#leaf-grad)" />
        </g>
        <g class="grow-leaf leaf-r" transform="translate(${width*0.52}, ${height*0.45}) rotate(45)">
          <path d="M 0,0 C -20,-8 -30,-25 0,-38 C 30,-25 20,-8 0,0 Z" fill="url(#leaf-grad)" />
        </g>
      </svg>
      <div class="grow-blossom">${flowerMarkup}</div>
    `;

    return wrap;
  }

  function buildBouquet(container) {
    if (!container) return null;
    container.innerHTML = '';

    const bouquetWrapper = document.createElement('div');
    bouquetWrapper.className = 'digital-bouquet-canvas';

    if (!document.getElementById('flower-svg-defs')) {
      const defsContainer = document.createElement('div');
      defsContainer.id = 'flower-svg-defs';
      defsContainer.style.cssText = 'position:absolute; width:0; height:0; overflow:hidden; pointer-events:none;';
      defsContainer.innerHTML = `<svg width="0" height="0">${SVG_DEFS}</svg>`;
      document.body.prepend(defsContainer);
    }

    const backPaper = document.createElement('div');
    backPaper.className = 'bouquet-paper-back';
    backPaper.innerHTML = `
      <svg viewBox="0 0 500 500" class="paper-svg">
        <polygon points="120,240 40,40 250,80" fill="url(#paper-left)" opacity="0.9" />
        <polygon points="380,240 460,40 250,80" fill="url(#paper-right)" opacity="0.9" />
      </svg>
    `;
    bouquetWrapper.appendChild(backPaper);

    // Layer 1: Back foliage & deep flowers
    const layerBack = document.createElement('div');
    layerBack.className = 'bouquet-layer layer-back';

    const backElements = [
      { type: 'leaf-eucalyptus', x: 22, y: 14, rot: -38, scale: 0.95 },
      { type: 'leaf-broad', x: 12, y: 26, rot: -62, scale: 1.1 },
      { type: 'leaf-eucalyptus', x: 74, y: 16, rot: 42, scale: 0.95 },
      { type: 'leaf-broad', x: 84, y: 28, rot: 60, scale: 1.1 },
      { type: 'leaf-broad', x: 48, y: 6, rot: 0, scale: 0.9 },
      { type: 'sunflower', x: 28, y: 20, rot: -18, scale: 0.85, delay: 0.3 },
      { type: 'sunflower', x: 70, y: 22, rot: 15, scale: 0.85, delay: 0.7 },
      { type: 'rose', x: 48, y: 12, rot: 6, scale: 0.88, delay: 0.5 },
      { type: 'wildflower', x: 38, y: 10, rot: -12, scale: 0.9, delay: 0.2 },
      { type: 'wildflower', x: 60, y: 11, rot: 22, scale: 0.9, delay: 0.8 }
    ];

    backElements.forEach(item => {
      layerBack.appendChild(createBouquetItem(item));
    });
    bouquetWrapper.appendChild(layerBack);

    // Layer 2: Mid layer hero flowers
    const layerMid = document.createElement('div');
    layerMid.className = 'bouquet-layer layer-mid';

    const midElements = [
      { type: 'sunflower', x: 36, y: 32, rot: -10, scale: 1.05, delay: 0.1 },
      { type: 'sunflower', x: 62, y: 30, rot: 12, scale: 1.05, delay: 0.6 },
      { type: 'rose', x: 22, y: 36, rot: -25, scale: 0.98, delay: 0.4 },
      { type: 'rose', x: 76, y: 34, rot: 22, scale: 0.98, delay: 0.9 },
      { type: 'daisy', x: 48, y: 24, rot: 0, scale: 1.0, delay: 0.2 },
      { type: 'daisy', x: 30, y: 46, rot: -18, scale: 0.92, delay: 0.7 },
      { type: 'daisy', x: 68, y: 44, rot: 16, scale: 0.92, delay: 0.5 },
      { type: 'wildflower', x: 16, y: 48, rot: -30, scale: 0.88, delay: 0.3 },
      { type: 'wildflower', x: 82, y: 46, rot: 32, scale: 0.88, delay: 0.8 }
    ];

    midElements.forEach(item => {
      layerMid.appendChild(createBouquetItem(item));
    });
    bouquetWrapper.appendChild(layerMid);

    // Layer 3: Front hero flowers & cascading leaves
    const layerFront = document.createElement('div');
    layerFront.className = 'bouquet-layer layer-front';

    const frontElements = [
      { type: 'rose', x: 48, y: 40, rot: 4, scale: 1.15, delay: 0.15 },
      { type: 'sunflower', x: 42, y: 52, rot: -6, scale: 1.1, delay: 0.45 },
      { type: 'rose', x: 58, y: 50, rot: 8, scale: 1.05, delay: 0.65 },
      { type: 'daisy', x: 36, y: 60, rot: -12, scale: 0.95, delay: 0.25 },
      { type: 'daisy', x: 62, y: 58, rot: 14, scale: 0.95, delay: 0.75 },
      { type: 'leaf-broad', x: 26, y: 64, rot: -45, scale: 0.9 },
      { type: 'leaf-broad', x: 72, y: 62, rot: 45, scale: 0.9 }
    ];

    frontElements.forEach(item => {
      layerFront.appendChild(createBouquetItem(item));
    });
    bouquetWrapper.appendChild(layerFront);

    // Layer 4: Front wrapping paper cone & ribbon
    const frontPaper = document.createElement('div');
    frontPaper.className = 'bouquet-paper-front';
    frontPaper.innerHTML = `
      <svg viewBox="0 0 500 500" class="paper-svg front-paper">
        <polygon points="120,250 250,485 180,485 50,300" fill="url(#paper-left)" />
        <polygon points="380,250 250,485 320,485 450,300" fill="url(#paper-right)" />
        <polygon points="140,260 250,490 360,260 250,300" fill="url(#paper-front)" filter="url(#soft-shadow)" />
        
        <g class="ribbon-group" transform="translate(250, 410)">
          <path d="M -10,10 Q -30,60 -45,100 Q -35,105 -25,95 Q -15,55 -5,15 Z" fill="url(#ribbon-gold)" />
          <path d="M 10,10 Q 30,60 45,100 Q 35,105 25,95 Q 15,55 5,15 Z" fill="url(#ribbon-gold)" />
          <path d="M 0,0 C -35,-25 -70,-15 -65,15 C -60,40 -20,20 0,5 Z" fill="url(#ribbon-gold)" filter="url(#soft-shadow)" />
          <path d="M 0,0 C 35,-25 70,-15 65,15 C 60,40 20,20 0,5 Z" fill="url(#ribbon-gold)" filter="url(#soft-shadow)" />
          <circle cx="0" cy="5" r="12" fill="url(#ribbon-gold)" filter="url(#soft-shadow)" />
          <circle cx="0" cy="5" r="8" fill="#ffd54f" />
        </g>
      </svg>
    `;
    bouquetWrapper.appendChild(frontPaper);

    container.appendChild(bouquetWrapper);
    return bouquetWrapper;
  }

  function createBouquetItem(item) {
    const wrap = document.createElement('div');
    wrap.className = `bouquet-item item-${item.type}`;
    wrap.style.left = `${item.x}%`;
    wrap.style.top = `${item.y}%`;
    wrap.style.transform = `translate(-50%, -50%) rotate(${item.rot}deg) scale(${item.scale})`;
    wrap.dataset.x = item.x;
    wrap.dataset.y = item.y;
    wrap.dataset.rot = item.rot;
    wrap.dataset.scale = item.scale;

    let svgHtml = '';
    if (item.type === 'sunflower') svgHtml = createSunflowerSvg({ size: 120 });
    else if (item.type === 'rose') svgHtml = createRoseSvg({ size: 105 });
    else if (item.type === 'daisy') svgHtml = createDaisySvg({ size: 95 });
    else if (item.type === 'wildflower') svgHtml = createWildflowerSvg({ size: 70 });
    else if (item.type === 'leaf-eucalyptus') svgHtml = createLeafSvg({ size: 90, type: 'eucalyptus' });
    else if (item.type === 'leaf-broad') svgHtml = createLeafSvg({ size: 90, type: 'broad' });

    wrap.innerHTML = svgHtml;

    if (item.delay !== undefined) {
      wrap.style.animation = `flowerBreeze 4.5s ease-in-out infinite alternate`;
      wrap.style.animationDelay = `${item.delay}s`;
    }

    return wrap;
  }

  function releaseSinglePetal(onPetalReached) {
    const petal = document.createElement('div');
    petal.className = 'floating-golden-petal';
    petal.innerHTML = `
      <svg viewBox="0 0 40 40" width="36" height="36">
        <path d="M 20,4 C 12,12 8,24 20,36 C 32,24 28,12 20,4 Z" fill="url(#rose-gold)" filter="url(#flower-glow)" />
      </svg>
    `;
    petal.style.position = 'fixed';
    petal.style.zIndex = '35';
    petal.style.left = '50%';
    petal.style.top = '48%';
    petal.style.pointerEvents = 'none';
    document.body.appendChild(petal);

    // Dynamic destination towards the character (on left side)
    const anim = petal.animate([
      { transform: 'translate(-50%, -50%) rotate(0deg) scale(0.6)', opacity: 0 },
      { transform: 'translate(-80px, -30px) rotate(45deg) scale(1.1)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-180px, 40px) rotate(110deg) scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'translate(-260px, 120px) rotate(160deg) scale(0.9)', opacity: 1 }
    ], {
      duration: 3200,
      easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      fill: 'forwards'
    });

    anim.onfinish = () => {
      if (typeof onPetalReached === 'function') onPetalReached();
      setTimeout(() => petal.remove(), 1200);
    };

    return petal;
  }

  function explodeBouquet(bouquetEl) {
    if (!bouquetEl) return;
    const items = bouquetEl.querySelectorAll('.bouquet-item');
    const bRect = bouquetEl.getBoundingClientRect();
    const centerX = bRect.left + bRect.width / 2;
    const centerY = bRect.top + bRect.height * 0.45;

    items.forEach((item) => {
      const iRect = item.getBoundingClientRect();
      const clone = item.cloneNode(true);
      clone.className = 'flying-explosion-flower';
      clone.style.position = 'fixed';
      clone.style.left = `${iRect.left}px`;
      clone.style.top = `${iRect.top}px`;
      clone.style.zIndex = '22';
      clone.style.animation = 'none';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      const angle = Math.atan2(iRect.top - centerY, iRect.left - centerX) + (Math.random() - 0.5) * 0.6;
      const distance = 280 + Math.random() * 520;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 60;
      const rot = (Math.random() - 0.5) * 720;
      const duration = 1400 + Math.random() * 700;

      clone.animate([
        { transform: item.style.transform, opacity: 1 },
        { transform: `translate(${targetX}px, ${targetY}px) rotate(${rot}deg) scale(${0.4 + Math.random()*0.7})`, opacity: 0 }
      ], {
        duration,
        easing: 'cubic-bezier(0.15, 0.85, 0.35, 1)',
        fill: 'forwards'
      }).onfinish = () => clone.remove();
    });

    const papers = bouquetEl.querySelectorAll('.bouquet-paper-back, .bouquet-paper-front');
    papers.forEach(p => {
      p.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.15) translateY(40px)' }
      ], { duration: 500, fill: 'forwards' });
    });
  }

  return {
    SVG_DEFS,
    createSunflowerSvg,
    createRoseSvg,
    createDaisySvg,
    createWildflowerSvg,
    createLeafSvg,
    createGrowingFlower,
    buildBouquet,
    releaseSinglePetal,
    explodeBouquet
  };
})();

window.FlowerEngine = FlowerEngine;
