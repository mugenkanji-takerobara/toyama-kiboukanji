  // toyama-kiboukanji-j.js - 統合・構文チェック済み 完全版
(() => {
  // --- ヘルパー ---
  const $ = id => document.getElementById(id);

  // --- 基本データ ---
  const kanjiList = ['三','五','八','九','百','千','万','億','兆'];
  const bonusList = ['岳','代'];
  const titleChars = ['き','ぼ','う','か','ん','じ'];
  const SCORE_KEY = 'kibou_scores';

  // --- オーディオ（安全初期化） ---
  let waveBGM = null;
  let storyBGM = null;
  let shamisenIntro = null;
  let bgmNormal = null;
  let bgmBonus = null;

  function initAudio() {
    try {
      waveBGM = new Audio("audio/warayatakashi.mp3");
      waveBGM.loop = true;
      waveBGM.volume = 0.01;
    } catch(e) {
      waveBGM = null;
    }

    try {
      storyBGM = new Audio("audio/shamisen_intro.mp3");
      storyBGM.loop = true;
      storyBGM.volume = 0.02;
    } catch(e) {
      storyBGM = null;
    }

    try {
      shamisenIntro = new Audio("audio/shamisen_intro.mp3");
      shamisenIntro.volume = 0.001;
    } catch(e) {
      shamisenIntro = null;
    }

    try {
      bgmNormal = document.getElementById("bgmNormal");
    } catch(e) {
      bgmNormal = null;
    }

    try {
      bgmBonus = document.getElementById("bgmBonus");
    } catch(e) {
      bgmBonus = null;
    }
  }

  function safePlay(a){ try{ a?.play?.().catch(()=>{}); }catch(e){} }
  function playNormalBGM(){ try{ bgmBonus?.pause(); bgmBonus && (bgmBonus.currentTime = 0); if(bgmNormal){ bgmNormal.volume = 0.03; bgmNormal.play().catch(()=>{}); } }catch(e){} }
  function playBonusBGM(){ try{ bgmNormal?.pause(); if(bgmBonus){ bgmBonus.volume = 0.03; bgmBonus.play().catch(()=>{}); } }catch(e){} }
  function stopAllBGM(){ try{ bgmNormal?.pause(); bgmBonus?.pause(); waveBGM?.pause(); storyBGM?.pause(); shamisenIntro?.pause(); }catch(e){} }

  // --- 画面管理 ---
  function hideAllScreens(){
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
  }
  function showScreen(id){
    hideAllScreens();
    const t = $(id) || document.getElementById(id);
    if(t){ t.classList.remove('hidden'); t.classList.add('active'); }
  }

  // --- transient controls ---
  let transientTimer = null;
  function showTransient(ms=4000){
    const transient = $('transientControls');
    if(!transient) return;
    const gameActive = $('game-screen')?.classList.contains('active');
    if(gameActive) return;
    transient.classList.add('visible');
    clearTimeout(transientTimer);
    transientTimer = setTimeout(()=> transient.classList.remove('visible'), ms);
  }

  // =========================
  //  落ちる漢字モード（簡易）
  // =========================
  let canvas = null, ctx = null;
  let fallingKanji = [], fkInterval = null, fkTimer = null;
  let fkScore = 0, fkTimeLeft = 60, fkCombo = 0, fkLastHit = 0;

  function createKanji() {
    if(!canvas) return;
    const text = kanjiList[Math.floor(Math.random()*kanjiList.length)];
    const x = Math.random() * Math.max(0, canvas.width - 50);
    const y = -50;
    const speed = 2 + Math.random()*3;
    fallingKanji.push({text,x,y,speed});
  }
  function fkLoop(){
    if(!ctx || !canvas){ requestAnimationFrame(fkLoop); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "48px serif";
    ctx.fillStyle = "#ffffff";
    for(let i=0;i<fallingKanji.length;i++){
      const k = fallingKanji[i];
      k.y += k.speed;
      ctx.fillText(k.text, k.x, k.y);
      if(k.y > canvas.height + 50){ fallingKanji.splice(i,1); i--; }
    }
    requestAnimationFrame(fkLoop);
  }
  function startFkGame(){
    fkScore = 0; fkTimeLeft = 60; fallingKanji = []; fkCombo = 0; fkLastHit = 0;
    if(fkInterval) clearInterval(fkInterval);
    if(fkTimer) clearInterval(fkTimer);
    fkInterval = setInterval(createKanji, 800);
    fkTimer = setInterval(()=>{ fkTimeLeft--; if(fkTimeLeft<=0) endFkGame(); }, 1000);
    requestAnimationFrame(fkLoop);
  }
  function endFkGame(){
    if(fkInterval) clearInterval(fkInterval);
    if(fkTimer) clearInterval(fkTimer);
    const res = $('result-score'); if(res) res.textContent = fkScore;
    showScreen('result-screen');
  }
  function addFkScore(base){
    const now = Date.now();
    if(now - fkLastHit < 1000) fkCombo++; else fkCombo = 1;
    fkLastHit = now;
    const bonus = base * fkCombo;
    fkScore += bonus;
    showComboEffect(fkCombo, bonus);
  }
  function onFkClick(e){
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    for(let i=0;i<fallingKanji.length;i++){
      const k = fallingKanji[i];
      if(x >= k.x - 10 && x <= k.x + 50 && y >= k.y - 50 && y <= k.y + 10){
        addFkScore(10);
        fallingKanji.splice(i,1);
        break;
      }
    }
  }

  // --- 共通 HUD 更新 ---
  setInterval(()=>{ const sd = $('score-display'); const td = $('time-display'); if(sd) sd.textContent = fkScore; if(td) td.textContent = fkTimeLeft; }, 100);

  // --- コンボエフェクト ---
  function showComboEffect(cVal, bonus){
    const effect = document.createElement('div');
    effect.className = 'combo-effect';
    effect.textContent = `${cVal} Combo! +${bonus}`;
    Object.assign(effect.style, {position:'fixed',left:'50%',top:'20%',transform:'translateX(-50%)',padding:'8px 12px',background:'rgba(0,0,0,0.6)',color:'#fff',borderRadius:'6px',zIndex:9999});
    document.body.appendChild(effect);
    setTimeout(()=> effect.remove(), 800);
  }

  // =========================
  //  きぼうかんじ（盤面）モード
  // =========================
  const ROWS = 12;
  const COLS = 6;
  const SIZE = 40;
  const OFFSET_X = 40;
  const OFFSET_Y = 140;

  let board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
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
  let next1 = null, next2 = null;
  let level = 'easy';

  class Piece{
    constructor(isPair=false){
      if(isPair){
        this.blocks = [
          {x:2, y:0, type: randomType()},
          {x:3, y:0, type: randomType()}
        ];
      }else{
        this.blocks = [
          {x:2, y:0, type: randomType()}
        ];
      }
    }
  }
  function randomType(){
    const isBonus = Math.random() < 0.12;
    return isBonus ? bonusList[Math.floor(Math.random()*bonusList.length)] : kanjiList[Math.floor(Math.random()*kanjiList.length)];
  }

  function getSeason(score){
    const idx = Math.floor(score/200) % 4;
    return ['spring','summer','autumn','winter'][idx];
  }

  function drawBackground(){
    if(!ctx) return;
    const season = getSeason(gameScore);
    const sky = ctx.createLinearGradient(0,0,0,140);
    sky.addColorStop(0,'#87CEEB');
    sky.addColorStop(1,'#E0FFFF');
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,360,140);

    if(season === 'spring'){
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0,120,360,40);
      ctx.fillStyle = '#87CEFA';
      ctx.fillRect(0,140,360,30);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0,170,360,20);
      ctx.fillStyle = '#FFC0CB';
      for(let i=0;i<8;i++){ ctx.beginPath(); ctx.arc(20+i*40,130,8,0,Math.PI*2); ctx.fill(); }
    }else if(season === 'summer'){
      ctx.fillStyle = '#2E8B57';
      ctx.beginPath();
      ctx.moveTo(0,120); ctx.lineTo(40,80); ctx.lineTo(90,110); ctx.lineTo(150,70); ctx.lineTo(210,105); ctx.lineTo(270,75); ctx.lineTo(330,110); ctx.lineTo(360,90); ctx.lineTo(360,140); ctx.lineTo(0,140); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#228B22'; ctx.fillRect(0,140,360,20);
    }else if(season === 'autumn'){
      ctx.fillStyle = '#8B4513'; ctx.fillRect(0,120,360,40);
      const colors = ['#FF8C00','#FF4500','#FFD700'];
      for(let i=0;i<9;i++){ ctx.fillStyle = colors[i%3]; ctx.beginPath(); ctx.arc(20+i*40,120,10,0,Math.PI*2); ctx.fill(); }
    }else if(season === 'winter'){
      ctx.fillStyle = '#F8F8FF';
      ctx.beginPath();
      ctx.moveTo(0,130); ctx.lineTo(40,90); ctx.lineTo(90,120); ctx.lineTo(150,80); ctx.lineTo(210,115); ctx.lineTo(270,85); ctx.lineTo(330,120); ctx.lineTo(360,100); ctx.lineTo(360,140); ctx.lineTo(0,140); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#00BFFF'; ctx.fillRect(0,140,360,40);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(60,160,10,6,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(120,162,12,5,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(190,162,16,6,0,0,Math.PI*2); ctx.fill();
    }

    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(OFFSET_X-4, OFFSET_Y-4, COLS*SIZE+8, ROWS*SIZE+8);

    const sea = ctx.createLinearGradient(0,OFFSET_Y+ROWS*SIZE+10,0,640);
    sea.addColorStop(0,'#00BFFF'); sea.addColorStop(1,'#1E90FF');
    ctx.fillStyle = sea;
    ctx.fillRect(0,OFFSET_Y+ROWS*SIZE+10,360,640-(OFFSET_Y+ROWS*SIZE+10));
  }

  function drawGrid(){
    if(!ctx) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for(let r=0;r<=ROWS;r++){
      const y = OFFSET_Y + r*SIZE;
      ctx.beginPath(); ctx.moveTo(OFFSET_X, y); ctx.lineTo(OFFSET_X+COLS*SIZE, y); ctx.stroke();
    }
    for(let j=0;j<=COLS;j++){
      const x = OFFSET_X + j*SIZE;
      ctx.beginPath(); ctx.moveTo(x, OFFSET_Y); ctx.lineTo(x, OFFSET_Y+ROWS*SIZE); ctx.stroke();
    }
  }

  function drawTitleOverlay(){
    if(!ctx) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseX = 40;
    const baseY = 40;
    const lineHeight = 30;
    for(let i=0;i<titleChars.length;i++){
      const ch = titleChars[i];
      const y = baseY + i*lineHeight;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ch, baseX, y);
      if(ch === 'ぼ' || ch === 'じ'){
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#FF69B4';
        ctx.fillText('♥', baseX+14, y-10);
      }
    }
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const lines = [
      'とやまの無限漢字',
      '～立山連峰から日本海まで、',
      '希望の数え唄～'
    ];
    let sy = baseY + titleChars.length*lineHeight + 10;
    for(const line of lines){ ctx.fillText(line, 190, sy); sy += 16; }
    ctx.font = '10px sans-serif';
    ctx.fillText('Game concept by T.Shiob', 190, sy+10);
    ctx.restore();
  }

  function drawNextPieces(){
    if(!ctx) return;
    if(!next1) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('NEXT', 300, 20);
    ctx.fillText('NEXT2', 300, 80);
    function drawMiniPiece(piece, baseY){
      piece.blocks.forEach((b,idx)=>{
        const x = 300 + (idx-0.5)*20;
        const y = baseY+20;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.arc(x,y,12,0,Math.PI*2);
        ctx.fill();
        if(bonusList.includes(b.type)){
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x,y,13,0,Math.PI*2);
          ctx.stroke();
        }
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(b.type,x,y+1);
      });
    }
    drawMiniPiece(next1, 30);
    if(next2) drawMiniPiece(next2, 90);
    ctx.restore();
  }

  function drawKanjiCell(x,y,t,isCurrent){
    if(!ctx) return;
    const px = OFFSET_X + x*SIZE + SIZE/2;
    const py = OFFSET_Y + y*SIZE + SIZE/2;
    ctx.beginPath();
    ctx.fillStyle = isCurrent ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.9)';
    ctx.arc(px,py,18,0,Math.PI*2);
    ctx.fill();
    if (bonusMode === "代" && selectedCell && selectedCell.x === x && selectedCell.y === y) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if(bonusList.includes(t)){
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px,py,20,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.fillStyle = '#000000';
    ctx.font = isCurrent ? 'bold 24px sans-serif' : 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, px, py+1);
  }

  function drawPauseOverlay(){
    if(!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(40,260,280,120);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '20px sans-serif';
    ctx.fillText('一時停止中', 180, 300);
    ctx.font = '14px sans-serif';
    ctx.fillText('「再開 ▶」でつづきから遊べます。', 180, 330);
  }

  function drawGameOverOverlay(){
    if(!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(30,230,300,200);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '22px sans-serif';
    ctx.fillText('GAME OVER', 180, 250);
    ctx.font = '18px sans-serif';
    ctx.fillText('SCORE '+gameScore, 180, 280);
    const arr = loadScores();
    ctx.font = '16px sans-serif';
    ctx.fillText('TOP 3', 180, 310);
    ctx.textAlign = 'left';
    let y = 335;
    for(let i=0;i<3;i++){
      const item = arr[i];
      if(item){
        const rank = (i+1).toString();
        const line = `${rank}  ${item.score}  ${item.date}`;
        ctx.fillText(line, 80, y);
        y += 22;
      }
    }
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,360,640);
    drawBackground();
    drawGrid();
    for(let r=0;r<ROWS;r++){
      for(let j=0;j<COLS;j++){
        const t = board[r][j];
        if(t) drawKanjiCell(j,r,t,false);
      }
    }
    if(cur && !bonusMode && !gameOver){
      cur.blocks.forEach(b=> drawKanjiCell(b.x,b.y,b.type,true) );
    }
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE '+gameScore, 10, 10);
    drawNextPieces();
    if(!started) drawTitleOverlay();
    if(gameOver) drawGameOverOverlay();
    if(isPaused && !gameOver && started) drawPauseOverlay();
    if(bonusMode){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20,260,320,140);
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('ボーナス発動！ ['+bonusMode+']', 40, 295);
      ctx.font = '16px sans-serif';
      if(bonusMode==="岳"){
        ctx.fillText('消したい漢字をタップ！！！', 40, 325);
        ctx.fillText('のこり '+bonusRemaining+' 漢字', 80, 350);
      } else if(bonusMode==="代"){
        ctx.fillText('入れ替えたい漢字をタップ！！！', 40, 325);
        ctx.fillText('のこり '+bonusRemaining+' 回', 80, 350);
      }
    }
  }

  // --- スコア保存（簡易） ---
  function getTodayString(){
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth()+1).toString().padStart(2,'0');
    const day = d.getDate().toString().padStart(2,'0');
    return `${y}${m}${day}`;
  }
  function loadScores(){
    try{ const s = localStorage.getItem(SCORE_KEY); if(!s) return []; const arr = JSON.parse(s); if(Array.isArray(arr)) return arr; return []; }catch(e){ return []; }
  }
  function saveScores(arr){ localStorage.setItem(SCORE_KEY, JSON.stringify(arr)); }
  function updateScores(){
    const arr = loadScores();
    arr.push({score:gameScore, date:getTodayString()});
    arr.sort((a,b)=>b.score - a.score);
    const top3 = arr.slice(0,3);
    saveScores(top3);
  }
  function resetRecords(){ if(confirm("記録を全て消しますか？")){ localStorage.removeItem(SCORE_KEY); } }

  // --- ゲーム盤面操作 ---
  function resetBoard(){ board = Array.from({length:ROWS},()=>Array(COLS).fill(null)); }
  function resetGame(){
    resetBoard();
    gameScore = 0;
    chainCount = 0;
    gameOver = false;
    bonusMode = null;
    bonusRemaining = 0;
    selectedCell = null;
    cur = null;
    next1 = new Piece(level==='hard');
    next2 = new Piece(level==='hard');
    lastFallTime = performance.now();
  }
  function spawnPiece(){
    cur = next1;
    next1 = next2;
    next2 = new Piece(level==='hard');
    for(const b of cur.blocks){
      if(board[0][b.x]){
        gameOver = true;
        stopAllBGM();
        document.getElementById("restartBtn")?.classList.remove("hidden");
        updateScores();
        return;
      }
    }
  }
  function stepFall(){
    if (isPaused) return;
    if (gameOver || bonusMode) return;
    if(!cur){ spawnPiece(); return; }
    cur.blocks.forEach(b=>b.y++);
    let collided = cur.blocks.some(b => b.y>=ROWS || board[b.y][b.x]);
    if(collided){
      cur.blocks.forEach(b=>b.y--);
      cur.blocks.forEach(b=>{ board[b.y][b.x] = b.type; });
      if(fastDrop){ gameScore += 3; }
      fastDrop = false;
      handleLanding();
      cur = null;
      if(!gameOver) spawnPiece();
    }
  }

  function handleLanding(){
    const result = clearMatchesAndBonus();
    if(result.cleared>0){
      chainCount++;
      gameScore += result.cleared * 10 * chainCount;
    }else{
      chainCount = 0;
    }
    result.bonusHits.forEach(ch=>{ triggerBonus(ch); });
    for(let j=0;j<COLS;j++){
      if(board[0][j]){
        gameOver = true;
        stopAllBGM();
        document.getElementById("restartBtn")?.classList.remove("hidden");
        break;
      }
    }
  }

  function clearMatchesAndBonus(){
    let toClear = Array.from({length:ROWS},()=>Array(COLS).fill(false));
    let count = 0;
    let bonusCount = { '岳':0, '代':0 };

    // 縦
    for(let j=0;j<COLS;j++){
      let runChar = null;
      let runStart = 0;
      let runLen = 0;
      for(let r=0;r<=ROWS;r++){
        const t = (r<ROWS)? board[r][j] : null;
        if(t && t===runChar){
          runLen++;
        }else{
          if(runChar && runLen>=3){
            for(let rr=runStart; rr<runStart+runLen; rr++){
              toClear[rr][j] = true;
              if(bonusList.includes(runChar)) bonusCount[runChar]++;
            }
          }
          runChar = t;
          runStart = r;
          runLen = t?1:0;
        }
      }
    }

    // 横
    for(let r=0;r<ROWS;r++){
      let runChar = null;
      let runStart = 0;
      let runLen = 0;
      for(let j=0;j<=COLS;j++){
        const t = (j<COLS)? board[r][j] : null;
        if(t && t===runChar){
          runLen++;
        }else{
          if(runChar && runLen>=3){
            for(let jj=runStart; jj<runStart+runLen; jj++){
              toClear[r][jj] = true;
              if(bonusList.includes(runChar)) bonusCount[runChar]++;
            }
          }
          runChar = t;
          runStart = j;
          runLen = t?1:0;
        }
      }
    }

    for(let r=0;r<ROWS;r++){
      for(let j=0;j<COLS;j++){
        if(toClear[r][j]){
          board[r][j] = null;
          count++;
        }
      }
    }

    if(count>0){
      for(let j=0;j<COLS;j++){
        let stack = [];
        for(let r=ROWS-1;r>=0;r--){
          if(board[r][j]) stack.push(board[r][j]);
        }
        for(let r=ROWS-1;r>=0;r--){
          board[r][j] = stack.length ? stack.shift() : null;
        }
      }
    }

    const bonusHits = new Set();
    for(const ch of bonusList){
      if(bonusCount[ch] >= 3) bonusHits.add(ch);
    }

    return { cleared:count, bonusHits };
  }

  function triggerBonus(ch){
    bonusMode = ch;
    playBonusBGM();
    if(ch==="代"){ bonusRemaining = 3; }
    else if(ch==="岳"){
      // immediate shuffle with confirmation
      if(confirm("盤面を替えていいですか？")){ shuffleBoard(); }
      bonusRemaining = 0;
      bonusMode = null;
      playNormalBGM();
    }
  }

  function shuffleBoard(){
    let cells = [];
    for(let r=0;r<ROWS;r++){
      for(let j=0;j<COLS;j++){
        if(board[r][j]) cells.push(board[r][j]);
        board[r][j] = null;
      }
    }
    for(let r=ROWS-1;r>=0;r--){
      for(let j=0;j<COLS;j++){
        if(cells.length===0) return;
        const idx = Math.floor(Math.random()*cells.length);
        board[r][j] = cells[idx];
        cells.splice(idx,1);
      }
    }
  }

  // --- タッチ操作（ボード用） ---
  let touchStartX = 0, touchStartY = 0;
  function handleBonusTapTouch(touch){
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const col = Math.floor((x - OFFSET_X)/SIZE);
    const row = Math.floor((y - OFFSET_Y)/SIZE);
    if(col<0 || col>=COLS || row<0 || row>=ROWS) return;
    // 岳
    if(bonusMode === "岳"){
      if(board[row][col]){
        if(confirm("この漢字を消していいですか？")){
          board[row][col] = null;
          bonusRemaining--;
          const result = clearMatchesAndBonus();
          if(result.cleared>0){ chainCount++; gameScore += result.cleared * 10 * chainCount; } else { chainCount = 0; }
          if(bonusRemaining<=0){ bonusMode = null; playNormalBGM(); }
        }
      }
    }
    // 代
    else if(bonusMode === "代"){
      if(!selectedCell){
        if(board[row][col]) selectedCell = {r:row,c:col};
      }else{
        const r1 = selectedCell.r, c1 = selectedCell.c;
        const r2 = row, c2 = col;
        showBonusDialog("この二つを入れ替えます", (ok) => {
          if(ok){
            const tmp = board[r1][c1];
            board[r1][c1] = board[r2][c2];
            board[r2][c2] = tmp;
            bonusRemaining--;
            const result = clearMatchesAndBonus();
            if(result.cleared>0){ chainCount++; gameScore += result.cleared * 10 * chainCount; } else { chainCount = 0; }
            if(bonusRemaining<=0){ bonusMode = null; playNormalBGM(); }
          }
          selectedCell = null;
          draw();
        });
      }
    }
    draw();
  }
 document.addEventListener('DOMContentLoaded', ()=>{

  initAudio();

  // --- canvas 初期化 ---
  canvas = $('game-canvas') || $('c') || document.querySelector('canvas');
  if(canvas){
    ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth || 360;
    canvas.height = canvas.clientHeight || 640;

    canvas.addEventListener('click', onFkClick);
    canvas.addEventListener('touchstart', onFkClick, {passive:true});

    canvas.addEventListener('click', (e)=>{
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left - OFFSET_X) / SIZE);
      const y = Math.floor((e.clientY - rect.top - OFFSET_Y) / SIZE);
      if(x>=0 && x<COLS && y>=0 && y<ROWS){
        selectedCell = {x,y};
      }
    });
  }
    // --- タッチ操作 ---
