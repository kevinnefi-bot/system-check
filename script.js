/**
 * SCRIPT.JS — Central Choreography & Interactive Experience Controller
 * Polish Patch: robust audio unlock, cinematic transitions, character choreography
 */

const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Elements
const login    = $('login');
const browserError = $('browser-error');
const flood    = $('error-flood');
const show     = $('show');
const message  = $('message');
const nextBtn  = $('next');
const replayBtn = $('replay');
const character = $('character');
const bouquet  = $('bouquet');
const music    = $('music');
const soundBtn = $('sound');
const canvas   = $('effects');
const ctx      = canvas.getContext('2d');

// State
let step = 0;
let busy = true;
window.getStoryState = () => ({ step, busy });

// ─── Audio State ──────────────────────────────────────────────────────────────
let audioUnlocked   = false;   // true after first gesture unlock
let musicPlaying    = false;   // true after cinematic trigger fires
let musicManuallyStopped = false; // user paused via button

// ─── Canvas State ─────────────────────────────────────────────────────────────
let ambientAnimId   = null;
let activeFireworks = [];
let stars           = [];
let ambientParticles = [];
let particleColorShift = 0; // 0=normal, 1=full gold (for amarillo moment)

// ─── Story Messages ────────────────────────────────────────────────────────────
const messages = {
  1:  `<div class="message-card-shield"><p class="kicker">UNA PEQUEÑA SORPRESA</p><h2>Te hice algo…</h2><p>pero tenía que disimularlo un poquito haha<br>y hacerlo de una manera diferente.</p></div>`,
  2:  `<div class="message-card-shield"><h2>Don't worry,<br><em>this isn't anything bad haha.</em></h2><p>You can keep clicking…</p></div>`,
  3:  `<div class="message-card-shield"><p>Y sí… técnicamente también es parte de mi tarea,<br>porque usé algunas de las cosas que aprendí en clase haha.</p></div>`,
  4:  `<div class="message-card-shield"><h2>Entonces me dieron ganas de aprovecharlo<br>para hacerte un pequeño detalle.</h2></div>`,
  8:  `<div class="message-card-shield"><h2>Estas son para ti,<br><em>Malena.</em> 🌼</h2><p>No necesitan agua, pero sí me hicieron revisar el código unas cuantas veces haha.</p></div>`,
  9:  `<div class="message-card-shield"><p>Espero que tengas un bonito día, un buen inicio de semana y que te vaya muy bien en tus clases.</p><h2><em>You've got this!</em></h2></div>`,
  10: `<div class="message-card-shield"><h2>Y ojalá hoy suene una de esas canciones…</h2><p class="gold" style="font-size:clamp(19px,2.8vw,26px);font-weight:600;">Con las que no puedes quedarte quieta.</p></div>`,
  11: `<div class="message-card-shield"><p class="poem">"Que hoy encuentres algo bonito,<br>una canción que te haga bailar,<br>una clase que salga mejor de lo esperado<br>y una pequeña razón para sonreír."</p></div>`,
  12: `<div class="message-card-shield"><p>No hace falta que respondas ni que digas nada.<br>Ya me imagino un "no era necesario" de tu parte haha.</p><p>Y sí, tal vez no era necesario, pero me nació hacerlo. Solo quería que no te quedaras sin tus flores amarillas y, de paso, sacarte una sonrisa. 🌼</p></div>`,
  13: `<div class="message-card-shield"><h2><em>Era só um carinho.</em> 💛</h2><p class="signature">— Nefi</p><p class="ps">P.S. Don't let our Book of Mormon streak reset again haha. 😂</p></div>`
};

/* ====================================================================
   CANVAS & PARTICLES
   ==================================================================== */
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}
window.addEventListener('resize', resizeCanvas);

function initStars() {
  stars = [];
  const starCount = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.08);
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.85,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2
    });
  }
  ambientParticles = [];
  const pCount = Math.floor(Math.min(window.innerWidth, 1200) * 0.04);
  for (let i = 0; i < pCount; i++) {
    ambientParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.15,
      alpha: Math.random() * 0.6 + 0.15,
      baseColor: Math.random() > 0.4 ? 'gold' : 'cream',
      hue: 0
    });
  }
}

function getParticleColor(p) {
  // Shift from cream/gold to full warm gold when particleColorShift > 0
  if (p.baseColor === 'gold') {
    return particleColorShift > 0.5
      ? `rgba(255,215,50,${p.alpha})`
      : `rgba(255,215,94,${p.alpha})`;
  } else {
    // cream → warm gold
    const r = Math.round(255);
    const g = Math.round(244 - particleColorShift * 80);
    const b = Math.round(206 - particleColorShift * 160);
    return `rgba(${r},${g},${b},${p.alpha})`;
  }
}

