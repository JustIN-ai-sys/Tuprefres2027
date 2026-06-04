/* Tu préfères 2027 — Interface */

const app = document.getElementById('app');

// Extensions connues pour les photos
const PHOTO_EXT = {
  j_guedj: 'webp',
  d_lisnard: 'webp',
  c_autain: 'png',
};

function photoUrl(id) {
  const ext = PHOTO_EXT[id] || 'jpg';
  return `/images/candidates/${id}.${ext}`;
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function photoOrInitials(c, size = 'normal') {
  const cls = size === 'large' ? 'winner-photo' : 'rank-photo';
  const clsPh = size === 'large' ? 'winner-photo-placeholder' : 'rank-photo-placeholder';
  return `
    <img class="${cls}" src="${photoUrl(c.id)}" alt="${escapeHtml(c.name)}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="${clsPh}" style="background:${escapeHtml(c.color)};display:none">
      ${initials(c.name)}
    </div>
  `;
}

let state = {
  screen: 'home',
  sessionId: null,
  questions: [],
  candidates: [],
  positions: {},
  scores: {},
  currentIndex: 0,
  totalQuestions: 10,
};

function blobs() {
  return `
    <div class="blob blob-purple"></div>
    <div class="blob blob-blue"></div>
    <div class="blob blob-purple-2"></div>
  `;
}

function render() {
  switch (state.screen) {
    case 'home':    renderHome(); break;
    case 'loading': renderLoading(); break;
    case 'quiz':    renderQuiz(); break;
    case 'results': renderResults(); break;
  }
}

/* ── HOME ── */
function renderHome() {
  const total = state.questions.length || 100;
  app.innerHTML = `
    ${blobs()}
    <div class="screen screen-home">
      <span class="home-badge">Présidentielle 2027</span>

      <h1 class="home-title">
        Tu préfères<br>
        <span class="home-title-accent">2027</span>
      </h1>

      <p class="home-subtitle">
        Le jeu politique qui te fait choisir entre deux propositions opposées.
        Choisis un format, réponds aux dilemmes, puis découvre ton classement.
      </p>

      <div class="format-list">
        <button class="format-card" data-limit="10">
          <span class="format-label">Test rapide</span>
          <span class="format-count">10 questions</span>
          <div class="format-meta"><span class="clock">⏱</span> ≈ 1 minute</div>
          <p class="format-desc">Pour découvrir une première tendance.</p>
        </button>

        <button class="format-card recommended" data-limit="40">
          <span class="format-badge">✓ Recommandé</span>
          <span class="format-label">Test standard</span>
          <span class="format-count">40 questions</span>
          <div class="format-meta"><span class="clock">⏱</span> ≈ 4 à 6 min</div>
          <p class="format-desc">Le meilleur équilibre entre rapidité et fiabilité.</p>
        </button>

        <button class="format-card" data-limit="100">
          <span class="format-label">Test complet</span>
          <span class="format-count">100 questions</span>
          <div class="format-meta"><span class="clock">⏱</span> ≈ 10 à 15 min</div>
          <p class="format-desc">Pour un résultat plus détaillé et plus stable.</p>
        </button>
      </div>

      <div class="home-footer-bar">
        <p>Anonyme · ${state.candidates.length || 23} candidats · ${total} questions au total</p>
      </div>

      <div class="home-links">
        <button class="link-btn" id="btn-methodologie">Méthodologie</button>
        <button class="link-btn" id="btn-admin">Admin</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.format-card').forEach(btn => {
    btn.addEventListener('click', () => startQuiz(parseInt(btn.dataset.limit)));
  });
  document.getElementById('btn-methodologie').addEventListener('click', () => {
    window.location.href = '/methodologie';
  });
  document.getElementById('btn-admin').addEventListener('click', () => {
    window.location.href = '/admin';
  });
}

/* ── LOADING ── */
function renderLoading() {
  app.innerHTML = `
    ${blobs()}
    <div class="screen screen-loading">
      <div class="spinner"></div>
      <p style="color:var(--text-muted);font-size:0.9rem;font-weight:600;">Chargement…</p>
    </div>
  `;
}

/* ── START QUIZ ── */
async function startQuiz(limit) {
  state.screen = 'loading';
  state.totalQuestions = limit;
  render();

  try {
    const [sessionRes, questionsRes, candidatesRes, positionsRes] = await Promise.all([
      fetch('/api/session', { method: 'POST' }),
      fetch(`/api/questions?limit=${limit}`),
      fetch('/api/candidates'),
      fetch('/api/positions'),
    ]);

    const sessionData = await sessionRes.json();
    const questions   = await questionsRes.json();
    const candidates  = await candidatesRes.json();
    const positions   = await positionsRes.json();

    const scores = {};
    candidates.forEach(c => { scores[c.id] = 0; });

    Object.assign(state, {
      sessionId: sessionData.sessionId,
      questions,
      candidates,
      positions,
      scores,
      currentIndex: 0,
      screen: 'quiz',
    });
    render();
  } catch (err) {
    console.error(err);
    alert('Erreur lors du chargement. Réessaie dans quelques secondes.');
    state.screen = 'home';
    render();
  }
}

/* ── QUIZ ── */
function renderQuiz() {
  const q   = state.questions[state.currentIndex];
  const cur = state.currentIndex + 1;
  const tot = state.questions.length;

  app.innerHTML = `
    ${blobs()}
    <div class="screen screen-quiz">
      <div class="quiz-topbar">
        <button class="btn-back" id="btn-back">←</button>
        <span class="quiz-counter">${cur} / ${tot}</span>
        <span class="quiz-theme-pill">${escapeHtml(q.theme)}</span>
      </div>

      <p class="tu-preferes-label">Tu préfères</p>

      <div class="quiz-body">
        <button class="option-card option-card-a" data-choice="A">
          <span class="option-text">${escapeHtml(q.optionA)}</span>
        </button>

        <div class="ou-separator">ou</div>

        <button class="option-card option-card-b" data-choice="B">
          <span class="option-text">${escapeHtml(q.optionB)}</span>
        </button>
      </div>

      <div class="quiz-footer">
        <button class="neutral-btn" data-choice="N">Neutre / Sans opinion</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });

  document.querySelectorAll('[data-choice]').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.choice));
  });
}

