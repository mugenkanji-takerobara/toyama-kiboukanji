<script>
document.addEventListener("DOMContentLoaded", () => {

  // 安全取得ヘルパー
  const $ = id => document.getElementById(id);

  // 画面表示制御（既存と競合しない安全版）
  function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  }
  function showScreen(id) {
    hideAllScreens();
    const t = $(id);
    if (t) t.classList.remove('hidden');
  }

  // 動的読み込み（存在する方のファイル名に合わせる）
  if (typeof loadMainGameScript !== "function") {
    function loadMainGameScript(cb){
      if(window.mainGameLoaded) return cb && cb();
      const s = document.createElement('script');
      s.src = 'toyama-kiboukanji-j.js'; // ← 実際にある方のファイル名にする（.min.js があればそちら）
      s.defer = true;
      s.onload = ()=>{ window.mainGameLoaded = true; cb && cb(); };
      s.onerror = ()=>{ console.error('load failed', s.src); cb && cb(); };
      document.head.appendChild(s);
    }
  }

  // BGM（存在チェック）
  let waveBgm;
  try { waveBgm = new Audio("audio/穏やかな波.mp3"); waveBgm.loop = true; waveBgm.volume = 0.02; } catch(e){ waveBgm = null; }

  // Start ボタン（動的読み込み→BGM→画面→startGame）
  const startBtn = $("start-button");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      loadMainGameScript(() => {
        if (typeof playBGM === "function") {
          try { playBGM(); } catch(e){ /* ignore */ }
        } else if (waveBgm && waveBgm.paused) {
          waveBgm.currentTime = 0;
          waveBgm.play().catch(()=>{});
        }
        showScreen("game-screen");
        if (typeof startGame === "function") startGame();
      });
    });
  }

  // Manual（説明書）安全初期化
  const manualPages = [
    { title: "遊び方", text: "落ちてくる漢字をタップしてスコアを稼ごう。" },
    { title: "ボーナス", text: "連続でタップするとコンボボーナスが入る。" },
    { title: "時間制限", text: "60秒以内にできるだけ多くの漢字をタップしよう。" }
  ];
  let currentManualPage = 0;
  function loadManualPage(index) {
    if (index < 0) index = 0;
    if (index >= manualPages.length) index = manualPages.length - 1;
    currentManualPage = index;
    const t = $("manual-title");
    const p = $("manual-text");
    if (t) t.textContent = manualPages[index].title;
    if (p) p.textContent = manualPages[index].text;
  }

  const manualBtn = $("manual-button");
  if (manualBtn) {
    manualBtn.addEventListener("click", () => {
      if (typeof playBGM === "function") { try { playBGM(); } catch(e){} }
      const overlay = $("manualOverlay");
      if (overlay) overlay.classList.remove("hidden");
      loadManualPage(0);
    });
  }

  const closeManual = $("close-manual");
  if (closeManual) closeManual.addEventListener("click", () => {
    const overlay = $("manualOverlay");
    if (overlay) overlay.classList.add("hidden");
  });

  const backToTitle = $("back-to-title");
  if (backToTitle) backToTitle.addEventListener("click", () => {
    showScreen("title-screen");
    if (waveBgm) { waveBgm.pause(); waveBgm.currentTime = 0; }
  });

  // とやま（物語）ボタン
  const toyamaBtn = $("toyama-button");
  if (toyamaBtn) {
    toyamaBtn.addEventListener("click", () => {
      // 物語本体は動的読み込み後に処理される想定
      showScreen("toyamaScreen");
      if (typeof loadStoryPage === "function") loadStoryPage(0);
    });
  }

  // story から戻る（存在すれば）
  const storyBack = $("story-back");
  if (storyBack) storyBack.addEventListener("click", () => {
    if (typeof leaveStory === "function") leaveStory();
    else {
      if (waveBgm) { waveBgm.pause(); waveBgm.currentTime = 0; }
      showScreen("game-screen");
    }
  });

  // 言語切替（story 用）
  const langJa = $("lang-ja");
  if (langJa) langJa.addEventListener("click", () => {
    document.querySelectorAll(".story-ja").forEach(e => e.style.display = "block");
    document.querySelectorAll(".story-en").forEach(e => e.style.display = "none");
  });
  const langEn = $("lang-en");
  if (langEn) langEn.addEventListener("click", () => {
    document.querySelectorAll(".story-ja").forEach(e => e.style.display = "none");
    document.querySelectorAll(".story-en").forEach(e => e.style.display = "block");
  });

  // キャンバス安全登録（game-canvas）
  const c = $("game-canvas");
  if (c) {
    let touchStartX = 0, touchStartY = 0;
    c.addEventListener("touchstart", e => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    });
    c.addEventListener("touchend", e => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const dist = Math.hypot(dx, dy);
      if (typeof handleBonusTap === "function" && typeof bonusMode !== "undefined" && bonusMode && dist < 20) {
        handleBonusTap(t);
        return;
      }
      if (typeof cur === "undefined" || (typeof gameOver !== "undefined" && gameOver) || (typeof bonusMode !== "undefined" && bonusMode) || (typeof isPaused !== "undefined" && isPaused)) return;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if (dx > 0) {
          if (typeof canMove === "function" && canMove(1,0)) cur.blocks.forEach(b=>b.x++);
        } else {
          if (typeof canMove === "function" && canMove(-1,0)) cur.blocks.forEach(b=>b.x--);
        }
      } else if (dy > 30) {
        if (typeof fastDrop !== "undefined") fastDrop = true;
      }
    });
  }

  // その他、存在チェック付きの初期化をここに追加可能

}); // DOMContentLoaded end
</script>

