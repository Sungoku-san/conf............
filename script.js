/* ==========================================================================
   ROMANTIC CONFESSION EXPERIENCE - CORE LOGIC
   ========================================================================== */

// --- Default Configuration ---
const DEFAULT_CONFIG = {
  crushName: "Cutie",
  senderName: "Yours Truly",
  question: "Will you be my girlfriend? 💖",
  subtitle: "You're the sweetest part of my every day. What do you say?",
  memories: [
    {
      icon: "✨",
      text: "The way you smile lights up my whole world",
      subtext: "Every time you smile, my heart skips a beat."
    },
    {
      icon: "🌸",
      text: "Every silly moment with you is my favorite memory",
      subtext: "Even the quiet moments feel like magic when I'm with you."
    },
    {
      icon: "💫",
      text: "I realized I don't want a single tomorrow without you",
      subtext: "So before we go any further, there is something I must ask..."
    }
  ],
  letter: `From the first day we started talking, you brought so much warmth, laughter, and joy into my life. Every little message, every laugh, and every moment shared with you has become my favorite part of the day.

I promise to make you laugh on rainy days, listen whenever you want to talk, cheer for you in everything you do, and cherish you with all my heart.

Thank you for saying YES! You just made me the happiest person in the universe. 🥰❤️`,
  whatsappNumber: "", // optional phone number e.g. "1234567890"
  theme: "rose"
};

// Current active state
let config = { ...DEFAULT_CONFIG };
let currentStage = 1;
let currentMemoryIndex = 0;
let noAttempts = 0;
let isAudioPlaying = false;
let audioContext = null;
let musicInterval = null;

// Hilarious & cute pleading messages when trying to tap/hover "NO"
const NO_BUTTON_TEXTS = [
  "No 😢",
  "Wait, really? 🥺",
  "Think again! 💔",
  "Pookie please... 🥺👉👈",
  "Are you sure sure? 😢",
  "Look at the YES button! 👀",
  "You're breaking my heart! 💔",
  "Wrong button cutie! 🙈",
  "Can't touch this! 🏃‍♂️💨",
  "Error 404: 'No' not found! 🤖",
  "There's only one right answer! ❤️",
  "YES is your destiny! ✨",
  "I won't let you say no! 🥰"
];

// ==========================================================================
// 1. INITIALIZATION & URL PARSING
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadConfigFromURL();
  applyConfig();
  initAmbientHearts();
  setupEventListeners();
});

function loadConfigFromURL() {
  try {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    const params = new URLSearchParams(hash);
    if (params.has("name")) config.crushName = decodeURIComponent(params.get("name"));
    if (params.has("sender")) config.senderName = decodeURIComponent(params.get("sender"));
    if (params.has("q")) config.question = decodeURIComponent(params.get("q"));
    if (params.has("phone")) config.whatsappNumber = decodeURIComponent(params.get("phone"));
    if (params.has("theme")) config.theme = decodeURIComponent(params.get("theme"));
    if (params.has("m1")) config.memories[0].text = decodeURIComponent(params.get("m1"));
    if (params.has("m2")) config.memories[1].text = decodeURIComponent(params.get("m2"));
    if (params.has("m3")) config.memories[2].text = decodeURIComponent(params.get("m3"));
    if (params.has("letter")) config.letter = decodeURIComponent(params.get("letter"));
  } catch (err) {
    console.warn("Could not parse URL params", err);
  }
}

function applyConfig() {
  // Apply theme
  document.body.className = config.theme !== "rose" ? `theme-${config.theme}` : "";
  
  // Update elements
  document.getElementById("envelope-sender").textContent = config.senderName;
  document.getElementById("proposal-name").textContent = config.crushName;
  document.getElementById("proposal-question").textContent = config.question;
  document.getElementById("proposal-subtitle").textContent = config.subtitle;
  document.getElementById("letter-crush-name").textContent = config.crushName;
  document.getElementById("letter-body-text").textContent = config.letter;
  document.getElementById("letter-sender-name").textContent = `Forever yours, ${config.senderName}`;
  
  // WhatsApp link config
  const waBtn = document.getElementById("btn-whatsapp-action");
  if (config.whatsappNumber && config.whatsappNumber.trim()) {
    const cleanNum = config.whatsappNumber.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hey ${config.senderName}! I said YES! 🥰❤️ Let's go on our date!`);
    waBtn.href = `https://wa.me/${cleanNum}?text=${waText}`;
    waBtn.style.display = "inline-flex";
  } else {
    // General share text if no phone number provided
    const waText = encodeURIComponent(`I said YES to ${config.senderName}! 🥰❤️`);
    waBtn.href = `https://api.whatsapp.com/send?text=${waText}`;
  }

  updateMemoryCard();
}

