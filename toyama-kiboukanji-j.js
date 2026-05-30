// ─────────────────────────────
// 波の環境音（常時・低音量）
// ─────────────────────────────
let waveBGM = new Audio("audio/穏やかな波.mp3");
waveBGM.loop = true;
waveBGM.volume = 0.01;  // 静かで世界観に合う最適値

let storyBGM = new Audio("audio/shamisen_intro.mp3");
storyBGM.loop = true;
storyBGM.volume = 0.02;

function updateStoryBGM(pageIndex) {
    if (pageIndex <= 5) {
        fadeIn(storyBGM);
    } else {
        fadeOut(storyBGM);
    }
}

function fadeIn(audio) {
    let v = audio.volume;
    audio.play();
    let fade = setInterval(() => {
        if (v < 0.22) {
            v += 0.01;
            audio.volume = v;
        } else {
            clearInterval(fade);
        }
    }, 150);
}

function fadeOut(audio) {
    let v = audio.volume;
    let fade = setInterval(() => {
        if (v > 0) {
            v -= 0.01;
            audio.volume = v;
        } else {
            audio.pause();
            clearInterval(fade);
        }
    }, 150);
}
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS Loaded");

    // 画面管理
    const screens = document.querySelectorAll(".screen");
    function showScreen(id) {
        screens.forEach(s => s.style.display = "none");
        const target = document.getElementById(id);
        if (target) target.style.display = "block";
    }

    // 最初の画面
    showScreen("title-screen");

    // BGM
    const bgm = document.getElementById("bgm");
    function playBGM() {
        if (bgm.paused) {
            bgm.volume = 0.01;
            bgm.play().catch(() => {});
        }
    }

    // ボタン
    document.getElementById("start-button").addEventListener("click", () => {
        playBGM();
        showScreen("game-screen");
        startGame();
    });
function playShamisenTimed() {
  shamisenIntro.currentTime = 0;
  shamisenIntro.volume = 0.002;  // さらに小さく
  shamisenIntro.play().catch(()=>{});

  setTimeout(() => { shamisenIntro.volume = 0.001; }, 15000);
  setTimeout(() => { shamisenIntro.volume = 0.0005; }, 18000);
  setTimeout(() => {
    shamisenIntro.pause();
    shamisenIntro.currentTime = 0;
  }, 20000);
}

document.getElementById("story-button").addEventListener("click", () => {
  showScreen("story-screen");
  waveBGM.play().catch(()=>{});
  playShamisenTimed();
});

