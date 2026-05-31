console.log("game.js loaded");
const kanjiList = ["日","月","山","川","木","金","土","空","海","風"];
// ======== BGM フェード処理 ========
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

// ======== DOM 読み込み後 ========
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS Loaded");

    // 最初の画面
    showScreen("title-screen");

// 画面管理
const screens = document.querySelectorAll(".screen");
function showScreen(id) {
    screens.forEach(s => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
}
// ★ showScreen は削除（toyama-kiboukanji-j.js のものを使う）

    // BGM
    const bgm = document.getElementById("bgm");
    function playBGM() {
        if (bgm.paused) {
            bgm.volume = 0.01;
            bgm.play().catch(() => {});
        }
    }

    // ======== ボタン ========
    document.getElementById("start-button").addEventListener("click", () => {
        playBGM();
        showScreen("game-screen");
        startGame();
    });

    // 三味線（18秒再生）
    function playShamisenTimed() {
        shamisenIntro.currentTime = 0;
        shamisenIntro.volume = 0.001;
        shamisenIntro.play().catch(()=>{});

        setTimeout(() => { shamisenIntro.volume = 0.0005; }, 15000);
        setTimeout(() => { shamisenIntro.volume = 0.0003; }, 18000);
        setTimeout(() => {
            shamisenIntro.pause();
            shamisenIntro.currentTime = 0;
        }, 20000);
    }

    // manual-button（存在確認済み）
    document.getElementById("manual-button").addEventListener("click", () => {
        playBGM();
        showScreen("manual-screen");
        loadManualPage(0);
    });
　　document.getElementById("toyama-button").onclick = () => {
  console.log("toyama click");
  showScreen("toyamaScreen");
};
    // ======== ストーリー・説明書ページ管理 ========
    let currentStoryPage = 0;
    let currentManualPage = 0;

     // document.getElementById("story-next").addEventListener("click", () => {
          // currentStoryPage++;
          // loadStoryPage(currentStoryPage);
      // });

     // document.getElementById("story-prev").addEventListener("click", () => {
           //currentStoryPage--;
          // loadStoryPage(currentStoryPage);
      // });

     // document.getElementById("manual-next").addEventListener("click", () => {
           //currentManualPage++;
           //loadManualPage(currentManualPage);
      // });

     // document.getElementById("manual-prev").addEventListener("click", () => {
           //currentManualPage--;
           //loadManualPage(currentManualPage);
      // });

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

        ctx.font = "48px serif";
        ctx.fillStyle = "#ffffff";

        for (let i = 0; i < fallingKanji.length; i++) {
            const k = fallingKanji[i];
            k.y += k.speed;

            ctx.fillText(k.text, k.x, k.y);

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
});

