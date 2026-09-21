/**
 * SCRIPT.JS - Central Choreography & Interactive Experience Controller
 * Orchestrates scenes, character animations, typography transformations, canvas particle effects,
 * audio unlock and playback, digital flower blooming and explosion.
 */

const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Elements
const login = $('login');
const browserError = $('browser-error');
const flood = $('error-flood');
const show = $('show');
const message = $('message');
const nextBtn = $('next');
const replayBtn = $('replay');
const character = $('character');
const bouquet = $('bouquet');
const music = $('music');
const soundBtn = $('sound');
const canvas = $('effects');
const ctx = canvas.getContext('2d');

// State
let step = 0;
let busy = true;
let audioUnlocked = false;
let ambientAnimId = null;
let activeFireworks = [];
let stars = [];
let ambientParticles = [];

// Story Messages
const messages = {
  1: `
    <div class="message-card-shield">
      <p class="kicker">UNA PEQUEÑA SORPRESA</p>
      <h2>Te hice algo…</h2>
      <p>pero tenía que disimularlo un poquito haha<br>y hacerlo de una manera diferente.</p>
    </div>
  `,
  2: `
    <div class="message-card-shield">
      <h2>Don’t worry,<br><em>this isn’t anything bad haha.</em></h2>
      <p>You can keep clicking…</p>
    </div>
  `,
  3: `
    <div class="message-card-shield">
      <p>Y sí… técnicamente también es parte de mi tarea,<br>porque usé algunas de las cosas que aprendí en clase haha.</p>
    </div>
  `,
  4: `
    <div class="message-card-shield">
      <h2>Entonces me dieron ganas de aprovecharlo<br>para hacerte un pequeño detalle.</h2>
    </div>
  `,
  5: `
    <div class="message-card-shield">
      <p class="kicker">UN TOQUE ESPECIAL</p>
      <h2>Pero espera…<br>Aquí falta un poquito<br>de <em>amarillo.</em></h2>
    </div>
  `,
  7: `
    <div class="message-card-shield">
      <h2>Estas son para ti,<br><em>Malena.</em> 🌼</h2>
      <p>No necesitan agua, pero sí me hicieron revisar el código unas cuantas veces haha.</p>
    </div>
  `,
  8: `
    <div class="message-card-shield">
      <p>Espero que tengas un bonito día, un buen inicio de semana y que te vaya muy bien en tus clases.</p>
      <h2><em>You’ve got this!</em></h2>
    </div>
  `,
  9: `
    <div class="message-card-shield">
      <h2>Y ojalá hoy suene una de esas canciones…</h2>
      <p class="gold" style="font-size: clamp(19px, 2.8vw, 26px); font-weight: 600;">Con las que no puedes quedarte quieta.</p>
    </div>
  `,
  10: `
    <div class="message-card-shield">
      <p class="poem">
        “Que hoy encuentres algo bonito,<br>
        una canción que te haga bailar,<br>
        una clase que salga mejor de lo esperado<br>
        y una pequeña razón para sonreír.”
      </p>
    </div>
  `,
  11: `
    <div class="message-card-shield">
      <p>No hace falta que respondas ni que digas nada.<br>Ya me imagino un “no era necesario” de tu parte haha.</p>
      <p>Y sí, tal vez no era necesario, pero me nació hacerlo. Solo quería que no te quedaras sin tus flores amarillas y, de paso, sacarte una sonrisa. 🌼</p>
    </div>
  `,
  12: `
    <div class="message-card-shield">
      <h2><em>Era só um carinho.</em> 💛</h2>
      <p class="signature">— Nefi</p>
      <p class="ps">P.S. Don’t let our Book of Mormon streak reset again haha. 😂</p>
    </div>
  `
};

