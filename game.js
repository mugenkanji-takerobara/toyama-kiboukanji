// game.js（該当部分を丸ごと置き換え）
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
        playBGM();
        showScreen("game-screen");
        startGame();
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