// ==========================================================================
// 2. STAGE NAVIGATION
// ==========================================================================
function goToStage(stageNumber) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  const targetSection = document.getElementById(`stage-${stageNumber}`);
  if (targetSection) {
    targetSection.classList.add("active");
    currentStage = stageNumber;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateMemoryCard() {
  const currentMem = config.memories[currentMemoryIndex];
  if (!currentMem) return;
  
  const iconEl = document.getElementById("memory-icon");
  const textEl = document.getElementById("memory-text");
  const subtextEl = document.getElementById("memory-subtext");
  
  iconEl.textContent = currentMem.icon;
  textEl.textContent = currentMem.text;
  subtextEl.textContent = currentMem.subtext;

  // Dots
  document.querySelectorAll(".progress-dots .dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === currentMemoryIndex);
  });
}

function nextMemory() {
  if (currentMemoryIndex < config.memories.length - 1) {
    currentMemoryIndex++;
    updateMemoryCard();
    playChime(440 + currentMemoryIndex * 120);
  } else {
    // Proceed to Stage 3 (The Proposal!)
    goToStage(3);
    playChime(660);
  }
}

// ==========================================================================
// 3. THE RUNAWAY "NO" BUTTON ENGINE (VIRAL MECHANIC)
// ==========================================================================
let lastPointerX = window.innerWidth / 2;
let lastPointerY = window.innerHeight / 2;

function moveNoButton() {
  const btnNo = document.getElementById("btn-no");
  const btnYes = document.getElementById("btn-yes");
  const dialogueEl = document.getElementById("funny-dialogue");
  if (!btnNo) return;

  noAttempts++;

  // Make sure it has teleporting/fixed position
  btnNo.classList.add("teleporting");

  // Viewport bounds with safe margins
  const padding = 24;
  const btnWidth = btnNo.offsetWidth || 120;
  const btnHeight = btnNo.offsetHeight || 50;
  
  const maxX = Math.max(padding, window.innerWidth - btnWidth - padding);
  const maxY = Math.max(padding, window.innerHeight - btnHeight - padding);
  
  // Find a position far enough from cursor & YES button
  let randomX, randomY, attempts = 0;
  const yesRect = btnYes.getBoundingClientRect();

  do {
    randomX = Math.max(padding, Math.floor(Math.random() * maxX));
    randomY = Math.max(padding, Math.floor(Math.random() * maxY));
    attempts++;
    
    const distToCursor = Math.hypot(randomX - lastPointerX, randomY - lastPointerY);
    const distToYes = Math.hypot(randomX - (yesRect.left + yesRect.width/2), randomY - (yesRect.top + yesRect.height/2));
    
    if ((distToCursor > 140 && distToYes > 120) || attempts > 15) {
      break;
    }
  } while (attempts < 20);

  btnNo.style.left = `${randomX}px`;
  btnNo.style.top = `${randomY}px`;

  // Scale up the YES button (+15% each time, up to 2.5x)
  const yesScale = Math.min(2.5, 1 + (noAttempts * 0.15));
  btnYes.style.transform = `scale(${yesScale})`;

  // Update button text progressively
  const textIdx = Math.min(noAttempts, NO_BUTTON_TEXTS.length - 1);
  btnNo.textContent = NO_BUTTON_TEXTS[textIdx];

  // Funny reactive feedback
  if (dialogueEl) {
    dialogueEl.textContent = NO_BUTTON_TEXTS[textIdx];
    dialogueEl.style.opacity = '1';
  }

  // Play a cute evasive boing / whoosh sound
  playEvasionSound();

  // Burst miniature pleading hearts around the No button
  createMiniHearts(randomX + btnWidth / 2, randomY + btnHeight / 2);
}