/* ====================================================
   CANVAS PARTICLE & FIREWORK ENGINE
   ==================================================== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
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
      color: Math.random() > 0.4 ? '#ffd75e' : '#fff4ce'
    });
  }
}

function startAmbientCanvas() {
  resizeCanvas();

  function loop(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Render Stars
    for (let s of stars) {
      s.phase += s.speed;
      const currentAlpha = Math.max(0.1, s.alpha + Math.sin(s.phase) * 0.35);
      ctx.fillStyle = `rgba(255, 245, 220, ${currentAlpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Ambient Golden Dust
    for (let p of ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 3. Render Active Fireworks
    for (let i = activeFireworks.length - 1; i >= 0; i--) {
      const fw = activeFireworks[i];
      fw.update();
      fw.draw(ctx);
      if (fw.isDead()) {
        activeFireworks.splice(i, 1);
      }
    }

    ambientAnimId = requestAnimationFrame(loop);
  }

  ambientAnimId = requestAnimationFrame(loop);
}

class FireworkRocket {
  constructor(originX, originY, colorPalette) {
    this.x = originX;
    this.y = originY;
    this.particles = [];
    const count = window.innerWidth < 600 ? 40 : 65;
    const colors = colorPalette || ['#ffd75e', '#ffea79', '#ffb300', '#fff8e1', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.2;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.016,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.8 + Math.random() * 2
      });
    }
  }

  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045; // subtle gravity
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.alpha -= p.decay;
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  draw(ctx) {
    for (let p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.particles.length === 0;
  }
}

function launchFireworks(burstCount = 6) {
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      const x = canvas.width * 0.15 + Math.random() * (canvas.width * 0.7);
      const y = canvas.height * 0.12 + Math.random() * (canvas.height * 0.45);
      activeFireworks.push(new FireworkRocket(x, y));
    }, i * 320);
  }
}

/* ====================================================
   AUDIO MANAGEMENT
   ==================================================== */
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  music.load();
  music.volume = 0;
  const p = music.play();
  if (p !== undefined) {
    p.then(() => {
      music.pause();
      music.currentTime = 24; // Desired soundtrack scene entry point
    }).catch(() => {});
  }
}

async function startMusicTrack() {
  try {
    music.currentTime = 24;
    music.volume = 0;
    await music.play();
    soundBtn.hidden = false;
    soundBtn.textContent = '♫';
    soundBtn.setAttribute('aria-label', 'Pausar música');

    // Smooth volume fade-in
    let vol = 0;
    const fadeTimer = setInterval(() => {
      vol += 0.05;
      if (vol >= 0.5) {
        music.volume = 0.5;
        clearInterval(fadeTimer);
      } else {
        music.volume = vol;
      }
    }, 150);
  } catch {
    soundBtn.hidden = false;
    soundBtn.textContent = '▶';
    soundBtn.setAttribute('aria-label', 'Reproducir música');
  }
}

soundBtn.addEventListener('click', () => {
  if (music.paused) {
    music.play().then(() => {
      soundBtn.textContent = '♫';
      soundBtn.setAttribute('aria-label', 'Pausar música');
    }).catch(() => {});
  } else {
    music.pause();
    soundBtn.textContent = '▶';
    soundBtn.setAttribute('aria-label', 'Reproducir música');
  }
});

/* ====================================================
   CHARACTER POSE & CHOREOGRAPHY
   ==================================================== */
function setPose(pose) {
  character.className = `character pose-${pose}`;
}

function moveCharacter(transformStr) {
  character.style.transform = transformStr;
}

/* ====================================================
   TYPOGRAPHY BUILDERS
   ==================================================== */
function buildDancingWord(firstPart, secondPart) {
  const letters1 = [...firstPart].map((char, i) =>
    `<span class="dancing-letter" style="--delay: ${i * 0.08}s">${char}</span>`
  ).join('');

  const letters2 = [...secondPart].map((char, i) =>
    `<span class="dancing-letter" style="--delay: ${(firstPart.length + i) * 0.08}s">${char}</span>`
  ).join('');

  return `
    <div class="bom-wrap">
      <h1 class="big-hero-word">
        <span class="bom-word">${letters1}</span>
        <span class="bom-word">${letters2}</span>
      </h1>
    </div>
  `;
}