async function handleAnswer(choice) {
  const q = state.questions[state.currentIndex];

  // Feedback visuel
  const cardA = document.querySelector('.option-card-a');
  const cardB = document.querySelector('.option-card-b');
  const neutralBtn = document.querySelector('.neutral-btn');
  if (choice === 'A' && cardA) cardA.classList.add('selected');
  if (choice === 'B' && cardB) cardB.classList.add('selected');
  if (choice === 'N' && neutralBtn) neutralBtn.classList.add('selected');

  // Scoring
  if (choice !== 'N') {
    state.candidates.forEach(c => {
      if (state.positions[c.id]?.[q.id] === choice) {
        state.scores[c.id] = (state.scores[c.id] || 0) + 1;
      }
    });
  }

  // Enregistrement
  fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: state.sessionId, questionId: q.id, choice }),
  }).catch(() => {});

  await sleep(200);

  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) {
    await finishQuiz();
  } else {
    renderQuiz();
  }
}

async function finishQuiz() {
  state.screen = 'loading';
  render();
  try {
    await fetch('/api/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        scores: state.scores,
        questionCount: state.questions.length,
      }),
    });
  } catch (_) {}
  state.screen = 'results';
  render();
}

/* ── RESULTS ── */
function renderResults() {
  const total = state.questions.length;
  const sorted = state.candidates
    .map(c => ({ ...c, score: state.scores[c.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const maxScore = sorted[0]?.score || 1;
  const first = sorted[0];
  const firstPct = Math.round(((first?.score || 0) / total) * 100);

  // Winner card
  const winnerHtml = `
    <div class="winner-card">
      <div class="winner-badge">🏆 Votre candidat</div>
      <div class="winner-content">
        <div style="position:relative;flex-shrink:0">
          ${photoOrInitials(first, 'large')}
        </div>
        <div class="winner-info">
          <div class="winner-name">${escapeHtml(first.name)}</div>
          <div class="winner-party">${escapeHtml(first.party)}</div>
          <div>
            <span class="winner-pct">${firstPct}%</span>
            <span class="winner-pct-label"> de compatibilité</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // TOP 3
  const top3Html = `
    <div class="ranking-section">
      <div class="ranking-section-label">Top 3</div>
      ${sorted.slice(0, 3).map((c, i) => rankRow(c, i, total, maxScore, true)).join('')}
    </div>
  `;

  // Classement complet
  const fullHtml = `
    <div class="ranking-section">
      <div class="ranking-section-label">Classement complet</div>
      ${sorted.map((c, i) => rankRow(c, i, total, maxScore, false)).join('')}
    </div>
  `;

  app.innerHTML = `
    ${blobs()}
    <div class="screen screen-results">
      <div class="results-topbar">
        <button class="btn-close" id="btn-close">✕</button>
        <h2>Vos résultats</h2>
      </div>
      <div class="results-body">
        ${winnerHtml}
        ${top3Html}
        ${fullHtml}
      </div>
      <div class="results-actions" style="margin-top:1.25rem">
        <button class="btn-primary" id="btn-restart">Recommencer un test</button>
        <button class="btn-secondary" id="btn-home">Retour à l'accueil</button>
      </div>
    </div>
  `;

  document.getElementById('btn-close').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    startQuiz(state.totalQuestions);
  });
  document.getElementById('btn-home').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
}

function rankRow(c, idx, total, maxScore, showPhoto) {
  const pct = Math.round((c.score / total) * 100);
  const barW = maxScore > 0 ? Math.round((c.score / maxScore) * 100) : 0;
  const badgeCls = idx === 0 ? 'rank-badge-1' : 'rank-badge-other';

  return `
    <div class="ranking-row">
      <div class="rank-badge ${badgeCls}">${idx + 1}</div>
      ${showPhoto ? `
        <div style="position:relative;flex-shrink:0">
          ${photoOrInitials(c, 'small')}
        </div>
      ` : ''}
      <div class="rank-info">
        <div class="rank-name">${escapeHtml(c.name)}</div>
        <div class="rank-party">${escapeHtml(c.party)}</div>
      </div>
      <div class="rank-right">
        <span class="rank-pct" style="color:${escapeHtml(c.color)}">${pct}%</span>
        <div class="rank-bar-track">
          <div class="rank-bar-fill" style="width:${barW}%;background:${escapeHtml(c.color)}"></div>
        </div>
      </div>
    </div>
  `;
}

/* ── Utils ── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Init : précharge les métadonnées ── */
async function init() {
  try {
    const [candidatesRes, questionsRes] = await Promise.all([
      fetch('/api/candidates'),
      fetch('/api/questions?limit=100'),
    ]);
    state.candidates = await candidatesRes.json();
    state.questions  = await questionsRes.json();
  } catch (_) {}
  render();
}

init();