function startAmbientCanvas() {
  resizeCanvas();
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    for (let s of stars) {
      s.phase += s.speed;
      const a = Math.max(0.1, s.alpha + Math.sin(s.phase) * 0.35);
      ctx.fillStyle = `rgba(255,245,220,${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    // Ambient particles
    for (let p of ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      ctx.fillStyle = getParticleColor(p);
      ctx.globalAlpha = p.alpha;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Fireworks
    for (let i = activeFireworks.length - 1; i >= 0; i--) {
      const fw = activeFireworks[i];
      fw.update(); fw.draw(ctx);
      if (fw.isDead()) activeFireworks.splice(i, 1);
    }

    ambientAnimId = requestAnimationFrame(loop);
  }
  ambientAnimId = requestAnimationFrame(loop);
}

/* — Gold shift animation — */
function shiftParticlesToGold(durationMs = 3000) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / durationMs, 1);
    particleColorShift = t;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* — Fireworks — */
class FireworkRocket {
  constructor(ox, oy, pal) {
    this.particles = [];
    const count = window.innerWidth < 600 ? 40 : 65;
    const colors = pal || ['#ffd75e','#ffea79','#ffb300','#fff8e1','#f59e0b','#ffe066'];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.8 + Math.random() * 5.2;
      this.particles.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.016,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.8 + Math.random() * 2
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.045; p.vx *= 0.985; p.vy *= 0.985;
      p.alpha -= p.decay;
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  }
  draw(ctx) {
    for (let p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  isDead() { return this.particles.length === 0; }
}

/**
 * Staggered firework launches from varied positions.
 * delay: ms between each rocket. positions: fraction of screen.
 */
function launchFireworks(n = 6, baseDelay = 320) {
  const isMobile = window.innerWidth < 600;
  const xPositions = [0.15, 0.82, 0.35, 0.65, 0.2, 0.75, 0.5, 0.9, 0.1, 0.6];
  const yPositions = [0.15, 0.12, 0.25, 0.18, 0.2,  0.1, 0.3, 0.15, 0.25, 0.2];
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const xi = xPositions[i % xPositions.length];
      const yi = yPositions[i % yPositions.length];
      activeFireworks.push(new FireworkRocket(
        canvas.width * xi + (Math.random() - 0.5) * (isMobile ? 40 : 80),
        canvas.height * yi + (Math.random() - 0.5) * 30
      ));
    }, i * baseDelay);
  }
}

/* ====================================================================
   AUDIO — ROBUST UNLOCK STRATEGY
   ==================================================================== */

/**
 * AUDIO UNLOCK — Called during the FIRST user gesture (login submit OR retry click).
 *
 * Strategy:
 * 1. Keep music muted + volume 0
 * 2. Call play() to unlock the audio element in the browser's trusted-gesture context
 * 3. Immediately pause() inside the then() callback
 * 4. Set currentTime=0 initially (Safari needs this before seeking to 24)
 * 5. Also resume an AudioContext as a belt-and-suspenders unlock for Safari
 * 6. Store the unlocked state — the SAME element is reused at the yellow trigger
 *
 * IMPORTANT: We must NOT let any audio be audible before the amarillo moment.
 */
let _audioCtx = null;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // Belt-and-suspenders: unlock Web Audio context too (helps Safari)
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const silentBuf = _audioCtx.createBuffer(1, 1, 22050);
    const src = _audioCtx.createBufferSource();
    src.buffer = silentBuf;
    src.connect(_audioCtx.destination);
    src.start(0);
  } catch (_) {}

  music.muted  = true;
  music.volume = 0;
  music.currentTime = 0;

  const p = music.play();
  if (p !== undefined) {
    p.then(() => {
      music.pause();
      // Pre-seek close to 24s so buffering starts there.
      // We do this gently — if it fails we retry at playback time.
      try { music.currentTime = 23; } catch (_) {}
      music.muted = false;
    }).catch(() => {
      // Gesture wasn't strong enough on this browser;
      // startMusicTrack() will attempt again and fall back gracefully.
      audioUnlocked = false;
    });
  } else {
    // Legacy: synchronous play
    music.pause();
    try { music.currentTime = 23; } catch (_) {}
    music.muted = false;
  }
}

/**
 * CINEMATIC MUSIC START — fires at the amarillo moment.
 * Reuses the already-unlocked audio element.
 * Fade: 0 → 0.5 over ~2s.
 */
async function startMusicTrack() {
  if (musicPlaying) return;
  musicPlaying = true;

  try {
    music.muted  = false;
    music.volume = 0;

    // Seek to 24s. If the element wasn't unlocked yet we try play() first.
    try { music.currentTime = 24; } catch (_) {}

    const p = music.play();
    if (p !== undefined) await p;

    // Double-check position after play() resolves
    try { if (music.currentTime < 23.5 || music.currentTime > 26) music.currentTime = 24; } catch (_) {}

    // Show sound control
    soundBtn.hidden = false;
    updateSoundBtn();

    // Smooth 2s fade: 0 → 0.5
    const FADE_TARGET = 0.5;
    const FADE_STEPS  = 40;  // 40 × 50ms = 2000ms
    let vol = 0;
    const fade = setInterval(() => {
      vol += FADE_TARGET / FADE_STEPS;
      if (vol >= FADE_TARGET) {
        music.volume = FADE_TARGET;
        clearInterval(fade);
      } else {
        music.volume = vol;
      }
    }, 50);

  } catch (err) {
    // Autoplay blocked despite unlock attempt — show manual play button
    musicPlaying = false;
    soundBtn.hidden = false;
    soundBtn.textContent = '▶';
    soundBtn.setAttribute('aria-label', 'Reproducir música');
  }
}

function updateSoundBtn() {
  if (music.paused || musicManuallyStopped) {
    soundBtn.textContent = '▶';
    soundBtn.setAttribute('aria-label', 'Reproducir música');
    soundBtn.classList.remove('is-playing');
  } else {
    soundBtn.textContent = '♫';
    soundBtn.setAttribute('aria-label', 'Pausar música');
    soundBtn.classList.add('is-playing');
  }
}

soundBtn.addEventListener('click', () => {
  if (music.paused) {
    musicManuallyStopped = false;
    music.play().then(() => {
      if (music.volume === 0) music.volume = 0.5;
      updateSoundBtn();
    }).catch(() => {});
  } else {
    music.pause();
    musicManuallyStopped = true;
    updateSoundBtn();
  }
});

music.addEventListener('pause', updateSoundBtn);
music.addEventListener('play',  updateSoundBtn);

/* ====================================================================
   CHARACTER
   ==================================================================== */
function setPose(pose) { character.className = `character pose-${pose}`; }

function moveCharacter(t, dur) {
  if (dur) character.style.transition = `transform ${dur}s cubic-bezier(0.25,1,0.5,1)`;
  character.style.transform = t;
}

function resetCharacterTransition() {
  character.style.transition = '';
}

/* ====================================================================
   TYPOGRAPHY
   ==================================================================== */
function buildDancingWord(a, b) {
  const L1 = [...a].map((c, i) => `<span class="dancing-letter" style="--delay:${i * 0.08}s">${c}</span>`).join('');
  const L2 = [...b].map((c, i) => `<span class="dancing-letter" style="--delay:${(a.length + i) * 0.08}s">${c}</span>`).join('');
  return `<div class="bom-wrap"><h1 class="big-hero-word"><span class="bom-word">${L1}</span><span class="bom-word">${L2}</span></h1></div>`;
}

function buildHeroName(name = 'MALENA SUSAN') {
  const rows = name.split(' ').map((w, ri) =>
    `<div class="name-hero-row">${[...w].map((ch, ci) =>
      `<span class="name-hero-letter" style="--delay:${(ri * 5 + ci) * 0.09}s">${ch}</span>`
    ).join('')}</div>`
  ).join('');
  return `<p class="kicker">ESTO ERA PARA TI</p><div class="name-hero-container">${rows}</div>`;
}

function freezeLetters(el) {
  if (!el) return;
  el.querySelectorAll('.dancing-letter,.name-hero-letter').forEach(l => l.classList.add('settled'));
}

/* ====================================================================
   TRANSITIONS — varied per moment
   ==================================================================== */

/** Standard out → in (blur + slide up) */
function renderMessage(html) {
  message.classList.remove('out','out-down','out-blur','out-scale');
  message.classList.add('in');
  message.innerHTML = html;
}

/** Default cinematic fade-out then fade-in */
async function transitionMessage(html, style = 'default') {
  message.classList.remove('in');
  // Pick exit style
  switch (style) {
    case 'down':  message.classList.add('out-down');  break;
    case 'scale': message.classList.add('out-scale'); break;
    case 'blur':  message.classList.add('out-blur');  break;
    default:      message.classList.add('out');       break;
  }
  await wait(500);
  renderMessage(html);
}

/** Reveal message word by word (for important lines) */
function revealWordByWord(containerEl, delayBetween = 90) {
  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT);
  let node;
  const textNodes = [];
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) textNodes.push(node);
  }
  textNodes.forEach(tn => {
    const words = tn.textContent.split(/(\s+)/);
    const frag  = document.createDocumentFragment();
    words.forEach((word, i) => {
      if (/^\s+$/.test(word)) {
        frag.appendChild(document.createTextNode(word));
      } else {
        const span = document.createElement('span');
        span.className = 'word-reveal';
        span.textContent = word;
        span.style.setProperty('--wr-delay', `${i * delayBetween}ms`);
        frag.appendChild(span);
      }
    });
    tn.parentNode.replaceChild(frag, tn);
  });
}

/** Letter-by-letter entrance for a single element */
function letterEntrance(el, delayBetween = 45) {
  const text = el.textContent;
  el.innerHTML = [...text].map((ch, i) =>
    `<span class="letter-entrance" style="--le-delay:${i * delayBetween}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`
  ).join('');
}