function buildHeroName(name = 'MALENA SUSAN') {
  const words = name.split(' ');
  const rowsHtml = words.map((w, rowIdx) => {
    const lettersHtml = [...w].map((ch, chIdx) =>
      `<span class="name-hero-letter" style="--delay: ${(rowIdx * 5 + chIdx) * 0.09}s">${ch}</span>`
    ).join('');
    return `<div class="name-hero-row">${lettersHtml}</div>`;
  }).join('');

  return `
    <p class="kicker">ESTO ERA PARA TI</p>
    <div class="name-hero-container">
      ${rowsHtml}
    </div>
  `;
}

function freezeLetters(container) {
  if (!container) return;
  const letters = container.querySelectorAll('.dancing-letter, .name-hero-letter');
  letters.forEach(l => l.classList.add('settled'));
}

/* ====================================================
   SCENE TRANSITIONS
   ==================================================== */
function renderMessage(html) {
  message.classList.remove('out');
  message.classList.add('in');
  message.innerHTML = html;
}

async function transitionMessage(html) {
  message.classList.remove('in');
  message.classList.add('out');
  await wait(550);
  renderMessage(html);
}

/* ====================================================
   FLOWER RAIN SYSTEM
   ==================================================== */
function triggerFlowerRain(total = 60) {
  const depths = ['depth-back', 'depth-mid', 'depth-front'];
  const flowerTypes = ['sunflower', 'rose', 'daisy', 'wildflower'];

  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const item = document.createElement('div');
      const depth = depths[i % depths.length];
      const type = flowerTypes[i % flowerTypes.length];
      item.className = `flower-rain-item ${depth}`;

      const size = depth === 'depth-front' ? 44 + Math.random() * 24 :
                   depth === 'depth-mid'   ? 28 + Math.random() * 18 :
                                             18 + Math.random() * 12;

      let svgHtml = '';
      if (type === 'sunflower') svgHtml = FlowerEngine.createSunflowerSvg({ size });
      else if (type === 'rose') svgHtml = FlowerEngine.createRoseSvg({ size });
      else if (type === 'daisy') svgHtml = FlowerEngine.createDaisySvg({ size });
      else svgHtml = FlowerEngine.createWildflowerSvg({ size });

      item.innerHTML = svgHtml;
      item.style.left = `${Math.random() * 96}vw`;
      item.style.top = '-12vh';

      const driftX = (Math.random() - 0.5) * 160;
      const rot = (Math.random() - 0.5) * 720;
      const duration = (depth === 'depth-front' ? 5500 : depth === 'depth-mid' ? 7500 : 9500) + Math.random() * 2000;

      document.body.appendChild(item);

      item.animate([
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${driftX}px, 120vh) rotate(${rot}deg)` }
      ], {
        duration,
        easing: 'linear',
        fill: 'forwards'
      }).onfinish = () => item.remove();
    }, i * 140);
  }
}

/* ====================================================
   1. PORTAL LOGIN & GLITCH SEQUENCE
   ==================================================== */
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

// The intentional first user click on the error screen
$('retry').addEventListener('click', async () => {
  unlockAudio();
  await runGlitchToIntro();
});

async function runGlitchToIntro() {
  browserError.hidden = true;
  flood.hidden = false;

  // Create cascading error cards
  const cardCount = window.innerWidth < 600 ? 18 : 28;
  for (let i = 0; i < cardCount; i++) {
    const card = document.createElement('div');
    card.className = 'error-card';
    card.innerHTML = `
      <span>☹</span>
      <b>No se puede acceder al sitio</b>
      <span>Se ha interrumpido la conexión.</span>
      <code>ERR_CONNECTION_RESET</code>
    `;
    card.style.left = `${(i % 5) * 20 - 2 + Math.random() * 4}%`;
    card.style.top = `${(Math.floor(i / 5) % 6) * 16 - 2 + Math.random() * 4}%`;
    flood.appendChild(card);
    await wait(45);
  }

  // Stage appears behind the flood
  show.hidden = false;
  startAmbientCanvas();

  // Character enters looking puzzled
  setPose('curl');
  moveCharacter('translateX(0)');
  await wait(600);

  // Character inspects and taps the error
  setPose('throw');
  await wait(450);

  // Blast all error cards outward!
  const cards = flood.querySelectorAll('.error-card');
  cards.forEach(c => {
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * window.innerWidth * 1.8}px`);
    c.style.setProperty('--dy', `${(Math.random() - 0.5) * window.innerHeight * 1.8}px`);
    c.style.setProperty('--rot', `${(Math.random() - 0.5) * 180}deg`);
    c.classList.add('blast');
  });

  await wait(750);
  flood.hidden = true;
  flood.replaceChildren();

  // Character is surprised, then exits to prepare BOM DIAAA
  setPose('surprise');
  await wait(900);
  setPose('wave');
  await wait(500);

  // Character slides off left
  character.classList.add('exit-left');
  await wait(700);

  // Start the heroic title sequence
  await runTitleSequence();
}

