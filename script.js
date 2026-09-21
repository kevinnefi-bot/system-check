/**
 * SCRIPT.JS - Central Choreography & Interactive Experience Controller
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
window.getStoryState = () => ({ step, busy });
let audioUnlocked = false;
let ambientAnimId = null;
let activeFireworks = [];
let stars = [];
let ambientParticles = [];

// Story Messages (steps: 1-4 intro, 5 friendship day, 6 amarillo+music+bouquet, 8-13 messages, 14 final)
const messages = {
  1: `<div class="message-card-shield"><p class="kicker">UNA PEQUEÑA SORPRESA</p><h2>Te hice algo…</h2><p>pero tenía que disimularlo un poquito haha<br>y hacerlo de una manera diferente.</p></div>`,
  2: `<div class="message-card-shield"><h2>Don't worry,<br><em>this isn't anything bad haha.</em></h2><p>You can keep clicking…</p></div>`,
  3: `<div class="message-card-shield"><p>Y sí… técnicamente también es parte de mi tarea,<br>porque usé algunas de las cosas que aprendí en clase haha.</p></div>`,
  4: `<div class="message-card-shield"><h2>Entonces me dieron ganas de aprovecharlo<br>para hacerte un pequeño detalle.</h2></div>`,
  8: `<div class="message-card-shield"><h2>Estas son para ti,<br><em>Malena.</em> 🌼</h2><p>No necesitan agua, pero sí me hicieron revisar el código unas cuantas veces haha.</p></div>`,
  9: `<div class="message-card-shield"><p>Espero que tengas un bonito día, un buen inicio de semana y que te vaya muy bien en tus clases.</p><h2><em>You've got this!</em></h2></div>`,
  10: `<div class="message-card-shield"><h2>Y ojalá hoy suene una de esas canciones…</h2><p class="gold" style="font-size: clamp(19px, 2.8vw, 26px); font-weight: 600;">Con las que no puedes quedarte quieta.</p></div>`,
  11: `<div class="message-card-shield"><p class="poem">“Que hoy encuentres algo bonito,<br>una canción que te haga bailar,<br>una clase que salga mejor de lo esperado<br>y una pequeña razón para sonreír.”</p></div>`,
  12: `<div class="message-card-shield"><p>No hace falta que respondas ni que digas nada.<br>Ya me imagino un “no era necesario” de tu parte haha.</p><p>Y sí, tal vez no era necesario, pero me nació hacerlo. Solo quería que no te quedaras sin tus flores amarillas y, de paso, sacarte una sonrisa. 🌼</p></div>`,
  13: `<div class="message-card-shield"><h2><em>Era só um carinho.</em> 💛</h2><p class="signature">— Nefi</p><p class="ps">P.S. Don't let our Book of Mormon streak reset again haha. 😂</p></div>`
};

/* ==================================================== CANVAS ==================================================== */
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initStars(); }
window.addEventListener('resize', resizeCanvas);

function initStars() {
  stars = [];
  const starCount = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.08);
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.85, r: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.7 + 0.2, speed: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2 });
  }
  ambientParticles = [];
  const pCount = Math.floor(Math.min(window.innerWidth, 1200) * 0.04);
  for (let i = 0; i < pCount; i++) {
    ambientParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2.2 + 0.8, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.15, alpha: Math.random() * 0.6 + 0.15, color: Math.random() > 0.4 ? '#ffd75e' : '#fff4ce' });
  }
}