/* ====================================================================
   FLOWER RAIN
   ==================================================================== */
function triggerFlowerRain(total = 60) {
  const depths = ['depth-back','depth-mid','depth-front'];
  const types  = ['sunflower','rose','daisy','wildflower'];
  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const item  = document.createElement('div');
      const depth = depths[i % depths.length];
      const type  = types[i % types.length];
      item.className = `flower-rain-item ${depth}`;
      const sz = depth === 'depth-front' ? 44 + Math.random() * 24
                  : depth === 'depth-mid' ? 28 + Math.random() * 18
                  : 18 + Math.random() * 12;
      let svg = '';
      if (type === 'sunflower')   svg = FlowerEngine.createSunflowerSvg({ size: sz });
      else if (type === 'rose')   svg = FlowerEngine.createRoseSvg({ size: sz });
      else if (type === 'daisy')  svg = FlowerEngine.createDaisySvg({ size: sz });
      else                        svg = FlowerEngine.createWildflowerSvg({ size: sz });
      item.innerHTML = svg;
      item.style.left = `${Math.random() * 96}vw`;
      item.style.top  = '-12vh';
      const dx  = (Math.random() - 0.5) * 160;
      const rot = (Math.random() - 0.5) * 720;
      const dur = (depth === 'depth-front' ? 5500 : depth === 'depth-mid' ? 7500 : 9500) + Math.random() * 2000;
      document.body.appendChild(item);
      item.animate(
        [{ transform: 'translate(0,0) rotate(0deg)' },
         { transform: `translate(${dx}px,120vh) rotate(${rot}deg)` }],
        { duration: dur, easing: 'linear', fill: 'forwards' }
      ).onfinish = () => item.remove();
    }, i * 140);
  }
}