// Proximity detection for mouse/touch
function setupEventListeners() {
  // Envelope opening
  const envelopeWrapper = document.getElementById("envelope-wrapper");
  if (envelopeWrapper) {
    envelopeWrapper.addEventListener("click", () => {
      const env = document.getElementById("envelope");
      env.classList.add("open");
      playChime(523.25); // C5
      
      // Auto start romantic music on user gesture if not playing
      if (!isAudioPlaying) {
        toggleMusic();
      }

      setTimeout(() => {
        goToStage(2);
      }, 900);
    });
  }

  // Memories next button
  const nextMemBtn = document.getElementById("btn-next-memory");
  if (nextMemBtn) {
    nextMemBtn.addEventListener("click", nextMemory);
  }

  // "NO" button runaway listeners
  const btnNo = document.getElementById("btn-no");
  if (btnNo) {
    // On hover / mouseenter
    btnNo.addEventListener("mouseenter", moveNoButton);
    btnNo.addEventListener("mouseover", moveNoButton);
    // Keyboard focus evasion (No tabbing to No!)
    btnNo.addEventListener("focus", moveNoButton);
    // On mobile touch
    btnNo.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
      }
      moveNoButton();
    }, { passive: false });
    // On click fallback
    btnNo.addEventListener("click", (e) => {
      e.preventDefault();
      moveNoButton();
    });
  }

  // Proximity radar for cursor
  document.addEventListener("mousemove", (e) => {
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    if (currentStage !== 3) return;
    const btnNo = document.getElementById("btn-no");
    if (!btnNo || btnNo.style.display === "none") return;

    const rect = btnNo.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const distance = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);
    // If mouse gets closer than 75px, run away!
    if (distance < 75) {
      moveNoButton();
    }
  });

  // "YES" button acceptance!
  const btnYes = document.getElementById("btn-yes");
  if (btnYes) {
    btnYes.addEventListener("click", handleYesClick);
  }

  // Replay
  const btnReplay = document.getElementById("btn-replay");
  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      noAttempts = 0;
      currentMemoryIndex = 0;
      const btnNo = document.getElementById("btn-no");
      const btnYes = document.getElementById("btn-yes");
      if (btnNo) {
        btnNo.classList.remove("teleporting");
        btnNo.style.display = "";
        btnNo.style.position = "";
        btnNo.style.left = "";
        btnNo.style.top = "";
        btnNo.textContent = NO_BUTTON_TEXTS[0];
      }
      if (btnYes) {
        btnYes.style.transform = "scale(1)";
      }
      document.getElementById("envelope").classList.remove("open");
      goToStage(1);
    });
  }

  // Music toggle
  const musicToggle = document.getElementById("btn-music-toggle");
  if (musicToggle) {
    musicToggle.addEventListener("click", toggleMusic);
  }

  // Customizer modal
  const openCustomizerBtn = document.getElementById("btn-open-customizer");
  const closeCustomizerBtn = document.getElementById("btn-close-customizer");
  const modalOverlay = document.getElementById("customizer-modal");
  
  if (openCustomizerBtn) {
    openCustomizerBtn.addEventListener("click", () => {
      populateCustomizerForm();
      modalOverlay.classList.add("active");
    });
  }

  if (closeCustomizerBtn) {
    closeCustomizerBtn.addEventListener("click", () => {
      modalOverlay.classList.remove("active");
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove("active");
    });
  }

  // Theme selection pills
  document.querySelectorAll(".theme-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".theme-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const selectedTheme = pill.getAttribute("data-theme");
      config.theme = selectedTheme;
      document.body.className = selectedTheme !== "rose" ? `theme-${selectedTheme}` : "";
      generateShareURL();
    });
  });

  // Save / Copy in customizer
  const form = document.getElementById("customizer-form");
  if (form) {
    form.addEventListener("input", () => {
      readCustomizerForm();
      generateShareURL();
    });
  }

  const btnCopyShare = document.getElementById("btn-copy-share");
  if (btnCopyShare) {
    btnCopyShare.addEventListener("click", () => {
      const shareInput = document.getElementById("share-url-input");
      shareInput.select();
      navigator.clipboard.writeText(shareInput.value).then(() => {
        showToast("💌 Shareable link copied to clipboard!");
      }).catch(() => {
        document.execCommand("copy");
        showToast("💌 Link copied!");
      });
    });
  }

  const btnApplyModal = document.getElementById("btn-apply-modal");
  if (btnApplyModal) {
    btnApplyModal.addEventListener("click", () => {
      readCustomizerForm();
      applyConfig();
      modalOverlay.classList.remove("active");
      showToast("✨ Changes applied successfully!");
    });
  }
}

