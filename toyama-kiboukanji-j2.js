// toyama-kiboukanji-j2.js - 統合・構文チェック済み（安全版）

(() => {
  const $ = id => document.getElementById(id);

  // --- 基本データ ---
  const kanjiList = ['三', '五', '八', '九', '百', '千', '万', '億', '兆'];
  const bonusList = ['岳', '代'];
  const titleChars = ['き', 'ぼ', 'う', 'か', 'ん', 'じ'];
  const SCORE_KEY = 'kibou_scores';

  // --- オーディオ（安全初期化） ---
  let waveBGM = null;
  let storyBGM = null;
  let shamisenIntro = null;
  let bgmNormal = null;
  let bgmBonus = null;

  // 外部で本物が定義されるまでのプレースホルダ
  function wireTouchHandlers() { return; }

  function initAudio() {
   try {
      waveBGM = new Audio('audio/warayatakashi.mp3');
      waveBGM.loop = true;
      waveBGM.volume = 0.01;
    } catch (e) {
      waveBGM = null;
    }

    try {
      storyBGM = new Audio('audio/shamisen_intro.mp3');
      storyBGM.loop = true;
      storyBGM.volume = 0.02;
    } catch (e) {
      storyBGM = null;
    }

    try {
      shamisenIntro = new Audio('audio/shamisen_intro.mp3');
      shamisenIntro.volume = 0.001;
    } catch (e) {
      shamisenIntro = null;
    }

    try {
      bgmNormal = document.getElementById('bgmNormal');
    } catch (e) {
      bgmNormal = null;
    }

    try {
      bgmBonus = document.getElementById('bgmBonus');
    } catch (e) {
      bgmBonus = null;
    }
     }

  function safePlay(a) {
    try {
      a?.play?.().catch(() => {});
    } catch (e) {}
  }

  function playNormalBGM() {
    try {
      bgmBonus?.pause();
      if (bgmBonus) bgmBonus.currentTime = 0;
      if (bgmNormal) {
        bgmNormal.volume = 0.03;
        bgmNormal.play().catch(() => {});
      }
    } catch (e) {}
  }

  function playBonusBGM() {
    try {
      bgmNormal?.pause();
      if (bgmBonus) {
        bgmBonus.volume = 0.03;
        bgmBonus.play().catch(() => {});
      }
    } catch (e) {}
  }

  function stopAllBGM() {
    try {
      bgmNormal?.pause();
      bgmBonus?.pause();
      waveBGM?.pause();
      storyBGM?.pause();
      shamisenIntro?.pause();
    } catch (e) {}
  }

  // --- 画面スケール調整 ---
  function resizeCanvas() {
    const wrap = document.getElementById('wrap');
    if (!wrap) return;
    const scale = Math.min(window.innerWidth / 360, window.innerHeight / 720);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.transformOrigin = 'top center';
  }

  // --- 画面管理 ---
  function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
  }

  function showScreen(id) {
    hideAllScreens();
    const t = $(id) || document.getElementById(id);
    if (t) {
      t.classList.remove('hidden');
      t.classList.add('active');
    }
  }
   // --- transient controls ---
  let transientTimer = null;
  function showTransient(ms = 4000) {
    const transient = $('transientControls');
    if (!transient) return;
    const gameActive = $('game-screen')?.classList.contains('active');
    if (gameActive) return;
    transient.classList.add('visible');
    clearTimeout(transientTimer);
    transientTimer = setTimeout(() => transient.classList.remove('visible'), ms);
  }

  // =========================
  //  落ちる漢字モード（簡易）
  // =========================
  let canvas = null;
  let ctx = null;
  let fallingKanji = [];
  let fkInterval = null;
  let fkTimer = null;
  let fkScore = 0;
  let fkTimeLeft = 60;
  let fkCombo = 0;
  let fkLastHit = 0;

  function createKanji() {
    if (!canvas) return;
    const text = kanjiList[Math.floor(Math.random() * kanjiList.length)];
    const x = Math.random() * Math.max(0, canvas.width - 50);
  const y = -50;
    const speed = 2 + Math.random() * 3;
    fallingKanji.push({ text, x, y, speed });
  }

  function fkLoop() {
    if (!ctx || !canvas) {
      requestAnimationFrame(fkLoop);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px serif';
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < fallingKanji.length; i++) {
      const k = fallingKanji[i];
      k.y += k.speed;
      ctx.fillText(k.text, k.x, k.y);
      if (k.y > canvas.height + 50) {
        fallingKanji.splice(i, 1);
        i--;
      }
    }
    requestAnimationFrame(fkLoop);
  }

  function startFkGame() {
    fkScore = 0;
    fkTimeLeft = 60;
    fallingKanji = [];
    fkCombo = 0;
    fkLastHit = 0;
   if (fkInterval) clearInterval(fkInterval);
    if (fkTimer) clearInterval(fkTimer);
    fkInterval = setInterval(createKanji, 800);
    fkTimer = setInterval(() => {
      fkTimeLeft--;
      if (fkTimeLeft <= 0) endFkGame();
    }, 1000);
    requestAnimationFrame(fkLoop);
  }

  function endFkGame() {
    if (fkInterval) clearInterval(fkInterval);
    if (fkTimer) clearInterval(fkTimer);
    const res = $('result-score');
    if (res) res.textContent = fkScore;
    showScreen('result-screen');
  }

  function addFkScore(base) {
    const now = Date.now();
    if (now - fkLastHit < 1000) fkCombo++;
    else fkCombo = 1;
    fkLastHit = now;
    const bonus = base * fkCombo;
    fkScore += bonus;
    showComboEffect(fkCombo, bonus);
  }

  function onFkClick(e) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = 0; i < fallingKanji.length; i++) {
      const k = fallingKanji[i];
      const dx = x - (k.x + 20);
      const dy = y - (k.y - 20);
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
        fallingKanji.splice(i, 1);
        addFkScore(10);
        break;
      }
    }
  }

  // =========================
  //  きぼうかんじ（盤面）モード
  // =========================
  const ROWS = 12;
  const COLS = 6;
  const SIZE = 40;
  const OFFSET_X = 40;
  const OFFSET_Y = 140;

  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let cur = null;
  let gameScore = 0;
  let gameOver = false;
  let started = false;
  let fallInterval = 700;
  let lastFallTime = 0;
  let fastDrop = false;
  let chainCount = 0;
  let bonusMode = null;
  let bonusRemaining = 0;
  let selectedCell = null;
  let next1 = null;
  let next2 = null;
  let level = 'easy';
  let isPaused = false;

  class Piece {
    constructor(isPair = false) {
      if (isPair) {
        this.blocks = [
          { x: 2, y: 0, type: randomType() },
          { x: 3, y: 0, type: randomType() }
        ];
      } else {
        this.blocks = [
          { x: 2, y: 0, type: randomType() }
        ];
      }
    }
  }

  function randomType() {
    const isBonus = Math.random() < 0.12;
    return isBonus
      ? bonusList[Math.floor(Math.random() * bonusList.length)]
      : kanjiList[Math.floor(Math.random() * kanjiList.length)];
  }

  function getSeason(score) {
    const idx = Math.floor(score / 200) % 4;
    return ['spring', 'summer', 'autumn', 'winter'][idx];
  }

  function drawBackground() {
    if (!ctx) return;
    const season = getSeason(gameScore);
    const sky = ctx.createLinearGradient(0, 0, 0, 140);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(1, '#E0FFFF');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 360, 140);

    if (season === 'spring') {
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 120, 360, 40);
      ctx.fillStyle = '#87CEFA';
      ctx.fillRect(0, 140, 360, 30);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 170, 360, 20);
      ctx.fillStyle = '#FFC0CB';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(20 + i * 40, 130, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (season === 'summer') {
      ctx.fillStyle = '#2E8B57';
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(40, 80);
      ctx.lineTo(90, 110);
      ctx.lineTo(150, 70);
      ctx.lineTo(210, 105);
      ctx.lineTo(270, 75);
      ctx.lineTo(330, 110);
      ctx.lineTo(360, 90);
      ctx.lineTo(360, 140);
      ctx.lineTo(0, 140);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 140, 360, 20);
       } else if (season === 'autumn') {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 120, 360, 40);
      const colors = ['#FF8C00', '#FF4500', '#FFD700'];
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = colors[i % 3];
        ctx.beginPath();
        ctx.arc(20 + i * 40, 120, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (season === 'winter') {
      ctx.fillStyle = '#F8F8FF';
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.lineTo(40, 90);
      ctx.lineTo(90, 120);
      ctx.lineTo(150, 80);
      ctx.lineTo(210, 115);
      ctx.lineTo(270, 85);
      ctx.lineTo(330, 120);
      ctx.lineTo(360, 100);
      ctx.lineTo(360, 140);
      ctx.lineTo(0, 140);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(0, 140, 360, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(60, 160, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(120, 162, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
          ctx.ellipse(190, 162, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(OFFSET_X - 4, OFFSET_Y - 4, COLS * SIZE + 8, ROWS * SIZE + 8);

    const sea = ctx.createLinearGradient(0, OFFSET_Y + ROWS * SIZE + 10, 0, 640);
    sea.addColorStop(0, '#00BFFF');
    sea.addColorStop(1, '#1E90FF');
    ctx.fillStyle = sea;
    ctx.fillRect(0, OFFSET_Y + ROWS * SIZE + 10, 360, 640 - (OFFSET_Y + ROWS * SIZE + 10));
  }

  function drawGrid() {
    if (!ctx) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      const y = OFFSET_Y + r * SIZE;
      ctx.beginPath();
      ctx.moveTo(OFFSET_X, y);
      ctx.lineTo(OFFSET_X + COLS * SIZE, y);
      ctx.stroke();
    }
    for (let j = 0; j <= COLS; j++) {
      const x = OFFSET_X + j * SIZE;
      ctx.beginPath();
      ctx.moveTo(x, OFFSET_Y);
      ctx.lineTo(x, OFFSET_Y + ROWS * SIZE);
      ctx.stroke();
    }
  }

  function drawTitleOverlay() {
    if (!ctx) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseX = 40;
    const baseY = 40;
    const lineHeight = 30;
    for (let i = 0; i < titleChars.length; i++) {
      const ch = titleChars[i];
      const y = baseY + i * lineHeight;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ch, baseX, y);
      if (ch === 'ぼ' || ch === 'じ') {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#FF69B4';
        ctx.fillText('♥', baseX + 14, y - 10);
      }
    }
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const lines = [
      'とやまの無限漢字',
      '～立山連峰から日本海まで、',
      '希望の数え唄～'
    ];
    let sy = baseY + titleChars.length * lineHeight + 10;
    for (const line of lines) {
      ctx.fillText(line, 190, sy);
      sy += 16;
    }
    ctx.font = '10px sans-serif';
    ctx.fillText('Game concept by T.Shiob', 190, sy + 10);
    ctx.restore();
  }

  function drawNextPieces() {
    if (!ctx) return;
    if (!next1) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('NEXT', 300, 20);
      ctx.fillText('NEXT2', 300, 80);

    function drawMiniPiece(piece, baseY) {
      piece.blocks.forEach((b, idx) => {
        const x = 300 + (idx - 0.5) * 20;
        const y = baseY + 20;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        if (bonusList.includes(b.type)) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(b.type, x, y + 1);
      });
    }

    drawMiniPiece(next1, 30);
    if (next2) drawMiniPiece(next2, 90);
    ctx.restore();
  }

  function drawKanjiCell(x, y, t, isCurrent) {
    if (!ctx) return;
    const px = OFFSET_X + x * SIZE + SIZE / 2;
    const py = OFFSET_Y + y * SIZE + SIZE / 2;
    ctx.beginPath();
    ctx.fillStyle = isCurrent ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.9)';
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fill();

    if (bonusMode === '代' && selectedCell && selectedCell.x === x && selectedCell.y === y) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (bonusList.includes(t)) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#000000';
    ctx.font = isCurrent ? 'bold 24px sans-serif' : 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, px, py + 1);
  }

  function drawPauseOverlay() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(40, 260, 280, 120);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '20px sans-serif';
    ctx.fillText('一時停止中', 180, 300);
    ctx.font = '14px sans-serif';
    ctx.fillText('「再開 ▶」でつづきから遊べます。', 180, 330);
  }

  function drawGameOverOverlay() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(30, 230, 300, 200);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '22px sans-serif';
     ctx.fillText('GAME OVER', 180, 250);
    ctx.font = '18px sans-serif';
    ctx.fillText('SCORE ' + gameScore, 180, 280);
    const arr = loadScores();
    ctx.font = '16px sans-serif';
    ctx.fillText('TOP 3', 180, 310);
    ctx.textAlign = 'left';
    let y = 335;
    for (let i = 0; i < 3; i++) {
      const item = arr[i];
      if (item) {
        const rank = (i + 1).toString();
        const line = `${rank}  ${item.score}  ${item.date}`;
        ctx.fillText(line, 80, y);
        y += 22;
      }
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 360, 640);
    drawBackground();
    drawGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let j = 0; j < COLS; j++) {
        const t = board[r][j];
        if (t) drawKanjiCell(j, r, t, false);
      }
    }
    if (cur && !bonusMode && !gameOver) {
      cur.blocks.forEach(b => drawKanjiCell(b.x, b.y, b.type, true));
    }
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE ' + gameScore, 10, 10);
    drawNextPieces();
    if (!started) drawTitleOverlay();