/* ====================================================================
   LOGIN & GLITCH
   ==================================================================== */
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  unlockAudio();
  const btn = $('login-button');
  btn.disabled = true;
  btn.innerHTML = 'CONECTANDO… <span>⏳</span>';
  await wait(700);
  btn.innerHTML = 'CARGANDO ALGO ESPECIAL… (12%)';
  await wait(600);
  btn.innerHTML = 'CARGANDO… (37%)';
  await wait(550);
  btn.innerHTML = 'ERROR AL CARGAR DATOS <span>⚠</span>';
  await wait(650);
  login.hidden = true;
  browserError.hidden = false;
});

$('retry').addEventListener('click', async () => {
  // Second touch point — re-try audio unlock if first didn't work
  if (!audioUnlocked) unlockAudio();
  await runGlitchToIntro();
});

async function runGlitchToIntro() {
  browserError.hidden = true;
  flood.hidden = false;
  const cardCount = window.innerWidth < 600 ? 18 : 28;
  for (let i = 0; i < cardCount; i++) {
    const c = document.createElement('div');
    c.className = 'error-card';
    c.innerHTML = `<span>☹</span><b>No se puede acceder al sitio</b><span>Se ha interrumpido la conexión.</span><code>ERR_CONNECTION_RESET</code>`;
    c.style.left = `${(i % 5) * 20 - 2 + Math.random() * 4}%`;
    c.style.top  = `${(Math.floor(i / 5) % 6) * 16 - 2 + Math.random() * 4}%`;
    flood.appendChild(c);
    await wait(45);
  }
  show.hidden = false;
  startAmbientCanvas();
  setPose('curl');
  moveCharacter('translateX(0)');
  await wait(600);

  // Character throws the cards away
  setPose('throw');
  await wait(450);
  flood.querySelectorAll('.error-card').forEach(c => {
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * window.innerWidth * 1.8}px`);
    c.style.setProperty('--dy', `${(Math.random() - 0.5) * window.innerHeight * 1.8}px`);
    c.style.setProperty('--rot', `${(Math.random() - 0.5) * 180}deg`);
    c.classList.add('blast');
  });
  await wait(750);
  flood.hidden = true;
  flood.replaceChildren();

  setPose('surprise');
  await wait(900);
  setPose('wave');
  await wait(500);
  character.classList.add('exit-left');
  await wait(700);

  // Hide static character element while motorcycle intro is active
  character.style.display = 'none';

  // Blue Motorcycle Cinematic Intro
  await runMotorcycleSequence();

  // Restore static character element for title sequence
  character.style.display = '';
  character.classList.remove('exit-left');

  await runTitleSequence();
}

/* ====================================================================
   BLUE MOTORCYCLE CINEMATIC INTRO
   ==================================================================== */
function createMotorcycleStage() {
  const stage = document.createElement('div');
  stage.id = 'moto-stage';
  stage.className = 'moto-stage';
  stage.innerHTML = `
    <div id="moto-headlight-cone" class="moto-headlight-cone"></div>
    <div class="moto-tracks-wrapper">
      <svg class="moto-tracks-svg" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="tire-clip">
            <rect id="tire-clip-rect" x="0" y="0" width="0" height="240" />
          </clipPath>
        </defs>
        <path d="M 0,165 L 1000,165" stroke="#334155" stroke-width="4" stroke-dasharray="10,6" opacity="0.5" />
        <g clip-path="url(#tire-clip)">
          <text id="tire-bom-text" x="500" y="150" text-anchor="middle" class="tire-track-text">BOM DIAAA…</text>
        </g>
        <path id="skid-mark-path" d="" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round" opacity="0" />
      </svg>
    </div>

    <div id="moto-vehicle" class="moto-vehicle">
      <svg class="blue-moto-svg" viewBox="0 0 240 140">
        <defs>
          <linearGradient id="moto-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="50%" stop-color="#1d4ed8" />
            <stop offset="100%" stop-color="#1e40af" />
          </linearGradient>
          <linearGradient id="moto-gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fff176" />
            <stop offset="50%" stop-color="#ffd75e" />
            <stop offset="100%" stop-color="#e59819" />
          </linearGradient>
          <linearGradient id="moto-metal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#cbd5e1" />
            <stop offset="50%" stop-color="#64748b" />
            <stop offset="100%" stop-color="#334155" />
          </linearGradient>
          <radialGradient id="headlight-bulb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="40%" stop-color="#ffea79" />
            <stop offset="100%" stop-color="#ffd75e" />
          </radialGradient>
          <filter id="moto-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#000" flood-opacity="0.5" />
          </filter>
        </defs>
        <g filter="url(#moto-shadow)">
          <path d="M 60,110 L 130,112 L 145,106" fill="none" stroke="url(#moto-metal)" stroke-width="7" stroke-linecap="round" />
          <circle cx="55" cy="110" r="4" fill="#ffd75e" opacity="0.8" />
          <g class="moto-wheel wheel-back" transform="translate(50, 100)">
            <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#1e293b" stroke-width="3" />
            <circle cx="0" cy="0" r="22" fill="none" stroke="url(#moto-blue)" stroke-width="2" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#475569" stroke-width="1.5" />
            <circle cx="0" cy="0" r="6" fill="url(#moto-metal)" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="-15" y1="-15" x2="15" y2="15" stroke="#cbd5e1" stroke-width="1.2" />
            <line x1="-15" y1="15" x2="15" y2="-15" stroke="#cbd5e1" stroke-width="1.2" />
          </g>
          <g class="moto-wheel wheel-front" transform="translate(190, 100)">
            <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#1e293b" stroke-width="3" />
            <circle cx="0" cy="0" r="22" fill="none" stroke="url(#moto-blue)" stroke-width="2" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#475569" stroke-width="1.5" />
            <circle cx="0" cy="0" r="6" fill="url(#moto-metal)" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="-15" y1="-15" x2="15" y2="15" stroke="#cbd5e1" stroke-width="1.2" />
            <line x1="-15" y1="15" x2="15" y2="-15" stroke="#cbd5e1" stroke-width="1.2" />
          </g>
          <path d="M 50,100 L 100,75 L 175,70 L 190,100 Z" fill="#0f172a" stroke="#1e293b" stroke-width="2" />
          <rect x="90" y="80" width="35" height="25" rx="4" fill="url(#moto-metal)" />
          <line x1="95" y1="85" x2="120" y2="85" stroke="#0f172a" stroke-width="2" />
          <line x1="95" y1="90" x2="120" y2="90" stroke="#0f172a" stroke-width="2" />
          <line x1="95" y1="95" x2="120" y2="95" stroke="#0f172a" stroke-width="2" />
          <line x1="175" y1="55" x2="190" y2="100" stroke="url(#moto-metal)" stroke-width="6" stroke-linecap="round" />
          <path d="M 80,68 C 90,48 135,45 160,55 C 178,62 185,72 170,78 C 140,82 95,82 80,68 Z" fill="url(#moto-blue)" stroke="#1d4ed8" stroke-width="1.5" />
          <path d="M 95,58 Q 130,52 155,62" fill="none" stroke="url(#moto-gold)" stroke-width="3" stroke-linecap="round" />
          <path d="M 40,90 Q 55,75 80,72 L 75,85 Q 50,88 40,90 Z" fill="url(#moto-blue)" />
          <path d="M 75,68 C 85,67 105,68 115,70 C 110,76 85,76 75,68 Z" fill="#0f172a" stroke="#334155" stroke-width="1" />
          <path d="M 170,55 L 180,42 L 188,44" fill="none" stroke="url(#moto-metal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="188" cy="44" r="3" fill="#0f172a" />
          <path d="M 182,58 Q 194,56 198,64 Q 192,72 182,70 Z" fill="url(#moto-blue)" />
          <circle cx="196" cy="64" r="7" fill="url(#headlight-bulb)" />
        </g>
      </svg>
      <div id="moto-rider" class="moto-rider-character pose-curl"></div>
    </div>
  `;
  return stage;
}

function launchSkidSparks(screenX, screenY) {
  const colors = ['#ffd75e', '#ffea79', '#f59e0b', '#fff8e1'];
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      activeFireworks.push(new FireworkRocket(
        screenX + (Math.random() - 0.5) * 40,
        screenY + (Math.random() - 0.5) * 20,
        colors
      ));
    }, i * 20);
  }
}

async function runMotorcycleSequence() {
  const showEl = $('show');
  const motoStage = createMotorcycleStage();
  showEl.appendChild(motoStage);

  const vehicle = motoStage.querySelector('#moto-vehicle');
  const rider = motoStage.querySelector('#moto-rider');
  const clipRect = motoStage.querySelector('#tire-clip-rect');
  const wheels = motoStage.querySelectorAll('.moto-wheel');
  const tireText = motoStage.querySelector('#tire-bom-text');
  const headlightCone = motoStage.querySelector('#moto-headlight-cone');
  const skidPath = motoStage.querySelector('#skid-mark-path');

  wheels.forEach(w => w.classList.add('wheel-spin'));

  // 0.4s: Headlight appears
  await wait(400);
  headlightCone.classList.add('active');

  // 0.8s - 2.8s: Motorcycle crosses screen from left to target position
  const isMobile = window.innerWidth < 600;
  const startX = -320;
  const targetX = isMobile ? window.innerWidth * 0.42 : window.innerWidth * 0.52;
  const duration = 2000;
  const startTime = performance.now();

  await new Promise(resolve => {
    function animateRide(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentX = startX + (targetX - startX) * easeProgress;
      const bobY = Math.sin(now * 0.02) * 2;
      vehicle.style.transform = `translate(${currentX}px, ${bobY}px)`;

      // Map rear wheel position to tire track clip mask
      const rearWheelScreenX = Math.max(0, currentX + (isMobile ? 50 : 90));
      const viewBoxX = (rearWheelScreenX / window.innerWidth) * 1000;
      clipRect.setAttribute('width', Math.max(0, viewBoxX));

      if (progress < 1) {
        requestAnimationFrame(animateRide);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(animateRide);
  });

  // 2.8s - 3.5s: Controlled Skid!
  wheels.forEach(w => w.classList.remove('wheel-spin'));
  vehicle.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
  vehicle.style.transform = `translate(${targetX}px, 0px) rotate(-14deg)`;
  rider.className = 'moto-rider-character pose-surprise';

  if (skidPath) {
    const rearX = (targetX / window.innerWidth) * 1000;
    skidPath.setAttribute('d', `M ${rearX - 60},165 Q ${rearX - 20},180 ${rearX + 30},165`);
    skidPath.style.opacity = '0.7';
  }

  launchSkidSparks(targetX + 30, window.innerHeight * 0.7);

  await wait(450);

  // 3.5s - 4.3s: Settle motorcycle upright & Rider waves
  vehicle.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  vehicle.style.transform = `translate(${targetX}px, 0px) rotate(0deg)`;
  rider.className = 'moto-rider-character pose-wave';

  clipRect.setAttribute('width', '1000');

  await wait(800);

  // 4.3s - 5.2s: Tire track text transforms / glows & Motorcycle zooms away
  tireText.classList.add('glowing');
  launchFireworks(3, 200);

  wheels.forEach(w => w.classList.add('wheel-spin'));
  vehicle.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 1, 1)';
  vehicle.style.transform = `translate(${window.innerWidth + 350}px, 0px) rotate(4deg)`;
  headlightCone.classList.remove('active');

  await wait(750);

  motoStage.style.transition = 'opacity 0.5s ease';
  motoStage.style.opacity = '0';
  await wait(500);

  motoStage.remove();
}

/* ====================================================================
   TITLE SEQUENCE
   ==================================================================== */
async function runTitleSequence() {
  setPose('push');
  character.classList.remove('exit-left');
  moveCharacter('translateX(10px)');

  // BOM DIAAA with push-in effect
  renderMessage(buildDancingWord('BOM', 'DIAAA…'));
  message.classList.add('enter-push');
  await wait(3200);
  freezeLetters(message);
  message.classList.remove('enter-push');

  // Character reacts to the dancing words
  setPose('wave');
  await wait(1800);

  // 21 de septiembre — character presents
  setPose('present');
  await transitionMessage(
    `<div class="message-card-shield"><p class="kicker">UN DÍA PARA REGALAR UN POQUITO DE LUZ</p><h1>Feliz <em>21</em><br>de septiembre.</h1></div>`,
    'scale'
  );
  const cf = FlowerEngine.createGrowingFlower('sunflower', 110, 200);
  cf.classList.add('corner-left');
  document.body.appendChild(cf);
  launchFireworks(2, 400);
  await wait(4200);

  // Transition to MALENA — character curls (building anticipation)
  setPose('curl');
  await transitionMessage(
    `<div class="message-card-shield"><p class="kicker">UN MOMENTITO…</p><h2>Preparando algo más…</h2></div>`,
    'blur'
  );
  await wait(1600);

  // Dramatic cover then reveal
  setPose('cover');
  await wait(800);
  launchFireworks(5, 250);
  await transitionMessage(buildHeroName('MALENA SUSAN'), 'scale');
  await wait(3400);
  freezeLetters(message);

  setPose('present');
  await wait(2400);

  await transitionMessage(messages[1]);
  step = 1;
  busy = false;
  nextBtn.hidden = false;
}

/* ====================================================================
   STORY ADVANCEMENT
   ==================================================================== */
nextBtn.addEventListener('click', advanceStory);
$('stage').addEventListener('click', e => {
  if (!e.target.closest('button')) advanceStory();
});

async function advanceStory() {
  if (busy || step >= 14) return;
  busy = true;
  step++;

  // ── Steps 1-4: Personal messages ──────────────────────────────────
  if (step >= 1 && step <= 4) {
    const poses = ['present','curl','wave','surprise'];
    setPose(poses[step - 1] || 'present');
    const styles = ['default','blur','default','scale'];
    await transitionMessage(messages[step], styles[step - 1] || 'default');
    await wait(600);
    busy = false;
    nextBtn.hidden = false;
    return;
  }

  // ── Step 5: Friendship Day — improved joke ────────────────────────
  if (step === 5) {
    setPose('wave');
    await transitionMessage(
      `<div class="message-card-shield"><p>Y bueno… también quería aprovechar que hoy es Día de la Amistad haha.</p><p>Así que técnicamente tenía otra excusa para hacer esto 😌</p></div>`,
      'default'
    );
    await wait(750);

    // Joke note pops in — character notices it
    const note = document.createElement('p');
    note.className = 'sidenote sidenote-pop';
    note.textContent = 'la excusa más barata haha xd';
    const shield = message.querySelector('.message-card-shield');
    if (shield) shield.appendChild(note);

    // Character briefly reacts to the note appearing
    await wait(300);
    setPose('surprise');
    await wait(600);
    setPose('curl'); // shrugs

    await wait(1200);
    busy = false;
    nextBtn.hidden = false;
    return;
  }

  // ── Step 6: AMARILLO MOMENT — calms, then music trigger ──────────
  if (step === 6) {
    nextBtn.hidden = true;
    await runAmarilloSequence();
    return;
  }

  // ── Step 14: Final Scene ──────────────────────────────────────────
  if (step === 14) {
    await runFinalScene();
    return;
  }

  // ── Normal transitions (steps 8-13) ─────────────────────────────
  const normalPoses  = ['present','curl','wave','surprise','present','curl'];
  const normalStyles = ['blur','default','scale','default','blur','scale'];
  const pi = step - 8;
  setPose(normalPoses[pi % normalPoses.length]);
  await transitionMessage(messages[step], normalStyles[pi % normalStyles.length]);
  await wait(600);
  busy = false;
  nextBtn.hidden = false;
}

/* ====================================================================
   AMARILLO SEQUENCE — the big transition
   ==================================================================== */
async function runAmarilloSequence() {
  // 1. Calm the scene
  setPose('present');
  await transitionMessage(
    `<div class="message-card-shield cine-calm"><p class="kicker">UN TOQUE ESPECIAL</p><h2>Pero espera…</h2></div>`,
    'blur'
  );

  // Character looks around slowly
  await wait(600);
  setPose('curl');
  await wait(900);
  setPose('surprise'); // noticing something

  await wait(1000);

  // 2. Reveal the amarillo sentence — progressive word reveal
  renderMessage(
    `<div class="message-card-shield"><p class="kicker">UN TOQUE ESPECIAL</p><h2>Pero espera…</h2><p id="amarillo-line">Siento que acá falta algo de <em class="word-amarillo">amarillo…</em></p></div>`
  );
  message.classList.add('enter-soft-push');

  // Apply word-by-word reveal on the amarillo line
  await wait(100);
  const amarilloLine = document.getElementById('amarillo-line');
  if (amarilloLine) revealWordByWord(amarilloLine, 100);

  // 3. Wait for "amarillo…" to finish appearing (~8 words × 100ms = ~800ms)
  await wait(900);

  // 4. Golden light begins entering — shift particles toward gold
  shiftParticlesToGold(3500);
  document.getElementById('show').classList.add('golden-moment');

  // 5. CHARACTER NOTICES the word
  await wait(300);
  setPose('surprise'); // realization

  // 6. MUSIC STARTS ← this is the trigger
  startMusicTrack();

  // 7. Character reacts
  await wait(1100);
  setPose('present');

  // 8. Add corner rose
  const cfR = FlowerEngine.createGrowingFlower('rose', 110, 200);
  cfR.classList.add('corner-right');
  document.body.appendChild(cfR);

  await wait(700);

  // 9. Build anticipation before bouquet
  setPose('wave'); // character says "hold on, watch this"
  await wait(800);

  step = 7;
  await runBouquetEntrance();
}

/* ====================================================================
   BOUQUET ENTRANCE — dramatic, weighted
   ==================================================================== */
async function runBouquetEntrance() {
  nextBtn.hidden = true;
  message.innerHTML = '';
  message.classList.remove('in', 'enter-soft-push', 'enter-push');

  // Character exits to fetch bouquet (she's off to get it)
  setPose('surprise');
  await wait(700);
  setPose('wave');
  await wait(400);
  character.style.transition = 'transform 0.7s cubic-bezier(0.25,1,0.5,1)';
  character.classList.add('exit-left');
  await wait(900);

  // Build bouquet off-screen to the left
  bouquet.hidden = false;
  bouquet.classList.add('dragging');
  FlowerEngine.buildBouquet(bouquet);
  bouquet.style.transition = 'none';
  bouquet.style.transform  = 'translateX(-130vw) rotate(-8deg)';
  await wait(200);

  // Character re-enters with drag pose, partially behind bouquet
  setPose('drag');
  character.classList.remove('exit-left');
  character.style.transition = 'transform 1.2s cubic-bezier(0.25,1,0.5,1)';
  character.style.transform  = 'translateX(-20vw)';
  bouquet.style.transition   = 'transform 1.4s cubic-bezier(0.25,1,0.5,1)';
  bouquet.style.transform    = 'translateX(-35vw) rotate(-5deg)';
  await wait(1400);

  // Struggle effect — slight bounce mid-drag
  bouquet.style.transition  = 'transform 0.8s cubic-bezier(0.3,1.4,0.5,1)';
  bouquet.style.transform   = 'translateX(-18vw) rotate(-2deg)';
  character.style.transition = 'transform 0.8s cubic-bezier(0.3,1.4,0.5,1)';
  character.style.transform  = 'translateX(-6vw)';
  await wait(900);

  // Final drag to center — overshoot then settle
  bouquet.style.transition  = 'transform 1.0s cubic-bezier(0.175,0.885,0.32,1.2)';
  bouquet.style.transform   = 'translateX(4vw) rotate(2deg)';
  character.style.transition = 'transform 1.0s cubic-bezier(0.175,0.885,0.32,1.2)';
  character.style.transform  = 'translateX(6vw)';
  await wait(700);

  // Settle back to resting
  bouquet.style.transition  = 'transform 0.6s cubic-bezier(0.25,0.8,0.25,1)';
  bouquet.style.transform   = 'translateX(0) rotate(0deg)';
  character.style.transition = 'transform 0.6s cubic-bezier(0.25,0.8,0.25,1)';
  character.style.transform  = 'translateX(0)';
  await wait(700);

  // Bouquet settled — character looks exhausted/proud
  bouquet.classList.remove('dragging');
  bouquet.classList.add('settled');
  setPose('curl'); // exhausted but satisfied
  character.style.transition = '';

  // Small golden particles rise around bouquet
  await wait(800);

  // After settling, character becomes proud
  setPose('present');
  await wait(3500);

  // Explosion build-up
  await new Promise(resolve => {
    FlowerEngine.releaseSinglePetal(async () => {
      // Character notices the rogue petal
      setPose('surprise');
      await wait(400);

      // Pause… building tension
      await wait(600);

      // Second pulse warning — character covers
      setPose('cover');
      await wait(500);

      // EXPLOSION
      FlowerEngine.explodeBouquet(bouquet);
      bouquet.hidden = true;

      // Staggered fireworks from varied positions
      launchFireworks(9, 280);
      triggerFlowerRain(80);

      await wait(800);
      setPose('present');

      // Gradual message reveal after chaos
      await wait(600);
      renderMessage(messages[8]);
      step = 8;
      busy = false;
      nextBtn.hidden = false;
      resolve();
    });
  });
}

/* ====================================================================
   FINAL SCENE
   ==================================================================== */
async function runFinalScene() {
  nextBtn.hidden = true;
  setPose('wave');
  triggerFlowerRain(25);

  // Calm fireworks slowly stop — just let active ones fade

  // "ESTAS SON PARA TI, MALENA" — beautiful entrance
  const markup = `<div class="message-card-shield final-reveal"><p class="kicker">BUENO… ESO ES TODO</p>${buildHeroName('MALENA')}<p class="poem">Enjoy your day. ☀️<br>Espero que hoy te pase algo bonito.</p></div>`;
  await transitionMessage(markup, 'scale');

  await wait(800);
  // Staggered letter settling
  const letters = message.querySelectorAll('.name-hero-letter');
  letters.forEach((l, i) => {
    setTimeout(() => l.classList.add('settled'), 200 + i * 120 + Math.random() * 200);
  });

  await wait(3600);
  freezeLetters(message);

  setPose('curl');
  await wait(1500);
  replayBtn.hidden = false;
  busy = true;
}

replayBtn.addEventListener('click', () => { window.location.reload(); });