// 安全に呼び出す（未定義ならスキップ）
if (typeof wireTouchHandlers === 'function') {
  try {
    wireTouchHandlers();
  } catch (e) {
    console.error('wireTouchHandlers error', e);
  }
} else {
  console.warn('wireTouchHandlers not defined; skipping touch wiring');
}

  // --- Start ボタン（安全版） ---
  $('start-button')?.addEventListener('click', ()=>{
    if(window._gameLoopStarted) return;

    showScreen('game-screen');

    try{ safePlay(waveBGM); }catch(e){}

    try{
      if(typeof startFkGame === 'function') startFkGame();
      if(typeof resetGame === 'function') resetGame();
    }catch(e){ console.error(e); }

    started = true;
    window._gameLoopStarted = true;

    requestAnimationFrame(loop);
  });

  // --- 他のボタン ---
  $('manual-button')?.addEventListener('click', ()=>{ $('manualOverlay')?.classList.remove('hidden'); loadManualPage(0); });
  $('manual-next')?.addEventListener('click', ()=> loadManualPage(currentManualPage + 1));
  $('manual-prev')?.addEventListener('click', ()=> loadManualPage(currentManualPage - 1));
  $('close-manual')?.addEventListener('click', ()=> $('manualOverlay')?.classList.add('hidden'));

  $('toyama-button')?.addEventListener('click', ()=> showScreen('toyamaScreen'));
  $('back-to-game')?.addEventListener('click', ()=> showScreen('game-screen'));
  $('back-to-title')?.addEventListener('click', ()=> {
    showScreen('title-screen');
    try{ waveBGM?.pause(); waveBGM.currentTime = 0; }catch(e){}
  });

  $('story-next')?.addEventListener('click', ()=> updateStoryBGM(1));
  $('story-prev')?.addEventListener('click', ()=> updateStoryBGM(0));

  $('langToggle')?.addEventListener('click', ()=> setLang(currentLang === 'jp' ? 'en' : 'jp'));

  // --- transient ---
  setTimeout(()=> showTransient(5000), 2000);
  setInterval(()=> showTransient(4000 + Math.floor(Math.random()*3000)), 30000);
  ['click','touchstart','mousemove'].forEach(ev=> window.addEventListener(ev, ()=> showTransient(5000), {passive:true}));

  // --- HUD ---
  if(!$('score-display')){
    const sd = document.createElement('div');
    sd.id='score-display';
    sd.style.display='none';
    document.body.appendChild(sd);
  }
  if(!$('time-display')){
    const td = document.createElement('div');
    td.id='time-display';
    td.style.display='none';
    document.body.appendChild(td);
  }

  // --- とやま詳細 ---
  $('iwaseSpotBtn')?.addEventListener('click', ()=> { $('toyamaScreen')?.classList.add('hidden'); $('iwaseDetailScreen')?.classList.remove('hidden'); showTransient(3500); });
  $('yaoSpotBtn')?.addEventListener('click', ()=> { $('toyamaScreen')?.classList.add('hidden'); $('yaoDetailScreen')?.classList.remove('hidden'); showTransient(3500); });
  $('sciSpotBtn')?.addEventListener('click', ()=> { $('toyamaScreen')?.classList.add('hidden'); $('sciDetailScreen')?.classList.remove('hidden'); showTransient(3500); });
  $('toyamajoSpotBtn')?.addEventListener('click', ()=> { $('toyamaScreen')?.classList.add('hidden'); $('toyamajoDetailScreen')?.classList.remove('hidden'); showTransient(3500); });
  $('mirageSpotBtn')?.addEventListener('click', ()=> { $('toyamaScreen')?.classList.add('hidden'); $('mirageDetailScreen')?.classList.remove('hidden'); showTransient(3500); });

  // --- 初期画面 ---
  showScreen('title-screen');

  // --- リサイズ ---
  resizeCanvas();
});

  })();