// ==========================================================================
// 4. CELEBRATION & YES LOGIC
// ==========================================================================
function handleYesClick() {
  const btnNo = document.getElementById("btn-no");
  if (btnNo) {
    btnNo.style.display = "none";
  }
  goToStage(4);
  playVictoryFanfare();
  triggerFullConfetti();
  
  // Update character to joyful celebration
  const characterBox = document.getElementById("stage-4-character");
  if (characterBox) {
    characterBox.classList.add("celebrating");
  }
}

// ==========================================================================
// 5. SELF-CONTAINED CANVAS CONFETTI & HEARTS
// ==========================================================================
function triggerFullConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffd166", "#06d6a0", "#118ab2", "#a06cd5", "#ffffff"];
  const shapes = ["circle", "rect", "heart"];

  for (let i = 0; i < 180; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() * 200 - 100),
      y: canvas.height / 2 + 50,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() * -18) - 6,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.35,
      friction: 0.98,
      opacity: 1
    });
  }

  let animationFrame;
  let startTime = Date.now();

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.rotation += p.rotationSpeed;
      if (elapsed > 2000) {
        p.opacity -= 0.015;
      }

      if (p.opacity > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === "heart") {
          drawHeart(ctx, 0, 0, p.size);
        }
        ctx.restore();
      }
    });

    if (elapsed < 5000) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      canvas.remove();
    }
  }

  render();
}

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.5, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.5, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
}