document.getElementById("manual-button").addEventListener("click", () => {
  playBGM();
  showScreen("manual-screen");
  loadManualPage(0);
});
    // ストーリー・説明書ページ管理
    let currentStoryPage = 0;
    let currentManualPage = 0;

    document.getElementById("story-next").addEventListener("click", () => {
        currentStoryPage++;
        loadStoryPage(currentStoryPage);
    });

    document.getElementById("story-prev").addEventListener("click", () => {
        currentStoryPage--;
        loadStoryPage(currentStoryPage);
    });

    document.getElementById("manual-next").addEventListener("click", () => {
        currentManualPage++;
        loadManualPage(currentManualPage);
    });

    document.getElementById("manual-prev").addEventListener("click", () => {
        currentManualPage--;
        loadManualPage(currentManualPage);
    });

    // ======== キャンバス設定 ========
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 600;

    // ======== ゲーム変数 ========
    let score = 0;
    let timeLeft = 60;
    let gameInterval = null;
    let timerInterval = null;

       // 落ちてくる漢字
    let fallingKanji = [];

    function createKanji() {
        const text = kanjiList[Math.floor(Math.random() * kanjiList.length)];
        const x = Math.random() * (canvas.width - 50);
        const y = -50;
        const speed = 2 + Math.random() * 3;

        fallingKanji.push({ text, x, y, speed });
    }

    // ======== ゲーム開始 ========
    function startGame() {
        score = 0;
        timeLeft = 60;
        fallingKanji = [];

        if (gameInterval) clearInterval(gameInterval);
        if (timerInterval) clearInterval(timerInterval);

        gameInterval = setInterval(() => {
            createKanji();
        }, 800);

        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) endGame();
        }, 1000);

        requestAnimationFrame(gameLoop);
    }

    // ======== ゲーム終了 ========
    function endGame() {
        clearInterval(gameInterval);
        clearInterval(timerInterval);

        showScreen("result-screen");
        document.getElementById("result-score").textContent = score;
    }

    // ======== 描画 ========
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 漢字を描画
        ctx.font = "48px serif";
        ctx.fillStyle = "#ffffff";

        for (let i = 0; i < fallingKanji.length; i++) {
            const k = fallingKanji[i];
            k.y += k.speed;

            ctx.fillText(k.text, k.x, k.y);

            // 画面外に出たら削除
            if (k.y > canvas.height + 50) {
                fallingKanji.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(gameLoop);
    }

    // ======== タッチ判定 ========
    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = 0; i < fallingKanji.length; i++) {
            const k = fallingKanji[i];

            // 漢字の当たり判定（ざっくり矩形）
            if (
                x >= k.x - 10 &&
                x <= k.x + 50 &&
                y >= k.y - 50 &&
                y <= k.y + 10
            ) {
                score += 10;
                fallingKanji.splice(i, 1);
                break;
            }
        }
    });

    // ======== スコア表示 ========
    function updateHUD() {
        document.getElementById("score-display").textContent = score;
        document.getElementById("time-display").textContent = timeLeft;
    }

    setInterval(updateHUD, 100);
    // ======== ボーナス処理 ========
    let combo = 0;
    let lastHitTime = 0;

    function addScore(base) {
        const now = Date.now();

        // 連続ヒット判定（1秒以内）
        if (now - lastHitTime < 1000) {
            combo++;
        } else {
            combo = 1;
        }

        lastHitTime = now;

        const bonus = base * combo;
        score += bonus;

        showComboEffect(combo, bonus);
    }

    // ======== コンボエフェクト ========
    function showComboEffect(combo, bonus) {
        const effect = document.createElement("div");
        effect.className = "combo-effect";
        effect.textContent = combo + " Combo! +" + bonus;

        document.body.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 800);
    }

    // ======== 漢字クリック時の処理を上書き ========
    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = 0; i < fallingKanji.length; i++) {
            const k = fallingKanji[i];

            if (
                x >= k.x - 10 &&
                x <= k.x + 50 &&
                y >= k.y - 50 &&
                y <= k.y + 10
            ) {
                addScore(10);
                fallingKanji.splice(i, 1);
                break;
            }
        }
    });
   
    // ======== 説明書データ ========
    const manualPages = [
        { title: "遊び方", text: "落ちてくる漢字をタップしてスコアを稼ごう。" },
        { title: "ボーナス", text: "連続でタップするとコンボボーナスが入る。" },
        { title: "時間制限", text: "60秒以内にできるだけ多くの漢字をタップしよう。" }
    ];

    function loadManualPage(index) {
        if (index < 0) index = 0;
        if (index >= manualPages.length) index = manualPages.length - 1;

        currentManualPage = index;

        document.getElementById("manual-title").textContent = manualPages[index].title;
        document.getElementById("manual-text").textContent = manualPages[index].text;
    }

    // ======== タイトルへ戻る ========
    document.getElementById("back-to-title").addEventListener("click", () => {
        showScreen("title-screen");
      // ★ 波の音を止める
    waveBGM.pause();
    waveBGM.currentTime = 0;
    });

}); // DOMContentLoaded 終了
<script>
// 画面を全部隠す
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
  });
}

// 指定した画面だけ表示
function showScreen(id) {
  hideAllScreens();
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
  }
}

