const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const popup = document.getElementById('popup');
const yesButton = document.getElementById('yesButton');
const noButton = document.getElementById('noButton');
const retryPopup = document.getElementById('retryPopup');
const retryButton = document.getElementById('retryButton');

const gridSize = 50;
const rows = canvas.height / gridSize;
const cols = canvas.width / gridSize;

let player = {
    x: Math.floor(cols / 2) * gridSize,
    y: (rows - 1) * gridSize,
    image: new Image(),
    direction: 1 // 1 for right, -1 for left
};
player.image.src = 'slugdog.png';

let backgroundImage = new Image();
backgroundImage.src = 'background.jpg';

let obstacles = [];
let collectibles = [];
let score = 0;
let level = 1;
let highScore = getHighScore();
let canMove = true;
let gameOver = false;
let crashEffect = { x: 0, y: 0, image: new Image() };
crashEffect.image.src = 'starburst.png';

function createObstacles() {
    obstacles = [];
    for (let i = 1; i < rows - 1; i++) {
        let baseSpeed = Math.random() * 2 + 1;
        let direction = Math.random() < 0.5 ? -1 : 1;
        let image = i % 2 === 0 ? 'van.png' : 'car.png';
        let size = gridSize;

        if (image === 'van.png' && Math.random() < 0.2) {
            size = gridSize * 2;
        } else if (image === 'car.png' && Math.random() < 0.2) {
            size = gridSize * 1.5;
        }

        obstacles.push({
            x: Math.random() < 0.5 ? -size : canvas.width,
            y: i * gridSize,
            baseSpeed: baseSpeed,
            speed: baseSpeed * direction * Math.pow(1.2, level - 1),
            image: new Image(),
            direction: direction,
            size: size
        });
        obstacles[obstacles.length - 1].image.src = image;
    }
}

function createCollectibles() {
    collectibles = [];
    for (let i = 1; i < rows - 1; i++) {
        for (let j = 0; j < cols; j++) {
            if (Math.random() < 0.1) {
                collectibles.push({
                    x: j * gridSize,
                    y: i * gridSize,
                    image: new Image(),
                    type: 'fruit',
                    points: 5
                });
                collectibles[collectibles.length - 1].image.src = 'fruit.png';
            }
        }
    }
    for (let k = 0; k < level; k++) {
        let x = Math.floor(Math.random() * cols) * gridSize;
        let y = Math.floor(Math.random() * (rows - 2) + 1) * gridSize;
        collectibles.push({
            x: x,
            y: y,
            image: new Image(),
            type: 'fruit2',
            points: 20
        });
        collectibles[collectibles.length - 1].image.src = 'fruit2.png';
    }
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.save();
    if (player.direction === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(player.image, -player.x - gridSize, player.y, gridSize, gridSize);
    } else {
        ctx.drawImage(player.image, player.x, player.y, gridSize, gridSize);
    }
    ctx.restore();
}

function drawObstacles() {
    if (gameOver) return;

    obstacles.forEach(obstacle => {
        ctx.save();
        if (obstacle.direction === 1) {
            ctx.scale(-1, 1);
            ctx.drawImage(obstacle.image, -obstacle.x - obstacle.size, obstacle.y, obstacle.size, gridSize);
        } else {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.size, gridSize);
        }
        ctx.restore();
        obstacle.x += obstacle.speed;
        if (obstacle.x < -obstacle.size || obstacle.x > canvas.width) {
            obstacle.x = Math.random() < 0.5 ? -obstacle.size : canvas.width;
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        ctx.drawImage(collectible.image, collectible.x, collectible.y, gridSize, gridSize);
    });
}

function drawCrashEffect() {
    if (gameOver) {
        ctx.drawImage(crashEffect.image, crashEffect.x, crashEffect.y, 50, 50);
    }
}

function checkCollisions() {
    if (!canMove) return;

    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.size &&
            player.x + gridSize > obstacle.x &&
            player.y < obstacle.y + gridSize &&
            player.y + gridSize > obstacle.y) {
            crashEffect.x = obstacle.x;
            crashEffect.y = obstacle.y;
            gameOver = true;
            canMove = false;
            showRetryPopup();
        }
    });

    collectibles.forEach((collectible, index) => {
        if (player.x < collectible.x + gridSize &&
            player.x + gridSize > collectible.x &&
            player.y < collectible.y + gridSize &&
            player.y + gridSize > collectible.y) {
            collectibles.splice(index, 1);
            score += collectible.points;
            scoreDisplay.textContent = `Score: ${score}`;
            updateHighScore();
        }
    });
}

function movePlayer(dx, dy) {
    if (!canMove) return;

    let newX = player.x + dx * gridSize;
    let newY = player.y + dy * gridSize;
    if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height) {
        player.x = newX;
        player.y = newY;
        player.direction = dx;
        if (newY === 0) {
            canMove = false;
            showPopup();
        }
    }
}

function resetGame() {
    player.x = Math.floor(cols / 2) * gridSize;
    player.y = (rows - 1) * gridSize;
    player.direction = 1;
    score = 0;
    level = 1;
    scoreDisplay.textContent = `Score: ${score}`;
    createObstacles();
    createCollectibles();
    canMove = true;
    gameOver = false;
}

function showPopup() {
    popup.style.display = 'block';
    popup.querySelector('p').textContent = `Congratulations! Do you want to go to level ${level + 1}?`;
}

function hidePopup() {
    popup.style.display = 'none';
}

function nextLevel() {
    if (level < 10) {
        level += 1;
        hidePopup();
        player.x = Math.floor(cols / 2) * gridSize;
        player.y = (rows - 1) * gridSize;
        player.direction = 1;
        createObstacles();
        createCollectibles();
        canMove = true;
    } else {
        alert('You have completed all levels!');
        resetGame();
        hidePopup();
    }
}

function showRetryPopup() {
    retryPopup.style.display = 'block';
}

function hideRetryPopup() {
    retryPopup.style.display = 'none';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawCollectibles();
    drawPlayer();
    drawObstacles();
    drawCrashEffect();
    if (!gameOver) {
        checkCollisions();
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', event => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
            movePlayer(1, 0);
            break;
    }
});

canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = Math.sign(x - player.x);
    const dy = Math.sign(y - player.y);
    movePlayer(dx, dy);
});

yesButton.addEventListener('click', nextLevel);

noButton.addEventListener('click', () => {
    alert(`High Score: ${highScore}`);
    resetGame();
    hidePopup();
});

retryButton.addEventListener('click', () => {
    resetGame();
    hideRetryPopup();
});

function getHighScore() {
    const highScore = document.cookie.split('; ').find(row => row.startsWith('highScore='));
    return highScore ? parseInt(highScore.split('=')[1]) : 0;
}

function setHighScore(score) {
    document.cookie = `highScore=${score}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        setHighScore(highScore);
        highScoreDisplay.textContent = `Highest Score: ${highScore}`;
    }
}

createObstacles();
createCollectibles();
gameLoop();