/* ====================================================
   2. HEROIC TITLE SEQUENCE: BOM DIAAA...
   ==================================================== */
async function runTitleSequence() {
  // Character returns pushing the massive text
  setPose('push');
  character.classList.remove('exit-left');
  moveCharacter('translateX(10px)');

  // Render dancing BOM DIAAA...
  renderMessage(buildDancingWord('BOM', 'DIAAA…'));
  await wait(3200);

  // Freeze letters into elegant settled typography
  freezeLetters(message);
  setPose('wave');
  await wait(1800);

  // Transition to September 21
  setPose('present');
  await transitionMessage(`
    <div class="message-card-shield">
      <p class="kicker">UN DÍA PARA REGALAR UN POQUITO DE LUZ</p>
      <h1>Feliz <em>21</em><br>de septiembre.</h1>
    </div>
  `);

  // Grow subtle digital flower in bottom corner
  const cornerFlowerL = FlowerEngine.createGrowingFlower('sunflower', 110, 200);
  cornerFlowerL.classList.add('corner-left');
  document.body.appendChild(cornerFlowerL);

  launchFireworks(2);
  await wait(4200);

  // "Un momentito..." Character prepares confetti cannon
  setPose('curl');
  await transitionMessage(`
    <div class="message-card-shield">
      <p class="kicker">UN MOMENTITO…</p>
      <h2>Preparando algo más…</h2>
    </div>
  `);
  await wait(1600);

  // Character covers ears
  setPose('cover');
  await wait(800);

  // BOOM! Confetti + fireworks burst
  launchFireworks(5);

  // Hero Reveal: MALENA SUSAN
  await transitionMessage(buildHeroName('MALENA SUSAN'));
  await wait(3400);
  freezeLetters(message);

  setPose('present');
  await wait(2400);

  // Transition into first personal message
  await transitionMessage(messages[1]);
  step = 1;
  busy = false;
  nextBtn.hidden = false;
}

/* ====================================================
   3. STORY PROGRESSION & ADVANCEMENT
   ==================================================== */
nextBtn.addEventListener('click', advanceStory);
$('stage').addEventListener('click', e => {
  if (!e.target.closest('button')) advanceStory();
});

