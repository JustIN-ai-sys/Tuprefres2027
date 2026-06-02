/* Tu préfères 2027 — Single Page App */

const app = document.getElementById('app');

let state = {
  screen: 'home',
  sessionId: null,
  questions: [],
  candidates: [],
  positions: {},
  scores: {},
  currentIndex: 0,
  totalQuestions: 10,
  answers: [],
};

function render() {
  switch (state.screen) {
    case 'home': renderHome(); break;
    case 'loading': renderLoading(); break;
    case 'quiz': renderQuiz(); break;
    case 'results': renderResults(); break;
  }
}

function renderHome() {
  app.innerHTML = `
    <div class="screen-home">
      <div class="home-header">
        <h1 class="home-title">Tu préfères 2027</h1>
        <p class="home-subtitle">
          Le jeu politique qui te fait choisir entre deux propositions opposées.
          Choisis un format, réponds aux dilemmes, puis découvre ton classement.
        </p>
      </div>

      <div class="format-cards">
        <button class="format-card" data-limit="10">
          <span class="format-icon">⚡</span>
          <div class="format-info">
            <span class="format-name">Test rapide</span>
            <span class="format-count">10 questions</span>
            <span class="format-time">environ 1 minute</span>
          </div>
        </button>
        <button class="format-card" data-limit="40">
          <span class="format-icon">🧭</span>
          <div class="format-info">
            <span class="format-name">Test standard</span>
            <span class="format-count">40 questions</span>
            <span class="format-time">environ 4 à 6 minutes</span>
          </div>
        </button>
        <button class="format-card" data-limit="100">
          <span class="format-icon">🏛️</span>
          <div class="format-info">
            <span class="format-name">Test complet</span>
            <span class="format-count">100 questions</span>
            <span class="format-time">environ 10 à 15 minutes</span>
          </div>
        </button>
      </div>

      <div class="home-footer">
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

function renderLoading() {
  app.innerHTML = `
    <div class="screen-loading">
      <div class="spinner"></div>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Chargement…</p>
    </div>
  `;
}

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
    const questions = await questionsRes.json();
    const candidates = await candidatesRes.json();
    const positions = await positionsRes.json();

    const scores = {};
    candidates.forEach(c => { scores[c.id] = 0; });

    state.sessionId = sessionData.sessionId;
    state.questions = questions;
    state.candidates = candidates;
    state.positions = positions;
    state.scores = scores;
    state.currentIndex = 0;
    state.answers = [];
    state.screen = 'quiz';
    render();
  } catch (err) {
    console.error(err);
    alert('Erreur lors du chargement. Réessaie dans quelques secondes.');
    state.screen = 'home';
    render();
  }
}

function renderQuiz() {
  const q = state.questions[state.currentIndex];
  const progress = state.currentIndex / state.questions.length;
  const progressPct = Math.round(progress * 100);

  app.innerHTML = `
    <div class="screen-quiz">
      <div class="quiz-topbar">
        <button class="btn-back" id="btn-back">←</button>
        <div class="progress-wrap">
          <span class="progress-label">${state.currentIndex + 1} / ${state.questions.length}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>
      </div>

      <div class="quiz-body">
        <span class="question-theme">${escapeHtml(q.theme)}</span>

        <p class="question-text">
          Tu préfères <span class="highlight">${escapeHtml(q.optionA)}</span>
          ou <span class="highlight">${escapeHtml(q.optionB)}</span> ?
        </p>

        <div class="options-grid">
          <button class="option-card option-a" data-choice="A">
            <span class="option-label">Option A</span>
            <span class="option-text">${escapeHtml(q.optionA)}</span>
          </button>
          <button class="option-card option-b" data-choice="B">
            <span class="option-label">Option B</span>
            <span class="option-text">${escapeHtml(q.optionB)}</span>
          </button>
        </div>

        <button class="neutral-btn" data-choice="N">Neutre</button>
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

  // Visual feedback
  if (choice === 'A') {
    document.querySelector('.option-card.option-a')?.classList.add('selected-a');
  } else if (choice === 'B') {
    document.querySelector('.option-card.option-b')?.classList.add('selected-b');
  } else {
    document.querySelector('.neutral-btn')?.classList.add('selected-n');
  }

  // Scoring
  if (choice !== 'N') {
    state.candidates.forEach(c => {
      const pos = state.positions[c.id]?.[q.id];
      if (pos === choice) {
        state.scores[c.id] = (state.scores[c.id] || 0) + 1;
      }
    });
  }

  // Record vote
  state.answers.push({ questionId: q.id, choice });

  // Fire and forget vote recording
  fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: state.sessionId,
      questionId: q.id,
      choice,
    }),
  }).catch(() => {});

  // Brief delay for visual feedback
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

function renderResults() {
  const sorted = state.candidates
    .map(c => ({ ...c, score: state.scores[c.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const maxScore = sorted[0]?.score || 1;
  const total = state.questions.length;
  const first = sorted[0];

  const rankingItems = sorted.slice(1).map((c, i) => {
    const pct = Math.round((c.score / total) * 100);
    const barWidth = Math.round((c.score / maxScore) * 100);
    return `
      <div class="ranking-item">
        <span class="rank-num">${i + 2}</span>
        <span class="rank-dot" style="background: ${escapeHtml(c.color)}"></span>
        <div class="rank-info">
          <div class="rank-name">${escapeHtml(c.name)}</div>
          <div class="rank-party">${escapeHtml(c.party)}</div>
        </div>
        <div class="rank-bar-wrap">
          <span class="rank-score">${pct}%</span>
          <div class="rank-bar">
            <div class="rank-bar-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const firstPct = Math.round(((first?.score || 0) / total) * 100);

  app.innerHTML = `
    <div class="screen-results">
      <h2 class="results-title">Ton classement</h2>
      <p class="results-subtitle">
        Sur ${total} questions, voici les candidats les plus proches de tes positions.
      </p>

      <div class="podium-card">
        <div class="podium-medal">🥇</div>
        <div class="podium-name">${escapeHtml(first?.name || '')}</div>
        <div class="podium-party">${escapeHtml(first?.party || '')}</div>
        <div class="podium-score">${firstPct}%</div>
        <div class="podium-score-label">de compatibilité</div>
      </div>

      <div class="ranking-list">
        ${rankingItems}
      </div>

      <div class="results-actions">
        <button class="btn-primary" id="btn-restart">Recommencer un test</button>
        <button class="btn-secondary" id="btn-home">Retour à l'accueil</button>
      </div>
    </div>
  `;

  document.getElementById('btn-restart').addEventListener('click', () => {
    startQuiz(state.totalQuestions);
  });
  document.getElementById('btn-home').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

render();
