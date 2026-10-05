const screens = document.querySelectorAll('.screen');
const SCENARIOS = ['context-eli', 'context-zidane', 'context-mj'];
 
let activeTimer = null;
let activeAudioId = null;
let scenarioOrder = [];
let scenarioIndex = 0;
 
/* ---------- Themes ---------- */
 
// Word colors and background ball for each scenario
const THEMES = {
  eli:    { palette: ['#0b2265', '#a71930'], ball: 'football' },   // Giants blue & red
  zidane: { palette: ['#0055a4', '#ef4135'], ball: 'soccer' },     // France bleu & rouge
  mj:     { palette: ['#ce1141', '#000000'], ball: 'basketball' }  // Bulls red & black
};
 
/* ---------- Ball SVGs ---------- */
 
let clipCounter = 0;
 
const BALLS = {
  basketball: () =>
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#e8742a" stroke="#1a1a1a" stroke-width="4"/><path d="M4 50 H96 M50 4 V96 M15 15 Q50 50 15 85 M85 15 Q50 50 85 85" fill="none" stroke="#1a1a1a" stroke-width="4"/></svg>',
 
  football: () =>
    '<svg viewBox="0 0 100 60"><ellipse cx="50" cy="30" rx="48" ry="28" fill="#a0522d" stroke="#1a1a1a" stroke-width="4"/><line x1="18" y1="30" x2="82" y2="30" stroke="#f5f5f5" stroke-width="4"/><line x1="40" y1="24" x2="40" y2="36" stroke="#f5f5f5" stroke-width="3"/><line x1="50" y1="22" x2="50" y2="38" stroke="#f5f5f5" stroke-width="3"/><line x1="60" y1="24" x2="60" y2="36" stroke="#f5f5f5" stroke-width="3"/></svg>',
 
  // Classic black-and-white ball: center pentagon, five edge pentagons
  // clipped by the rim, seams between them. Each copy gets a unique
  // clipPath id so balls on hidden screens still clip correctly.
  soccer: () => {
    const id = 'soccer-clip-' + (++clipCounter);
    return '<svg viewBox="0 0 100 100"><defs><clipPath id="' + id + '"><circle cx="50" cy="50" r="44"/></clipPath></defs>' +
      '<circle cx="50" cy="50" r="46" fill="#fdf6e3"/>' +
      '<g clip-path="url(#' + id + ')" stroke="#1a1a1a" stroke-width="2.5" stroke-linejoin="round" fill="none">' +
      '<polygon points="50.0,36.0 63.3,45.7 58.2,61.3 41.8,61.3 36.7,45.7" fill="#1a1a1a"/><polygon points="50.0,20.0 38.6,11.7 42.9,-1.7 57.1,-1.7 61.4,11.7" fill="#1a1a1a"/><line x1="50.0" y1="36.0" x2="50.0" y2="20.0"/><polygon points="78.5,40.7 82.9,27.3 97.0,27.3 101.4,40.7 89.9,49.0" fill="#1a1a1a"/><line x1="63.3" y1="45.7" x2="78.5" y2="40.7"/><polygon points="67.6,74.3 81.7,74.3 86.1,87.7 74.7,96.0 63.3,87.7" fill="#1a1a1a"/><line x1="58.2" y1="61.3" x2="67.6" y2="74.3"/><polygon points="32.4,74.3 36.7,87.7 25.3,96.0 13.9,87.7 18.3,74.3" fill="#1a1a1a"/><line x1="41.8" y1="61.3" x2="32.4" y2="74.3"/><polygon points="21.5,40.7 10.1,49.0 -1.4,40.7 3.0,27.3 17.1,27.3" fill="#1a1a1a"/><line x1="36.7" y1="45.7" x2="21.5" y2="40.7"/><polyline points="61.4,11.7 72.3,19.3 82.9,27.3"/><line x1="72.3" y1="19.3" x2="79.4" y2="9.5"/><polyline points="89.9,49.0 86.1,61.7 81.7,74.3"/><line x1="86.1" y1="61.7" x2="97.6" y2="65.5"/><polyline points="63.3,87.7 50.0,88.0 36.7,87.7"/><line x1="50.0" y1="88.0" x2="50.0" y2="100.0"/><polyline points="18.3,74.3 13.9,61.7 10.1,49.0"/><line x1="13.9" y1="61.7" x2="2.4" y2="65.5"/><polyline points="17.1,27.3 27.7,19.3 38.6,11.7"/><line x1="27.7" y1="19.3" x2="20.6" y2="9.5"/>' +
      '</g><circle cx="50" cy="50" r="46" fill="none" stroke="#1a1a1a" stroke-width="4"/></svg>';
  }
};
 