function createMiniHearts(x, y) {
  const container = document.body;
  const count = 5;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.textContent = ["💖", "🥺", "💨", "✨", "🌸"][Math.floor(Math.random() * 5)];
    heart.style.position = "fixed";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = "1.2rem";
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "100";
    heart.style.transition = "all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)";
    heart.style.opacity = "1";
    container.appendChild(heart);

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 60 + 30;
    const destX = x + Math.cos(angle) * dist;
    const destY = y + Math.sin(angle) * dist;

    requestAnimationFrame(() => {
      heart.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(1.3)`;
      heart.style.opacity = "0";
    });

    setTimeout(() => heart.remove(), 750);
  }
}

// Background Floating Ambient Particles
function initAmbientHearts() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const particles = [];
  const maxParticles = 24;

  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 14 + 10,
      speedY: Math.random() * 0.8 + 0.3,
      swingSpeed: Math.random() * 0.02 + 0.01,
      swingOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.35 + 0.15,
      color: ["#ff4d6d", "#ff758f", "#ffb3c6", "#ffffff"][Math.floor(Math.random() * 4)]
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speedY;
      p.swingOffset += p.swingSpeed;
      p.x += Math.sin(p.swingOffset) * 0.5;

      if (p.y < -30) {
        p.y = canvas.height + 20;
        p.x = Math.random() * canvas.width;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      drawHeart(ctx, p.x, p.y, p.size);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// ==========================================================================
// 6. ROMANTIC MUSIC BOX & SOUND EFFECTS (WEB AUDIO API SYNTHESIZER)
// Zero external audio files required! 100% offline & instantaneous!
// ==========================================================================
function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Warm music box / Kalimba note synth
function playMusicBoxNote(freq, time, duration = 1.2) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Pure sine with gentle overtone for music box charm
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);

  // Attack, Decay, Sustain, Release envelope
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.exponentialRampToValueAtTime(0.22, time + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + duration);
}

// Sweet romantic chord progression (Canon in D / Can't Help Falling in Love inspired)
const ROMANTIC_MELODY = [
  // Chord 1 (C)
  { note: 261.63, delay: 0 }, { note: 329.63, delay: 0.35 }, { note: 392.00, delay: 0.7 }, { note: 523.25, delay: 1.05 },
  // Chord 2 (G)
  { note: 196.00, delay: 1.4 }, { note: 246.94, delay: 1.75 }, { note: 293.66, delay: 2.1 }, { note: 392.00, delay: 2.45 },
  // Chord 3 (Am)
  { note: 220.00, delay: 2.8 }, { note: 261.63, delay: 3.15 }, { note: 329.63, delay: 3.5 }, { note: 440.00, delay: 3.85 },
  // Chord 4 (F)
  { note: 174.61, delay: 4.2 }, { note: 220.00, delay: 4.55 }, { note: 261.63, delay: 4.9 }, { note: 349.23, delay: 5.25 }
];

function playMelodyLoop() {
  if (!isAudioPlaying) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  ROMANTIC_MELODY.forEach(m => {
    playMusicBoxNote(m.note, now + m.delay, 1.4);
  });
}

function toggleMusic() {
  const btn = document.getElementById("btn-music-toggle");
  if (isAudioPlaying) {
    isAudioPlaying = false;
    if (musicInterval) clearInterval(musicInterval);
    btn.classList.remove("playing");
    btn.setAttribute("title", "Play Music");
    showToast("🎵 Music muted");
  } else {
    isAudioPlaying = true;
    getAudioContext();
    btn.classList.add("playing");
    btn.setAttribute("title", "Pause Music");
    playMelodyLoop();
    musicInterval = setInterval(playMelodyLoop, 5800);
    showToast("🎵 Playing sweet romantic tune...");
  }
}

// Single tone chime
function playChime(freq = 523.25) {
  try {
    const ctx = getAudioContext();
    playMusicBoxNote(freq, ctx.currentTime, 0.8);
  } catch (e) {}
}

// Evasive cute whoosh/boing sound
function playEvasionSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {}
}

// Victory Fanfare when "YES" is clicked
function playVictoryFanfare() {
  try {
    const ctx = getAudioContext();
    const notes = [
      { f: 523.25, d: 0.15, offset: 0 },
      { f: 659.25, d: 0.15, offset: 0.16 },
      { f: 783.99, d: 0.15, offset: 0.32 },
      { f: 1046.5, d: 0.6,  offset: 0.48 }
    ];

    const now = ctx.currentTime;
    notes.forEach(n => {
      playMusicBoxNote(n.f, now + n.offset, n.d);
    });
  } catch (e) {}
}

// ==========================================================================
// 7. CUSTOMIZER FORM & SHAREABLE LINK GENERATOR
// ==========================================================================
function populateCustomizerForm() {
  document.getElementById("cust-crush-name").value = config.crushName;
  document.getElementById("cust-sender-name").value = config.senderName;
  document.getElementById("cust-question").value = config.question;
  document.getElementById("cust-whatsapp").value = config.whatsappNumber;
  document.getElementById("cust-m1").value = config.memories[0].text;
  document.getElementById("cust-m2").value = config.memories[1].text;
  document.getElementById("cust-m3").value = config.memories[2].text;
  document.getElementById("cust-letter").value = config.letter;

  // Active theme pill
  document.querySelectorAll(".theme-pill").forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-theme") === config.theme);
  });

  generateShareURL();
}

function readCustomizerForm() {
  config.crushName = document.getElementById("cust-crush-name").value.trim() || DEFAULT_CONFIG.crushName;
  config.senderName = document.getElementById("cust-sender-name").value.trim() || DEFAULT_CONFIG.senderName;
  config.question = document.getElementById("cust-question").value.trim() || DEFAULT_CONFIG.question;
  config.whatsappNumber = document.getElementById("cust-whatsapp").value.trim();
  config.memories[0].text = document.getElementById("cust-m1").value.trim() || DEFAULT_CONFIG.memories[0].text;
  config.memories[1].text = document.getElementById("cust-m2").value.trim() || DEFAULT_CONFIG.memories[1].text;
  config.memories[2].text = document.getElementById("cust-m3").value.trim() || DEFAULT_CONFIG.memories[2].text;
  config.letter = document.getElementById("cust-letter").value.trim() || DEFAULT_CONFIG.letter;
}

function generateShareURL() {
  const baseURL = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();

  params.set("name", config.crushName);
  params.set("sender", config.senderName);
  params.set("q", config.question);
  if (config.whatsappNumber) params.set("phone", config.whatsappNumber);
  if (config.theme && config.theme !== "rose") params.set("theme", config.theme);
  params.set("m1", config.memories[0].text);
  params.set("m2", config.memories[1].text);
  params.set("m3", config.memories[2].text);
  params.set("letter", config.letter);

  const fullURL = `${baseURL}#${params.toString()}`;
  const shareInput = document.getElementById("share-url-input");
  if (shareInput) {
    shareInput.value = fullURL;
  }
}

// Toast Notification
function showToast(msg) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}