// タイトル → ゲーム
document.getElementById("start-button").addEventListener("click", () => {
  showScreen("game-screen");
});

// ゲーム → 説明書
document.getElementById("manual-button").addEventListener("click", () => {
  document.getElementById("manualOverlay").classList.remove("hidden");
});

// 説明書を閉じる
document.getElementById("close-manual").addEventListener("click", () => {
  document.getElementById("manualOverlay").classList.add("hidden");
});

// ゲーム → とやま
document.getElementById("toyama-button").addEventListener("click", () => {
  showScreen("toyamaScreen");
});

// とやま → ゲームに戻る
document.getElementById("back-to-game").addEventListener("click", () => {
  showScreen("game-screen");
});

// 物語 → ゲーム
document.getElementById("story-back").addEventListener("click", () => {
  showScreen("game-screen");
});
</script>
// ===== 物語モード用オーディオ =====
waveBgm.volume = 0.01;
shamisenIntro.volume = 0.02;

// 物語画面を開いたとき
function enterStory() {
  // 波BGMスタート（すでに鳴っていたらそのまま）
  if (waveBgm.paused) {
    waveBgm.currentTime = 0;
    waveBgm.play();
  }

  // 三味線イントロ（毎回頭から）
  shamisenIntro.currentTime = 0;
  shamisenIntro.play();

  show("storyScreen");
}

// 物語画面から戻るとき
function leaveStory() {
  show("game-screen");
  // 波は物語専用なので止める
  waveBgm.pause();
  waveBgm.currentTime = 0;
  // 三味線も止める
  shamisenIntro.pause();
}