function loadMainGameScript(cb){
  if(window.mainGameLoaded) return cb && cb();
  const s = document.createElement('script');
  s.src = 'toyama-kiboukanji-j.js'; // 後で minified を置く。なければ toyama-kiboukanji-j.js にする
  s.defer = true;
  s.onload = ()=>{ window.mainGameLoaded = true; cb && cb(); };
  s.onerror = ()=>{ console.error('load failed', s.src); };
  document.head.appendChild(s);
}

console.log("game.js loaded");
const kanjiList = ["日","月","山","川","木","金","土","空","海","風"];

// BGM フェード処理（必要ならそのまま）
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
        if (v < 0.22) { v += 0.01; audio.volume = v; } else { clearInterval(fade); }
    }, 150);
}
function fadeOut(audio) {
    let v = audio.volume;
    let fade = setInterval(() => {
        if (v > 0) { v -= 0.01; audio.volume = v; } else { audio.pause(); clearInterval(fade); }
    }, 150);
}

// ======== DOM 読み込み後 ========
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS Loaded");

    // 画面管理
    const screens = document.querySelectorAll(".screen");
    function showScreen(id) {
        screens.forEach(s => s.classList.remove("active"));
        const target = document.getElementById(id);
        if (target) target.classList.add("active");
    }

    // 最初の画面（HTML 側で active を付けていても安全）
    showScreen("title-screen");

    // BGM
    const bgm = document.getElementById("bgm");
    function playBGM() {
        if (bgm && bgm.paused) {
            bgm.volume = 0.01;
            bgm.play().catch(()=>{});
        }
    }

    // ======== ボタン ========
  const startBtn = document.getElementById("start-button");
if (startBtn) startBtn.addEventListener("click", () => {
  // 先に重い本体を動的読み込みしてからゲーム開始
  loadMainGameScript(() => {
    // BGM と画面切替は読み込み後に行う
    playBGM();
    showScreen("game-screen");
    if (typeof startGame === "function") startGame();
  });
});

    const manualBtn = document.getElementById("manual-button");
    if (manualBtn) manualBtn.addEventListener("click", () => {
        playBGM();
        showScreen("manual-screen");
        loadManualPage(0);
    });

    const toyamaBtn = document.getElementById("toyama-button");
    if (toyamaBtn) toyamaBtn.addEventListener("click", () => {
        console.log("toyama click");
        showScreen("toyamaScreen");
    });
                         // とやま画面の即時確実なハンドラ（恒久）
const amaBtn = document.getElementById('toyama-amaharashi');
if (amaBtn) amaBtn.addEventListener('click', () => {
  console.log('雨晴海岸 click');
  showScreen('storyScreen');
  if (typeof loadStoryPage === 'function') loadStoryPage(0);
});

const backBtn = document.getElementById('back-to-game');
if (backBtn) backBtn.addEventListener('click', () => {
  console.log('戻る click');
  showScreen('title-screen');
});
    // ======== 三味線（例） ========
    function playShamisenTimed() {
        if (!shamisenIntro) return;
        shamisenIntro.currentTime = 0;
        shamisenIntro.volume = 0.001;
        shamisenIntro.play().catch(()=>{});
        setTimeout(()=>{ shamisenIntro.volume = 0.0005; }, 15000);
        setTimeout(()=>{ shamisenIntro.volume = 0.0003; }, 18000);
        setTimeout(()=>{ shamisenIntro.pause(); shamisenIntro.currentTime = 0; }, 20000);
    }

    // ======== キャンバス等 以下すべてここに入れる（既存コードを移動） ========
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    if (canvas) {
        canvas.width = 800;
        canvas.height = 600;
    }

    // ゲーム変数・関数（既存の startGame, createKanji, gameLoop, endGame 等をここに入れる）
    // 省略せずに元のコードをすべてこの中に残してください。

    // タッチ判定（例）
    if (canvas) {
        canvas.addEventListener("click", (e) => {
            // 既存のクリック処理
        });
    }

}); // ← ここで DOMContentLoaded を一度だけ閉じる（ファイル末尾）