async function advanceStory() {
  if (busy || step >= 13) return;
  busy = true;
  step++;

  // Step 5: "Aquí falta un poquito de amarillo..."
  if (step === 5) {
    await transitionMessage(messages[5]);
    setPose('surprise');

    // Bloom a second growing flower on the right corner
    const cornerFlowerR = FlowerEngine.createGrowingFlower('rose', 110, 200);
    cornerFlowerR.classList.add('corner-right');
    document.body.appendChild(cornerFlowerR);

    await wait(2400);
    setPose('present');
    busy = false;
    return;
  }

  // Step 6: Giant Digital Bouquet Reveal!
  if (step === 6) {
    await runBouquetEntrance();
    busy = false;
    nextBtn.hidden = false;
    return;
  }

  // Final Scene
  if (step === 13) {
    await runFinalScene();
    return;
  }

  // Normal message transitions
  setPose(step % 2 === 0 ? 'curl' : 'present');
  await transitionMessage(messages[step]);
  await wait(600);
  busy = false;
}

/* ====================================================
   4. GIANT DIGITAL BOUQUET ENTRANCE & EXPLOSION
   ==================================================== */
async function runBouquetEntrance() {
  nextBtn.hidden = true;
  message.innerHTML = '';
  message.classList.remove('in');

  // Character exits to fetch the bouquet
  setPose('wave');
  await wait(500);
  character.classList.add('exit-left');
  await wait(1000);

  // Build the 25+ flower digital bouquet
  bouquet.hidden = false;
  bouquet.classList.add('dragging');
  FlowerEngine.buildBouquet(bouquet);

  // Position bouquet offscreen to the left
  bouquet.style.transform = 'translateX(-120vw)';
  await wait(400);

  // Character enters in 'pose-drag' hauling the bouquet
  setPose('drag');
  character.classList.remove('exit-left');

  // Step 1: Pull forward
  character.style.transform = 'translateX(-15vw)';
  bouquet.style.transform = 'translateX(-30vw)';
  await wait(1200);

  // Step 2: Brief pause to catch breath, then pull harder
  character.style.transform = 'translateX(5vw)';
  bouquet.style.transform = 'translateX(-8vw)';
  await wait(1300);

  // Step 3: Final pull into center stage
  character.style.transform = 'translateX(0vw)';
  bouquet.style.transform = 'translateX(0vw)';
  await wait(1000);

  // Bouquet settles with spring animation
  bouquet.classList.remove('dragging');
  bouquet.classList.add('settled');

  // Character falls/sits down resting with relief
  setPose('curl');

  // 5 SECONDS FOR BOUQUET TO BREATHE & LIVE
  await wait(5000);

  // A single golden petal detaches and floats towards character
  const floatingPetal = FlowerEngine.releaseSinglePetal(async () => {
    // Character reaches out to touch it
    setPose('throw');
    await wait(600);

    // Shockwave pulse & FLOWER EXPLOSION!
    FlowerEngine.explodeBouquet(bouquet);
    bouquet.hidden = true;

    // Start the music right here!
    startMusicTrack();

    // Fireworks & digital flower rain!
    launchFireworks(7);
    triggerFlowerRain(80);

    // Show message 7: "Estas son para ti, Malena."
    setPose('cover');
    await wait(1200);
    setPose('present');
    renderMessage(messages[7]);
    step = 7;
  });

  await wait(3600);
}

/* ====================================================
   5. FINAL SCENE & REPLAY
   ==================================================== */
async function runFinalScene() {
  nextBtn.hidden = true;
  setPose('wave');

  // Gentle flower rain
  triggerFlowerRain(25);

  const finalMarkup = `
    <div class="message-card-shield">
      <p class="kicker">BUENO… ESO ES TODO</p>
      ${buildHeroName('MALENA')}
      <p class="poem">
        Enjoy your day. ☀️<br>
        Espero que hoy te pase algo bonito.
      </p>
    </div>
  `;

  await transitionMessage(finalMarkup);
  await wait(3600);
  freezeLetters(message);

  // Character rests comfortably
  setPose('curl');
  await wait(1500);

  replayBtn.hidden = false;
  busy = true; // Stay indefinitely
}

replayBtn.addEventListener('click', () => {
  window.location.reload();
});