function startAmbientCanvas() {
  resizeCanvas();
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let s of stars) { s.phase += s.speed; const a = Math.max(0.1, s.alpha + Math.sin(s.phase) * 0.35); ctx.fillStyle = `rgba(255,245,220,${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
    for (let p of ambientParticles) { p.x += p.vx; p.y += p.vy; if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; } if (p.x < -10) p.x = canvas.width + 10; if (p.x > canvas.width + 10) p.x = -10; ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    for (let i = activeFireworks.length - 1; i >= 0; i--) { const fw = activeFireworks[i]; fw.update(); fw.draw(ctx); if (fw.isDead()) activeFireworks.splice(i, 1); }
    ambientAnimId = requestAnimationFrame(loop);
  }
  ambientAnimId = requestAnimationFrame(loop);
}

class FireworkRocket {
  constructor(ox, oy, pal) {
    this.particles = [];
    const count = window.innerWidth < 600 ? 40 : 65;
    const colors = pal || ['#ffd75e','#ffea79','#ffb300','#fff8e1','#f59e0b'];
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, sp = 1.8 + Math.random() * 5.2; this.particles.push({ x: ox, y: oy, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, alpha: 1, decay: 0.012 + Math.random() * 0.016, color: colors[Math.floor(Math.random()*colors.length)], size: 1.8 + Math.random() * 2 }); }
  }
  update() { for (let p of this.particles) { p.x+=p.vx; p.y+=p.vy; p.vy+=0.045; p.vx*=0.985; p.vy*=0.985; p.alpha-=p.decay; } this.particles = this.particles.filter(p=>p.alpha>0); }
  draw(ctx) { for (let p of this.particles) { ctx.globalAlpha=Math.max(0,p.alpha); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; }
  isDead() { return this.particles.length === 0; }
}

function launchFireworks(n=6) { for (let i=0;i<n;i++) { setTimeout(()=>{ activeFireworks.push(new FireworkRocket(canvas.width*0.15+Math.random()*(canvas.width*0.7), canvas.height*0.12+Math.random()*(canvas.height*0.45))); },i*320); } }

/* ==================================================== AUDIO ==================================================== */
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  music.muted = true;
  music.volume = 0;
  const p = music.play();
  if (p !== undefined) {
    p.then(() => {
      music.pause();
      try { music.currentTime = 24; } catch (_) {}
      music.muted = false;
    }).catch(() => {});
  }
}

async function startMusicTrack() {
  try {
    music.muted = false;
    music.volume = 0;
    try { music.currentTime = 24; } catch (_) {}
    const p = music.play();
    if (p !== undefined) await p;
    try { if (music.currentTime < 23.5) music.currentTime = 24; } catch (_) {}
    soundBtn.hidden = false;
    soundBtn.textContent = '♫';
    soundBtn.setAttribute('aria-label', 'Pausar música');
    let vol = 0;
    const fade = setInterval(() => {
      vol += 0.025;
      if (vol >= 0.5) {
        music.volume = 0.5;
        clearInterval(fade);
      } else {
        music.volume = vol;
      }
    }, 100);
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

/* ==================================================== CHARACTER ==================================================== */
function setPose(pose) { character.className = `character pose-${pose}`; }
function moveCharacter(t) { character.style.transform = t; }

/* ==================================================== TYPOGRAPHY ==================================================== */
function buildDancingWord(a, b) {
  const L1 = [...a].map((c,i)=>`<span class="dancing-letter" style="--delay:${i*0.08}s">${c}</span>`).join('');
  const L2 = [...b].map((c,i)=>`<span class="dancing-letter" style="--delay:${(a.length+i)*0.08}s">${c}</span>`).join('');
  return `<div class="bom-wrap"><h1 class="big-hero-word"><span class="bom-word">${L1}</span><span class="bom-word">${L2}</span></h1></div>`;
}

function buildHeroName(name='MALENA SUSAN') {
  const rows = name.split(' ').map((w,ri)=>`<div class="name-hero-row">${[...w].map((ch,ci)=>`<span class="name-hero-letter" style="--delay:${(ri*5+ci)*0.09}s">${ch}</span>`).join('')}</div>`).join('');
  return `<p class="kicker">ESTO ERA PARA TI</p><div class="name-hero-container">${rows}</div>`;
}

function freezeLetters(el) { if (!el) return; el.querySelectorAll('.dancing-letter,.name-hero-letter').forEach(l=>l.classList.add('settled')); }

/* ==================================================== TRANSITIONS ==================================================== */
function renderMessage(html) { message.classList.remove('out'); message.classList.add('in'); message.innerHTML = html; }
async function transitionMessage(html) { message.classList.remove('in'); message.classList.add('out'); await wait(550); renderMessage(html); }

/* ==================================================== FLOWER RAIN ==================================================== */
function triggerFlowerRain(total=60) {
  const depths=['depth-back','depth-mid','depth-front'], types=['sunflower','rose','daisy','wildflower'];
  for (let i=0;i<total;i++) {
    setTimeout(() => {
      const item=document.createElement('div'), depth=depths[i%depths.length], type=types[i%types.length];
      item.className=`flower-rain-item ${depth}`;
      const sz=depth==='depth-front'?44+Math.random()*24:depth==='depth-mid'?28+Math.random()*18:18+Math.random()*12;
      let svg='';
      if(type==='sunflower') svg=FlowerEngine.createSunflowerSvg({size:sz});
      else if(type==='rose') svg=FlowerEngine.createRoseSvg({size:sz});
      else if(type==='daisy') svg=FlowerEngine.createDaisySvg({size:sz});
      else svg=FlowerEngine.createWildflowerSvg({size:sz});
      item.innerHTML=svg;
      item.style.left=`${Math.random()*96}vw`;
      item.style.top='-12vh';
      const dx=(Math.random()-0.5)*160, rot=(Math.random()-0.5)*720, dur=(depth==='depth-front'?5500:depth==='depth-mid'?7500:9500)+Math.random()*2000;
      document.body.appendChild(item);
      item.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${dx}px,120vh) rotate(${rot}deg)`}],{duration:dur,easing:'linear',fill:'forwards'}).onfinish=()=>item.remove();
    }, i*140);
  }
}