function showScreen(id){
  const screens = [
    "title-screen",
    "game-screen",
    "story-screen",
    "manual-screen",
    "toyamaScreen",
    "tateyamaDetailScreen",
    "cityHallDetailScreen",
    "amaharashiDetailScreen"
  ];
  
function showBonusDialog(message, callback) {
  const dialog = document.getElementById("bonusDialog");
  const text = document.getElementById("bonusDialogText");
  const okBtn = document.getElementById("bonusOkBtn");
  const cancelBtn = document.getElementById("bonusCancelBtn");

  text.textContent = message;

  const close = () => {
    dialog.style.display = "none";
    okBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  okBtn.onclick = () => { close(); callback(true); };
  cancelBtn.onclick = () => { close(); callback(false); };

  dialog.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {

  showScreen("title-screen");

  document.getElementById("btn-start").addEventListener("click", () => {
    showScreen("gameScreen");
  });

  document.getElementById("btn-howto").addEventListener("click", () => {
    showScreen("manualOverlay");
  });

  document.getElementById("btn-toyama").addEventListener("click", () => {
    showScreen("toyamaScreen");
  });

  document.getElementById("tateyamaMuseumBtn").addEventListener("click", () => {
    showScreen("tateyamaDetailScreen");
  });

  document.getElementById("cityHallBtn").addEventListener("click", () => {
    showScreen("cityHallDetailScreen");
  });

  document.getElementById("backFromToyama").addEventListener("click", () => {
    showScreen("title-screen");
  });

  document.getElementById("backFromTateyama").addEventListener("click", () => {
    showScreen("toyamaScreen");
  });

  document.getElementById("backFromCityHall").addEventListener("click", () => {
    showScreen("toyamaScreen");
  });

  document.getElementById("manualCloseBtn").addEventListener("click", () => {
  showScreen("title-screen");
  });

  document.getElementById("amaharashiSpot").addEventListener("click", () => {
    showScreen("amaharashiDetailScreen");
  });

  document.getElementById("backFromAmaharashi").addEventListener("click", () => {
    showScreen("toyamaScreen");
  });

  document.getElementById("prevBtn").addEventListener("click", () => {
    showPrevStory();
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    showNextStory();
  });
  
  document.getElementById("backToTitle").addEventListener("click", () => {
  showScreen("title-screen");
  let currentLang = "jp"; 
});  // ← backToTitle の閉じ

});  // ← ★DOMContentLoaded の閉じ（これを追加）
/* =========================
   きぼうかんじ ゲーム本体
   ========================= */
const c = document.getElementById("c");
const ctx = c.getContext("2d");

const ROWS = 12;
const COLS = 6;
const SIZE = 40;
const OFFSET_X = 40;
const OFFSET_Y = 140;

let board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
let cur = null;
let score = 0;
let gameOver = false;
let started = false;

let fallInterval = 700;
let lastFallTime = 0;
let fastDrop = false;
let chainCount = 0;

let level = 'easy';

const kanjiList = ['三','五','八','九','百','千','万','億','兆'];
const bonusList = ['岳','代'];

let bonusMode = null;
let bonusRemaining = 0;
let selectedCell = null;

let next1 = null;
let next2 = null;

const bgmNormal = document.getElementById("bgmNormal");
const bgmBonus = document.getElementById("bgmBonus");

const SCORE_KEY = 'kibou_scores';

const titleChars = ['き','ぼ','う','か','ん','じ'];

let isPaused = false;

function playNormalBGM(){
  bgmBonus.pause();
  bgmBonus.currentTime = 0;
  bgmNormal.volume = 0.03;
  bgmNormal.play().catch(()=>{});
}
function playBonusBGM(){
  bgmNormal.pause();
  bgmBonus.volume = 0.03;
  bgmBonus.play().catch(()=>{});
}
function stopAllBGM(){
  bgmNormal.pause();
  bgmBonus.pause();
}

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
  return isBonus
    ? bonusList[Math.floor(Math.random()*bonusList.length)]
    : kanjiList[Math.floor(Math.random()*kanjiList.length)];
}

function getSeason(score){
  const idx = Math.floor(score/200) % 4;
  return ['spring','summer','autumn','winter'][idx];
}

function drawBackground(){
  const season = getSeason(score);

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
    for(let i=0;i<8;i++){
      ctx.beginPath();
      ctx.arc(20+i*40,130,8,0,Math.PI*2);
      ctx.fill();
    }
  }else if(season === 'summer'){
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.moveTo(0,120);
    ctx.lineTo(40,80);
    ctx.lineTo(90,110);
    ctx.lineTo(150,70);
    ctx.lineTo(210,105);
    ctx.lineTo(270,75);
    ctx.lineTo(330,110);
    ctx.lineTo(360,90);
    ctx.lineTo(360,140);
    ctx.lineTo(0,140);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0,140,360,20);
  }else if(season === 'autumn'){
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0,120,360,40);
    const colors = ['#FF8C00','#FF4500','#FFD700'];
    for(let i=0;i<9;i++){
      ctx.fillStyle = colors[i%3];
      ctx.beginPath();
      ctx.arc(20+i*40,120,10,0,Math.PI*2);
      ctx.fill();
    }
  }else if(season === 'winter'){
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(0,130);
    ctx.lineTo(40,90);
    ctx.lineTo(90,120);
    ctx.lineTo(150,80);
    ctx.lineTo(210,115);
    ctx.lineTo(270,85);
    ctx.lineTo(330,120);
    ctx.lineTo(360,100);
    ctx.lineTo(360,140);
    ctx.lineTo(0,140);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(0,140,360,40);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(60,160,10,6,0,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(120,162,12,5,0,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(190,162,16,6,0,0,Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle = '#F0F8FF';
  ctx.fillRect(OFFSET_X-4, OFFSET_Y-4, COLS*SIZE+8, ROWS*SIZE+8);

  const sea = ctx.createLinearGradient(0,OFFSET_Y+ROWS*SIZE+10,0,640);
  sea.addColorStop(0,'#00BFFF');
  sea.addColorStop(1,'#1E90FF');
  ctx.fillStyle = sea;
  ctx.fillRect(0,OFFSET_Y+ROWS*SIZE+10,360,640-(OFFSET_Y+ROWS*SIZE+10));
}

function drawGrid(){
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for(let r=0;r<=ROWS;r++){
    const y = OFFSET_Y + r*SIZE;
    ctx.beginPath();
    ctx.moveTo(OFFSET_X, y);
    ctx.lineTo(OFFSET_X+COLS*SIZE, y);
    ctx.stroke();
  }
  for(let j=0;j<=COLS;j++){
    const x = OFFSET_X + j*SIZE;
    ctx.beginPath();
    ctx.moveTo(x, OFFSET_Y);
    ctx.lineTo(x, OFFSET_Y+ROWS*SIZE);
    ctx.stroke();
  }
}

function drawTitleOverlay(){
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
  for(const line of lines){
    ctx.fillText(line, 190, sy);
    sy += 16;
  }

  ctx.font = '10px sans-serif';
  ctx.fillText('Game concept by T.Shiob', 190, sy+10);

  ctx.restore();
}

function drawNextPieces(){
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
  const px = OFFSET_X + x*SIZE + SIZE/2;
  const py = OFFSET_Y + y*SIZE + SIZE/2;

  ctx.beginPath();
  ctx.fillStyle = isCurrent ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.9)';
  ctx.arc(px,py,18,0,Math.PI*2);
  ctx.fill();
  // ★ 代ボーナスの選択ハイライト
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
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(30,230,300,200);
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '22px sans-serif';
  ctx.fillText('GAME OVER', 180, 250);

  ctx.font = '18px sans-serif';
  ctx.fillText('SCORE '+score, 180, 280);

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
  ctx.clearRect(0,0,360,640);
  drawBackground();
  drawGrid();

  for(let r=0;r<ROWS;r++){
    for(let j=0;j<COLS;j++){
      const t = board[r][j];
      if(t){
        drawKanjiCell(j,r,t,false);
      }
    }
  }

  if(cur && !bonusMode && !gameOver){
    cur.blocks.forEach(b=>{
      drawKanjiCell(b.x,b.y,b.type,true);
    });
  }

  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE '+score, 10, 10);

  drawNextPieces();

  if(!started){
    drawTitleOverlay();
  }

  if(gameOver){
    drawGameOverOverlay();
  }

  if(isPaused && !gameOver && started){
    drawPauseOverlay();
  }
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
  }   // ← if(bonusMode) の閉じ
}     // ← draw() の閉じ

function resetBoard(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
}

console.log("JS OK");   
  
function resetGame(){
  resetBoard();
  score = 0;
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

function startGame(lv){
  level = lv;
  started = true;
  isPaused = false;

titleScreen.classList.add("hidden");
gameScreen.classList.remove("hidden");

document.getElementById("easyBtn").classList.add("hidden");
document.getElementById("hardBtn").classList.add("hidden");
document.getElementById("restartBtn").classList.add("hidden");
gameControlButtons.classList.remove("hidden");  // flex の代わり
  pauseBtn.textContent = '一時停止 ||';
  document.getElementById("info").textContent =
    "左右スワイプで移動、下スワイプで加速。 縦か横に3つそろえて。";
  resetGame();
  spawnPiece();
  playNormalBGM();
}

function restartGame(){
  started = false;
  gameOver = false;
  isPaused = false;
  stopAllBGM();
  resetGame();
  document.getElementById("easyBtn").classList.remove("hidden");
document.getElementById("hardBtn").classList.remove("hidden");
document.getElementById("restartBtn").classList.add("hidden");
gameControlButtons.classList.add("hidden");
  pauseBtn.textContent = '一時停止 ||';
}

function spawnPiece(){
  cur = next1;
  next1 = next2;
  next2 = new Piece(level==='hard');
  for(const b of cur.blocks){
    if(board[0][b.x]){
      gameOver = true;
      stopAllBGM();
      document.getElementById("restartBtn").classList.remove("hidden");
      updateScores();
      return;
    }
  }
}


function stepFall(){
  if (isPaused) return;   
  if (gameOver || bonusMode) return;
  if(!cur){
    spawnPiece();
    return;
  }

  cur.blocks.forEach(b=>b.y++);
  let collided = cur.blocks.some(b => b.y>=ROWS || board[b.y][b.x]);
  if(collided){
    cur.blocks.forEach(b=>b.y--);
    cur.blocks.forEach(b=>{
      board[b.y][b.x] = b.type;
    });
    if(fastDrop){
      score += 3;
    }
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
    score += result.cleared * 10 * chainCount;
  }else{
    chainCount = 0;
  }

  result.bonusHits.forEach(ch=>{
    triggerBonus(ch);
  });

  for(let j=0;j<COLS;j++){
    if(board[0][j]){
      gameOver = true;
      stopAllBGM();
      document.getElementById("restartBtn").classList.remove("hidden");

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
    if(bonusCount[ch] >= 3){
      bonusHits.add(ch);
    }
  }

  return { cleared:count, bonusHits };
}

function triggerBonus(ch){
  bonusMode = ch;
  playBonusBGM();

  if(ch==="代"){
    bonusRemaining = 3;
  }
  else if(ch==="岳"){
    if(confirm("盤面を替えていいですか？")){
      shuffleBoard();
    }
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

// タッチ操作
let touchStartX = 0;
let touchStartY = 0;

c.addEventListener("touchstart",e=>{
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

c.addEventListener("touchend",e=>{
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dist = Math.hypot(dx,dy);

  if(bonusMode && dist<20){
    handleBonusTap(t);
    return;
  }

  if(!cur || gameOver || bonusMode || isPaused) return;

  if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30){
    if(dx>0){
      if(canMove(1,0)) cur.blocks.forEach(b=>b.x++);
    }else{
      if(canMove(-1,0)) cur.blocks.forEach(b=>b.x--);
    }
  }else if(dy>30){
    fastDrop = true;
  }

  draw();
});

function canMove(mx,my){
  return cur.blocks.every(b=>{
    const nx = b.x + mx;
    const ny = b.y + my;
    if(nx<0 || nx>=COLS || ny>=ROWS) return false;
    if(board[ny][nx]) return false;
    return true;
  });
}

function handleBonusTap(t){
  const rect = c.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;

  const col = Math.floor((x - OFFSET_X)/SIZE);
  const row = Math.floor((y - OFFSET_Y)/SIZE);

  if(col<0 || col>=COLS || row<0 || row>=ROWS) return;

  // --- 岳 ---
  if(bonusMode === "岳"){
    if(board[row][col]){
      if(confirm("この漢字を消していいですか？")){
        board[row][col] = null;
        bonusRemaining--;
        const result = clearMatchesAndBonus();
        if(result.cleared>0){
          chainCount++;
          score += result.cleared * 10 * chainCount;
        }else{
          chainCount = 0;
        }
        if(bonusRemaining<=0){
          bonusMode = null;
          playNormalBGM();
        }
      }
    }
  }
  // --- 代 ---
else if(bonusMode === "代"){
  if(!selectedCell){
    if(board[row][col]){
      selectedCell = {r:row,c:col};
    }
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
        if(result.cleared>0){
          chainCount++;
          score += result.cleared * 10 * chainCount;
        }else{
          chainCount = 0;
        }

        if(bonusRemaining<=0){
          bonusMode = null;
          playNormalBGM();
        }
      }
      selectedCell = null;
      draw();
    });
  }
}

  draw();
} 
// スコア保存・TOP3
function getTodayString(){
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth()+1).toString().padStart(2,'0');
  const day = d.getDate().toString().padStart(2,'0');
  return `${y}${m}${day}`;
}
function loadScores(){
  try{
    const s = localStorage.getItem(SCORE_KEY);
    if(!s) return [];
    const arr = JSON.parse(s);
    if(Array.isArray(arr)) return arr;
    return [];
  }catch(e){
    return [];
  }
}
function saveScores(arr){
  localStorage.setItem(SCORE_KEY, JSON.stringify(arr));
}
function updateScores(){
  const arr = loadScores();
  arr.push({score:score, date:getTodayString()});
  arr.sort((a,b)=>b.score - a.score);
  const top3 = arr.slice(0,3);
  saveScores(top3);
}
function resetRecords(){
  if(confirm("記録を全て消しますか？")){
    localStorage.removeItem(SCORE_KEY);
  }
}

// メインループ
function loop(timestamp){
  if(started && !gameOver && !isPaused){
    const interval = fastDrop ? fallInterval/5 : fallInterval;
    if(timestamp - lastFallTime >= interval){
      lastFallTime = timestamp;
      stepFall();
      fastDrop = false;
    }
  }

  draw();                    // ← ここで毎回えがく
  requestAnimationFrame(loop); // ← ここでつづけてよぶ
}
requestAnimationFrame(loop);

// 画面スケール調整
function resizeCanvas(){
  const scale = Math.min(window.innerWidth/360, window.innerHeight/720);
  const wrap = document.getElementById("wrap");
  wrap.style.transform = `scale(${scale})`;
  wrap.style.transformOrigin = "top center";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const pauseBtn        = document.getElementById("pauseBtn");
const mainBtn         = document.getElementById("mainBtn");
const manualCloseBtn  = document.getElementById("manualCloseBtn");
const manualOverlay   = document.getElementById("manualOverlay");
const btnJP           = document.getElementById("btnJP");
const btnEN           = document.getElementById("btnEN");
const gameControlButtons = document.getElementById("gameControlButtons"); 
const backFromAmaharashi = document.getElementById("backFromAmaharashi");
const backFromCityHall   = document.getElementById("backFromCityHall");
const backFromTateyama   = document.getElementById("backFromTateyama");
const backFromToyama     = document.getElementById("backFromToyama");    
const titleScreen   = document.getElementById("title-screen");
const gameScreen = document.getElementById("game-screen");
const toyamaScreen  = document.getElementById("toyamaScreen");
const storyScreen   = document.getElementById("storyScreen");

console.log({
  pauseBtn,
  mainBtn,
  manualCloseBtn,
  manualOverlay,
  btnJP,
  btnEN,
  gameControlButtons,
  backFromAmaharashi,
  backFromCityHall,
  backFromTateyama,
  backFromToyama,
  titleScreen,
  gameScreen,
  toyamaScreen,
  storyScreen
});

pauseBtn.addEventListener("click", ()=>{
  if(!started || gameOver) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? '再開 ▶' : '一時停止 ||';
});

mainBtn.addEventListener("click", () => {
  stopAllBGM();
  started = false;
  isPaused = false;
  gameOver = false;
  document.getElementById("gameScreen").style.display = "none";
  showScreen("title-screen");
});  

manualCloseBtn.addEventListener("click", ()=>{
  manualOverlay.classList.add("hidden");
});

manualOverlay.addEventListener("click",(e)=>{
  if(e.target === manualOverlay){
    manualOverlay.classList.add("hidden");
  }
});
// ストーリー画面の言語切り替え
btnJP.addEventListener("click", () => {
  document.getElementById("storyTextJP").style.display = "block";
  document.getElementById("storyTextEN").style.display = "none";
});

btnEN.addEventListener("click", () => {
  document.getElementById("storyTextJP").style.display = "none";
  document.getElementById("storyTextEN").style.display = "block";
});
/* =========================
   タイトル画面 → 各画面遷移
   ========================= */
document.getElementById("btn-start").addEventListener("click", ()=>{
  titleScreen.style.display = "none";
  gameScreen.style.display = "block";
});

document.getElementById("btn-howto").addEventListener("click", ()=>{
  manualOverlay.classList.remove("hidden");
});
