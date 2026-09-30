const game = document.getElementById("game");
const player = document.getElementById("player");

const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const coinsText = document.getElementById("coins");
const speedText = document.getElementById("speed");

const nitroFill = document.getElementById("nitro-fill");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const pauseScreen = document.getElementById("pause-screen");

const finalScore = document.getElementById("final-score");
const highScoreText = document.getElementById("high-score");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let gameRunning = false;
let paused = false;

let playerX = 50;

let score = 0;
let coins = 0;
let level = 1;

let gameSpeed = 5;
let nitro = 100;

let enemyTimer = 0;
let coinTimer = 0;

let enemies = [];
let coinObjects = [];

let keys = {};

let highScore =
    Number(localStorage.getItem("neonRushHighScore")) || 0;

highScoreText.textContent = highScore;


/* =========================
   KEYBOARD
========================= */

document.addEventListener("keydown", (e) => {

    keys[e.key.toLowerCase()] = true;

    if (
        ["arrowleft", "arrowright", " ", "a", "d"].includes(
            e.key.toLowerCase()
        )
    ) {
        e.preventDefault();
    }

    if (e.key.toLowerCase() === "p") {
        togglePause();
    }

});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});


/* =========================
   START GAME
========================= */

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

function startGame() {

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    score = 0;
    coins = 0;
    level = 1;

    gameSpeed = 5;
    nitro = 100;

    playerX = 50;

    enemies.forEach(enemy => enemy.element.remove());
    coinObjects.forEach(coin => coin.element.remove());

    enemies = [];
    coinObjects = [];

    player.style.left = playerX + "%";

    gameRunning = true;
    paused = false;

    updateHUD();

    requestAnimationFrame(gameLoop);
}


/* =========================
   PAUSE
========================= */

function togglePause() {

    if (!gameRunning) return;

    paused = !paused;

    if (paused) {
        pauseScreen.classList.remove("hidden");
    } else {
        pauseScreen.classList.add("hidden");
        requestAnimationFrame(gameLoop);
    }
}


/* =========================
   GAME LOOP
========================= */

let lastTime = 0;

function gameLoop(time) {

    if (!gameRunning || paused) return;

    const delta = time - lastTime;
    lastTime = time;

    movePlayer();
    spawnEnemies();
    spawnCoins();

    moveEnemies(delta);
    moveCoins(delta);

    checkCollisions();

    updateDifficulty();
    updateHUD();

    requestAnimationFrame(gameLoop);
}


/* =========================
   PLAYER
========================= */

function movePlayer() {

    let movement = 0;

    if (keys["arrowleft"] || keys["a"]) {
        movement -= 0.8;
    }

    if (keys["arrowright"] || keys["d"]) {
        movement += 0.8;
    }

    playerX += movement;

    /* Nitro */
    if (
        (keys[" "] || keys["space"]) &&
        nitro > 0
    ) {
        nitro -= 0.8;
        gameSpeed += 0.08;
    } else {

        if (nitro < 100) {
            nitro += 0.15;
        }

        const normalSpeed = 5 + (level - 1) * 0.7;

        if (gameSpeed > normalSpeed) {
            gameSpeed -= 0.05;
        }
    }

    /* Road boundaries */
    if (playerX < 14) {
        playerX = 14;
    }

    if (playerX > 86) {
        playerX = 86;
    }

    player.style.left = playerX + "%";

    nitroFill.style.width = nitro + "%";
}


/* =========================
   ENEMY SPAWN
========================= */

function spawnEnemies() {

    enemyTimer++;

    const spawnRate =
        Math.max(25, 70 - level * 5);

    if (enemyTimer < spawnRate) return;

    enemyTimer = 0;

    const enemy = document.createElement("div");

    enemy.classList.add("enemy");

    const lanePositions = [25, 37.5, 50, 62.5, 75];

    const lane =
        lanePositions[
            Math.floor(
                Math.random() * lanePositions.length
            )
        ];

    enemy.style.left = lane + "%";
    enemy.style.top = "-100px";

    game.appendChild(enemy);

    enemies.push({
        element: enemy,
        y: -100,
        lane: lane
    });
}


/* =========================
   MOVE ENEMIES
========================= */

function moveEnemies(delta) {

    enemies.forEach((enemy, index) => {

        enemy.y += gameSpeed;

        enemy.element.style.top =
            enemy.y + "px";

        if (enemy.y > game.clientHeight) {

            enemy.element.remove();

            enemies.splice(index, 1);

            score += 10;
        }

    });
}


/* =========================
   COINS
========================= */

function spawnCoins() {

    coinTimer++;

    if (coinTimer < 100) return;

    coinTimer = 0;

    const coin = document.createElement("div");

    coin.classList.add("coin");

    const lanePositions = [
        25,
        37.5,
        50,
        62.5,
        75
    ];

    const lane =
        lanePositions[
            Math.floor(
                Math.random() * lanePositions.length
            )
        ];

    coin.style.left = lane + "%";
    coin.style.top = "-40px";

    game.appendChild(coin);

    coinObjects.push({
        element: coin,
        y: -40
    });
}


function moveCoins(delta) {

    coinObjects.forEach((coin, index) => {

        coin.y += gameSpeed;

        coin.element.style.top =
            coin.y + "px";

        if (coin.y > game.clientHeight) {

            coin.element.remove();

            coinObjects.splice(index, 1);
        }

    });
}


/* =========================
   COLLISION
========================= */

function checkCollisions() {

    const playerRect =
        player.getBoundingClientRect();

    /* Enemy collision */

    enemies.forEach(enemy => {

        const enemyRect =
            enemy.element.getBoundingClientRect();

        if (isColliding(playerRect, enemyRect)) {
            endGame();
        }

    });

    /* Coin collision */

    coinObjects.forEach((coin, index) => {

        const coinRect =
            coin.element.getBoundingClientRect();

        if (isColliding(playerRect, coinRect)) {

            coins++;

            score += 50;

            coin.element.remove();

            coinObjects.splice(index, 1);
        }

    });
}


function isColliding(a, b) {

    const padding = 8;

    return !(
        a.right - padding < b.left ||
        a.left + padding > b.right ||
        a.bottom - padding < b.top ||
        a.top + padding > b.bottom
    );
}


/* =========================
   DIFFICULTY
========================= */

function updateDifficulty() {

    level =
        Math.floor(score / 500) + 1;

    const targetSpeed =
        5 + (level - 1) * 0.7;

    if (gameSpeed < targetSpeed) {
        gameSpeed += 0.01;
    }

}


/* =========================
   HUD
========================= */

function updateHUD() {

    scoreText.textContent =
        Math.floor(score);

    coinsText.textContent =
        coins;

    levelText.textContent =
        level;

    speedText.textContent =
        Math.floor(gameSpeed);

    nitroFill.style.width =
        Math.max(0, nitro) + "%";
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameRunning = false;

    finalScore.textContent =
        Math.floor(score);

    if (score > highScore) {

        highScore = Math.floor(score);

        localStorage.setItem(
            "neonRushHighScore",
            highScore
        );
    }

    highScoreText.textContent =
        highScore;

    gameOverScreen.classList.remove("hidden");
}