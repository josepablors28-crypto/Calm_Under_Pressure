const screens = document.querySelectorAll('.screen');
const SCENARIOS = ['context-eli', 'context-zidane', 'context-mj'];

let activeTimer = null;
let activeAudioId = null;
let scenarioOrder = [];
let scenarioIndex = 0;

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

function stopAllAudio() {
  document.querySelectorAll('audio').forEach(a => {
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

function chaotify(el, min, max) {
  const text = el.textContent;
  const words = text.trim().split(/\s+/);
  el.innerHTML = words
    .map(w => {
      const size = (Math.random() * (max - min) + min).toFixed(1);
      return `<span style="font-size:${size}px">${w}</span>`;
    })
    .join(' ');
}

document.querySelectorAll('.context .prompt').forEach(el => chaotify(el, 13, 27));

window.addEventListener('hashchange', () => resolveHash(currentId()));
window.addEventListener('DOMContentLoaded', () => resolveHash(currentId()));