/* ==================================================== LOGIN & GLITCH ==================================================== */
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
  unlockAudio();
  await runGlitchToIntro();
});

async function runGlitchToIntro() {
  browserError.hidden = true;
  flood.hidden = false;
  const cardCount = window.innerWidth < 600 ? 18 : 28;
  for (let i=0;i<cardCount;i++) {
    const c=document.createElement('div');
    c.className='error-card';
    c.innerHTML=`<span>☹</span><b>No se puede acceder al sitio</b><span>Se ha interrumpido la conexión.</span><code>ERR_CONNECTION_RESET</code>`;
    c.style.left=`${(i%5)*20-2+Math.random()*4}%`;
    c.style.top=`${(Math.floor(i/5)%6)*16-2+Math.random()*4}%`;
    flood.appendChild(c);
    await wait(45);
  }
  show.hidden = false;
  startAmbientCanvas();
  setPose('curl');
  moveCharacter('translateX(0)');
  await wait(600);
  setPose('throw');
  await wait(450);
  flood.querySelectorAll('.error-card').forEach(c => {
    c.style.setProperty('--dx',`${(Math.random()-0.5)*window.innerWidth*1.8}px`);
    c.style.setProperty('--dy',`${(Math.random()-0.5)*window.innerHeight*1.8}px`);
    c.style.setProperty('--rot',`${(Math.random()-0.5)*180}deg`);
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
  await runTitleSequence();
}

/* ==================================================== TITLE SEQUENCE ==================================================== */
async function runTitleSequence() {
  setPose('push');
  character.classList.remove('exit-left');
  moveCharacter('translateX(10px)');
  renderMessage(buildDancingWord('BOM','DIAAA…'));
  await wait(3200);
  freezeLetters(message);
  setPose('wave');
  await wait(1800);
  setPose('present');
  await transitionMessage(`<div class="message-card-shield"><p class="kicker">UN DÍA PARA REGALAR UN POQUITO DE LUZ</p><h1>Feliz <em>21</em><br>de septiembre.</h1></div>`);
  const cf = FlowerEngine.createGrowingFlower('sunflower',110,200);
  cf.classList.add('corner-left');
  document.body.appendChild(cf);
  launchFireworks(2);
  await wait(4200);
  setPose('curl');
  await transitionMessage(`<div class="message-card-shield"><p class="kicker">UN MOMENTITO…</p><h2>Preparando algo más…</h2></div>`);
  await wait(1600);
  setPose('cover');
  await wait(800);
  launchFireworks(5);
  await transitionMessage(buildHeroName('MALENA SUSAN'));
  await wait(3400);
  freezeLetters(message);
  setPose('present');
  await wait(2400);
  await transitionMessage(messages[1]);
  step = 1;
  busy = false;
  nextBtn.hidden = false;
}

/* ==================================================== STORY ADVANCEMENT ==================================================== */
nextBtn.addEventListener('click', advanceStory);
$('stage').addEventListener('click', e => {
  if (!e.target.closest('button')) advanceStory();
});

async function advanceStory() {
  if (busy || step >= 14) return;
  busy = true;
  step++;

  // ── Step 5: Friendship Day message ────────────────────────────────────
  if (step === 5) {
    setPose('wave');
    await transitionMessage(`<div class="message-card-shield"><p>Y bueno… también quería aprovechar que hoy es Día de la Amistad haha.</p><p>Así que técnicamente tenía otra excusa para hacer esto 😌</p></div>`);
    await wait(750);
    const note = document.createElement('p');
    note.className = 'sidenote sidenote-pop';
    note.textContent = 'la excusa más barata haha xd';
    const shield = message.querySelector('.message-card-shield');
    if (shield) shield.appendChild(note);
    await wait(1800);
    busy = false;
    nextBtn.hidden = false;
    return;
  }

  // ── Step 6: "Pero espera… / amarillo" – MUSIC TRIGGER & BOUQUET ──────
  if (step === 6) {
    nextBtn.hidden = true;
    setPose('surprise');
    await transitionMessage(`<div class="message-card-shield"><p class="kicker">UN TOQUE ESPECIAL</p><h2>Pero espera…</h2></div>`);
    await wait(1400);
    setPose('curl');
    await transitionMessage(`<div class="message-card-shield"><p class="kicker">UN TOQUE ESPECIAL</p><h2>Pero espera…</h2><p>Siento que acá falta algo de <em class="word-amarillo">amarillo…</em></p></div>`);
    await wait(800);
    startMusicTrack(); // 🎵 Music starts at t=24, smooth fade-in 2s
    const cfR = FlowerEngine.createGrowingFlower('rose',110,200);
    cfR.classList.add('corner-right');
    document.body.appendChild(cfR);

    // Character reaction
    await wait(900);
    setPose('surprise'); // Realization!
    await wait(1100);
    setPose('present'); // Look to side
    await wait(800);

    step = 7;
    await runBouquetEntrance();
    return;
  }

  // ── Step 14: Final Scene ──────────────────────────────────────────────
  if (step === 14) {
    await runFinalScene();
    return;
  }

  // ── Normal transitions (steps 8-13) ───────────────────────────────────
  setPose(step % 2 === 0 ? 'curl' : 'present');
  await transitionMessage(messages[step]);
  await wait(600);
  busy = false;
  nextBtn.hidden = false;
}

/* ==================================================== BOUQUET ENTRANCE ==================================================== */
async function runBouquetEntrance() {
  nextBtn.hidden = true;
  message.innerHTML = '';
  message.classList.remove('in');

  // Character exits to fetch the bouquet
  setPose('surprise');
  await wait(700);
  setPose('wave');
  await wait(500);
  character.classList.add('exit-left');
  await wait(1000);

  bouquet.hidden = false;
  bouquet.classList.add('dragging');
  FlowerEngine.buildBouquet(bouquet);
  bouquet.style.transform = 'translateX(-120vw)';
  await wait(400);

  setPose('drag');
  character.classList.remove('exit-left');
  character.style.transform = 'translateX(-15vw)';
  bouquet.style.transform = 'translateX(-30vw)';
  await wait(1200);

  character.style.transform = 'translateX(5vw)';
  bouquet.style.transform = 'translateX(-8vw)';
  await wait(1300);

  character.style.transform = 'translateX(0vw)';
  bouquet.style.transform = 'translateX(0vw)';
  await wait(1000);

  bouquet.classList.remove('dragging');
  bouquet.classList.add('settled');
  setPose('curl');
  await wait(4500);

  await new Promise(resolve => {
    FlowerEngine.releaseSinglePetal(async () => {
      setPose('throw');
      await wait(600);
      FlowerEngine.explodeBouquet(bouquet);
      bouquet.hidden = true;
      launchFireworks(7);
      triggerFlowerRain(80);
      setPose('cover');
      await wait(1200);
      setPose('present');
      renderMessage(messages[8]);
      step = 8;
      busy = false;
      nextBtn.hidden = false;
      resolve();
    });
  });
}

/* ==================================================== FINAL SCENE ==================================================== */
async function runFinalScene() {
  nextBtn.hidden = true;
  setPose('wave');
  triggerFlowerRain(25);
  const markup = `<div class="message-card-shield"><p class="kicker">BUENO… ESO ES TODO</p>${buildHeroName('MALENA')}<p class="poem">Enjoy your day. ☀️<br>Espero que hoy te pase algo bonito.</p></div>`;
  await transitionMessage(markup);
  await wait(3600);
  freezeLetters(message);
  setPose('curl');
  await wait(1500);
  replayBtn.hidden = false;
  busy = true;
}

replayBtn.addEventListener('click', () => { window.location.reload(); });