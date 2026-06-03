(() => {
  // 安全ガード
  const $ = id => document.getElementById(id);

　const kanjiList = ['三','五','八','九','百','千','万','億','兆'];
　const bonusList = ['岳','代'];
　document.getElementById("info").textContent = '左右スワイプで移動、下スワイプで加速。 縦か横に3つそろえて。';

  // canvas / ctx
  let canvas = null;
  let ctx = null;
  let fallingKanji = [];
  let gameInterval = null;
  let timerInterval = null;
  let timeLeft = 60;
  let score = 0;

  function createKanji(){
    if(!canvas) return;
    const text = kanjiList[Math.floor(Math.random()*kanjiList.length)];
    const x = Math.random() * Math.max(0, canvas.width - 50);
    const y = -50;
    const speed = 2 + Math.random()*3;
    fallingKanji.push({text,x,y,speed});
  }

  function gameLoop(){
    if(!ctx || !canvas){ requestAnimationFrame(gameLoop); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "48px serif";
    ctx.fillStyle = "#fff";
    for(let i=0;i<fallingKanji.length;i++){
      const k = fallingKanji[i];
      k.y += k.speed;
      ctx.fillText(k.text, k.x, k.y);
      if(k.y > canvas.height + 50){ fallingKanji.splice(i,1); i--; }
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame(){
    // 初期化
    score = 0;
    timeLeft = 60;
    fallingKanji = [];
    if(gameInterval) clearInterval(gameInterval);
    if(timerInterval) clearInterval(timerInterval);

    canvas = $("game-canvas");
    ctx = canvas ? canvas.getContext("2d") : null;
    if(!canvas || !ctx){
      console.warn("game canvas not ready");
      return;
    }
    gameInterval = setInterval(createKanji, 800);
    timerInterval = setInterval(()=>{
      timeLeft--;
      if(timeLeft <= 0) endGame();
      const el = $("time-left");
      if(el) el.textContent = timeLeft;
    },1000);
    requestAnimationFrame(gameLoop);
  }

  function endGame(){
    if(gameInterval) clearInterval(gameInterval);
    if(timerInterval) clearInterval(timerInterval);
    const res = $("result-score");
    if(res) res.textContent = score;
    if(typeof window.showScreen === "function") window.showScreen("result-screen");
  }

  // 外部から呼べるようにする
  window.startGame = startGame;
  window._toyama_minimal_loaded = true;

  // DOMContentLoaded で canvas を確保しておく
  document.addEventListener("DOMContentLoaded", ()=>{
    canvas = $("game-canvas");
    ctx = canvas ? canvas.getContext("2d") : null;
    // 軽く rAF を温める
    requestAnimationFrame(()=>{});
  });
})();