// Six fixed slots around the edges, away from the centered text
const BALL_SLOTS = [
  { top: '10%', left: '8%',  size: 100, drift: 13, spin: 8,  delay: 0 },
  { top: '62%', left: '78%', size: 100, drift: 16, spin: 11, delay: -2 },
  { top: '18%', left: '74%', size: 100, drift: 12, spin: 7,  delay: -5 },
  { top: '72%', left: '18%', size: 65,  drift: 15, spin: 10, delay: -8 },
  { top: '42%', left: '6%',  size: 65,  drift: 11, spin: 9,  delay: -3 },
  { top: '6%',  left: '52%', size: 65,  drift: 17, spin: 12, delay: -10 }
];
 
const MIXED = ['basketball', 'football', 'soccer', 'basketball', 'soccer', 'football'];
 
function fillBalls(container, kinds) {
  container.innerHTML = BALL_SLOTS.map((s, i) => {
    const kind = kinds[i % kinds.length];
    return '<div class="ball" style="top:' + s.top + ';left:' + s.left + ';width:' + s.size + 'px;' +
      'animation-duration:' + s.drift + 's;animation-delay:' + s.delay + 's">' +
      BALLS[kind]().replace('<svg ', '<svg style="animation-duration:' + s.spin + 's" ') +
      '</div>';
  }).join('');
}
 
// Intro: a mix of all three sports
document.querySelectorAll('[data-balls="mixed"]').forEach(el => fillBalls(el, MIXED));
 
// Scenario screens: only that sport's ball
document.querySelectorAll('.screen[data-theme]').forEach(screen => {
  const theme = THEMES[screen.dataset.theme];
  if (!theme) return;
  const layer = document.createElement('div');
  layer.className = 'floating-balls';
  layer.setAttribute('aria-hidden', 'true');
  fillBalls(layer, [theme.ball]);
  screen.prepend(layer);
});
 
/* ---------- Word styling ---------- */
 
// Splits an element's text into word spans with optional random size,
// tilt, vertical offset and theme color.
function styleWords(el, { min, max, tilt = 0, lift = 0, palette = null }) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w, i) => {
    const styles = [];
    if (min && max) styles.push('font-size:' + (Math.random() * (max - min) + min).toFixed(1) + 'px');
    if (tilt) styles.push('--rot:' + ((Math.random() * 2 - 1) * tilt).toFixed(1) + 'deg');
    if (lift) styles.push('--dy:' + ((Math.random() * 2 - 1) * lift).toFixed(1) + 'px');
    if (palette) styles.push('color:' + palette[Math.floor(Math.random() * palette.length)]);
    return '<span class="w" style="' + styles.join(';') + '">' + w + '</span>';
  }).join(' ');
}
 
document.querySelectorAll('.screen[data-theme]').forEach(screen => {
  const { palette } = THEMES[screen.dataset.theme];
 
  // Context story gets chaotic sizes; question prompts just get theme colors
  screen.querySelectorAll('.prompt').forEach(el => {
    if (screen.classList.contains('context')) {
      styleWords(el, { min: 13, max: 27, palette });
    } else {
      styleWords(el, { palette });
    }
  });
 
  // Answer options: uneven sizes, tilts and baselines, theme colors
  screen.querySelectorAll('.option').forEach(el =>
    styleWords(el, { min: 14, max: 26, tilt: 5, lift: 3, palette })
  );
});
 
