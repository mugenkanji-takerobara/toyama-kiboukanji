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
            bgm.volume = 0.4;
            bgm.play().catch(() => {});
        }
    }

    // ボタン
    document.getElementById("start-button").addEventListener("click", () => {
        playBGM();
        showScreen("game-screen");
        startGame();
    });

    document.getElementById("story-button").addEventListener("click", () => {
        playBGM();
        showScreen("story-screen");
        loadStoryPage(0);
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

    // 漢字データ
    const kanjiList = [
        "山", "川", "海", "風", "空", "星", "光", "道",
        "森", "林", "花", "雪", "雨", "雷", "雲", "鳥",
        "魚", "虫", "草", "竹", "石", "火", "水", "土"
    ];

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
    // ======== ストーリーデータ ========
    const storyPages = [
        { title: "海のほとりにひらく景色", text: "海辺に広がる静かな景色が、心を落ち着かせる。" },
        { title: "風が運ぶ記憶", text: "風がそっと運んでくるのは、遠い日の記憶。" },
        { title: "光の道しるべ", text: "光が差し込むその先に、新しい物語が待っている。" }
    ];

    function loadStoryPage(index) {
        if (index < 0) index = 0;
        if (index >= storyPages.length) index = storyPages.length - 1;

        currentStoryPage = index;

        document.getElementById("story-title").textContent = storyPages[index].title;
        document.getElementById("story-text").textContent = storyPages[index].text;
    }

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
    });

}); // DOMContentLoaded 終了