/* ---------- Flow ---------- */
 
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
 
function goToNextScenario() {
  if (scenarioIndex < scenarioOrder.length) {
    const next = scenarioOrder[scenarioIndex];
    scenarioIndex++;
    window.location.hash = next;
  } else {
    window.location.hash = 'win';
  }
}
 
/* ---------- Audio ---------- */
 
const buzzer = document.getElementById('audio-buzzer');
 
// Stops the looping tracks only — the buzzer is left alone so it can
// finish playing over the game-over screen.
function stopAllAudio() {
  document.querySelectorAll('audio:not(#audio-buzzer)').forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
  activeAudioId = null;
}
 
function playAudioFor(screen) {
  const audioId = screen.getAttribute('data-audio');
  if (audioId === activeAudioId) return;
  stopAllAudio();
  if (audioId) {
    const audio = document.getElementById(audioId);
    if (audio) {
      audio.play().catch(() => {});
      activeAudioId = audioId;
    }
  }
}
 
function playBuzzer() {
  if (!buzzer) return;
  buzzer.currentTime = 0;
  buzzer.play().catch(() => {});
}
 
// Browsers block audio until the user has clicked something. If a track
// was blocked (e.g. after refreshing mid-game), start it on the next click.
document.addEventListener('pointerdown', () => {
  const current = activeAudioId && document.getElementById(activeAudioId);
  if (current && current.paused) current.play().catch(() => {});
});
 
// Logs the exact path of any image or audio file that fails to load
document.querySelectorAll('img, audio').forEach(el => {
  el.addEventListener('error', () => {
    console.warn('Could not load file: ' + el.getAttribute('src') +
      '  (check the filename, capitalization and extension match exactly)');
  });
});
 
// Buzzer on wrong-answer clicks only (timeouts stay silent)
document.addEventListener('click', e => {
  if (e.target.closest('.option[href="#gameover"]')) playBuzzer();
});
 
/* ---------- Timers & screens ---------- */
 
function clearActiveTimer() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
}
 
function startTimerBar(target, seconds) {
  const fill = target.querySelector('.timer-fill');
  if (!fill) return;
  fill.classList.remove('running');
  fill.style.animationDuration = '';
  fill.style.transform = 'scaleX(1)';
  void fill.offsetWidth;
  fill.style.animationDuration = seconds + 's';
  fill.classList.add('running');
}
 
function showScreen(id) {
  clearActiveTimer();
  screens.forEach(s => s.classList.remove('active'));
 
  const target = document.getElementById(id) || document.getElementById('intro');
  target.classList.add('active');
 
  if (target.id === 'intro') {
    scenarioOrder = shuffle(SCENARIOS);
    scenarioIndex = 0;
  }
 
  playAudioFor(target);
 
  if (target.hasAttribute('data-question')) {
    const seconds = parseFloat(target.getAttribute('data-limit')) || 6;
    startTimerBar(target, seconds);
    activeTimer = setTimeout(() => {
      window.location.hash = 'gameover';
    }, seconds * 1000);
  } else if (target.hasAttribute('data-context')) {
    const seconds = parseFloat(target.getAttribute('data-limit')) || 20;
    startTimerBar(target, seconds);
    const next = target.getAttribute('data-next');
    activeTimer = setTimeout(() => {
      if (next) window.location.hash = next;
    }, seconds * 1000);
  }
}
 
function currentId() {
  return window.location.hash ? window.location.hash.slice(1) : 'intro';
}
 
function resolveHash(id) {
  if (id === 'next-scenario') {
    goToNextScenario();
    return;
  }
  showScreen(id);
}
 
window.addEventListener('hashchange', () => resolveHash(currentId()));
window.addEventListener('DOMContentLoaded', () => resolveHash(currentId()));