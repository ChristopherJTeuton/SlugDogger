const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const popup = document.getElementById('popup');
const yesButton = document.getElementById('yesButton');
const noButton = document.getElementById('noButton');
const retryPopup = document.getElementById('retryPopup');
const retryButton = document.getElementById('retryButton');
const glossaryItems = document.getElementById('glossaryItems');
const funFactElement = document.getElementById('funFact');

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
let rocks = [];
let score = 0;
let level = 1;
let highScore = getHighScore();
let canMove = true;
let gameOver = false;
let crashEffect = { x: 0, y: 0, image: new Image() };
crashEffect.image.src = 'starburst.png';

let oozeTrail = {
    positions: [],
    image: new Image(),
    fadeDuration: 1000 // Duration in milliseconds for the ooze to fade away
};
oozeTrail.image.src = 'ooze.png';

let easterEggFound = false;

// Added bomb power-up properties
let bomb = {
    image: new Image(),
    collected: false,
    freezeDuration: 1000 // Duration in milliseconds for the freeze effect
};
bomb.image.src = 'bomb.png';

const glossaryData = [
    { image: 'slugdog.png', description: 'SlugDog: A cute little friend who just wants to get home.' },
    { image: 'van.png', description: 'SlugDog Catcher: A moving vehicle SlugDog must avoid.' },
    { image: 'car.png', description: 'Salt Car: A moving vehicle Slugdog must avoid.' },
    { image: 'firecars.png', description: 'Burning Vehicles: Likely faster than other travelers on the road.' },
    { image: 'fruit.png', description: 'Blue Gemerald: Collect for 5 points.' },
    { image: 'fruit2.png', description: 'Red Gemerald: Collect for 20 points.' },
    { image: 'rock.png', description: 'Red Traffic Cone: An obstacle SlugDog cannot move through, but vehicles can.' },
    { image: 'rock2.png', description: 'Orange Traffic Cone: An obstacle neither vehicles nor SlugDog can move through.' },
    { image: 'easteregg.png', description: 'Magic Bone: A special surprise for Slugdog!' },
    { image: 'bomb.png', description: 'Bomb: A great way to temporarily stop traffic.' } // Added bomb description
];

function createGlossary() {
    glossaryData.forEach(item => {
        const glossaryItem = document.createElement('div');
        glossaryItem.className = 'glossaryItem';
        glossaryItem.innerHTML = `
            <img src="${item.image}" alt="${item.description}">
            <p>${item.description}</p>
        `;
        glossaryItems.appendChild(glossaryItem);
    });
}

function createObstacles() {
    obstacles = [];
    for (let i = 0; i < level * 6; i++) {
        let baseSpeed = Math.random() * 2 + 1;
        let direction = Math.random() < 0.5 ? -1 : 1;
        let image = i % 2 === 0 ? (i < level ? 'vanfire.png' : 'van.png') : (i < level ? 'carfire.png' : 'car.png');
        let size = gridSize;

        if (image === 'van.png' && Math.random() < 0.2) {
            size = gridSize * 2;
        } else if (image === 'car.png' && Math.random() < 0.2) {
            size = gridSize * 1.5;
        }

        obstacles.push({
            x: Math.random() < 0.5 ? -size : canvas.width,
            y: Math.floor(Math.random() * (rows - 2) + 1) * gridSize,
            baseSpeed: baseSpeed,
            speed: baseSpeed * direction * Math.pow(1.2, level - 1),
            image: new Image(),
            direction: direction,
            size: size
        });
        obstacles[obstacles.length - 1].image.src = image;
    }

    // Easter Egg: Add a special obstacle at a random position
    if (!easterEggFound && level >= 5 && Math.random() < 0.1) {
        let easterEggObstacle = {
            x: Math.random() < 0.5 ? -gridSize : canvas.width,
            y: Math.floor(Math.random() * (rows - 2) + 1) * gridSize,
            baseSpeed: 1,
            speed: 1 * Math.pow(1.2, level - 1),
            image: new Image(),
            direction: Math.random() < 0.5 ? -1 : 1,
            size: gridSize,
            isEasterEgg: true
        };
        easterEggObstacle.image.src = 'easteregg.png';
        obstacles.push(easterEggObstacle);
    }

    // Double the speed of cars with fire images
    obstacles.forEach(obstacle => {
        if (obstacle.image.src.includes('vanfire.png') || obstacle.image.src.includes('carfire.png')) {
            obstacle.speed *= 2;
        }
    });
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

    // Add bomb power-up with increasing chance based on level
    if (Math.random() < (0.1 + (level - 1) * 0.05)) {
        let bombX = Math.floor(Math.random() * cols) * gridSize;
        let bombY = Math.floor(Math.random() * (rows - 2) + 1) * gridSize;
        collectibles.push({
            x: bombX,
            y: bombY,
            image: bomb.image,
            type: 'bomb'
        });
    }
}

function createRocks() {
    rocks = [];
    for (let i = 1; i < rows - 1; i++) {
        for (let j = 0; j < cols; j++) {
            let hasObstacle = obstacles.some(obstacle => obstacle.x === j * gridSize && obstacle.y === i * gridSize);
            let hasCollectible = collectibles.some(collectible => collectible.x === j * gridSize && collectible.y === i * gridSize);
            if (!hasObstacle && !hasCollectible && Math.random() < 0.1) {
                let isTurningPoint = Math.random() < 0.5; // 50% chance to be a turning point
                rocks.push({
                    x: j * gridSize,
                    y: i * gridSize,
                    image: new Image(),
                    isTurningPoint: isTurningPoint
                });
                rocks[rocks.length - 1].image.src = isTurningPoint ? 'rock2.png' : 'rock.png';
            }
        }
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
            obstacle.y = Math.floor(Math.random() * (rows - 2) + 1) * gridSize;
        }

        // Check for collision with turning point rocks
        rocks.forEach(rock => {
            if (rock.isTurningPoint &&
                obstacle.x < rock.x + gridSize &&
                obstacle.x + obstacle.size > rock.x &&
                obstacle.y < rock.y + gridSize &&
                obstacle.y + gridSize > rock.y) {
                obstacle.direction *= -1;
                obstacle.speed *= -1;
            }
        });
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        ctx.drawImage(collectible.image, collectible.x, collectible.y, gridSize, gridSize);
    });
}

function drawRocks() {
    rocks.forEach(rock => {
        ctx.drawImage(rock.image, rock.x, rock.y, gridSize, gridSize);
    });
}

function drawCrashEffect() {
    if (gameOver) {
        ctx.drawImage(crashEffect.image, crashEffect.x, crashEffect.y, 100, 100);
    }
}

function drawOozeTrail() {
    const now = Date.now();
    oozeTrail.positions.forEach((position, index) => {
        const elapsed = now - position.timestamp;
        const alpha = Math.max(0, 1 - elapsed / oozeTrail.fadeDuration);
        if (alpha > 0) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(oozeTrail.image, position.x, position.y, gridSize, gridSize);
            ctx.globalAlpha = 1;
        } else {
            oozeTrail.positions.splice(index, 1);
        }
    });
}

function checkCollisions() {
    if (!canMove) return;

    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.size &&
            player.x + gridSize > obstacle.x &&
            player.y < obstacle.y + gridSize &&
            player.y + gridSize > obstacle.y) {
            if (obstacle.isEasterEgg) {
                easterEggFound = true;
                alert('Congratulations! You found the easter egg!');
                score += 100;
                scoreDisplay.textContent = `Score: ${score}`;
                updateHighScore();
                obstacles.splice(obstacles.indexOf(obstacle), 1);
            } else {
                crashEffect.x = obstacle.x;
                crashEffect.y = obstacle.y;
                gameOver = true;
                canMove = false;
                showRetryPopup();
            }
        }
    });

    collectibles.forEach((collectible, index) => {
        if (player.x < collectible.x + gridSize &&
            player.x + gridSize > collectible.x &&
            player.y < collectible.y + gridSize &&
            player.y + gridSize > collectible.y) {
            if (collectible.type === 'bomb') {
                // This code is responsible for handling the bomb power-up collection
                bomb.collected = true;
                collectibles.splice(index, 1);
                freezeAndRemoveObstacles();
            } else {
                collectibles.splice(index, 1);
                score += collectible.points;
                scoreDisplay.textContent = `Score: ${score}`;
                updateHighScore();
            }
        }
    });
}

function freezeAndRemoveObstacles() {
    // This code is responsible for freezing and removing obstacles when the bomb power-up is collected
    obstacles.forEach(obstacle => {
        obstacle.speed = 0;
        obstacle.image.src = 'starburst.png';
        setTimeout(() => {
            obstacle.image.src = 'starburst.png';
            setTimeout(() => {
                const index = obstacles.indexOf(obstacle);
                if (index !== -1) {
                    obstacles.splice(index, 1);
                }
            }, 500); // Remove obstacle after 0.5 seconds
        }, 500); // Display starburst image for 0.5 seconds
    });
    setTimeout(() => {
        createObstacles();
        bomb.collected = false;
    }, bomb.freezeDuration); // Recreate obstacles after the freeze duration
}

function movePlayer(dx, dy) {
    if (!canMove) return;

    let newX = player.x + dx * gridSize;
    let newY = player.y + dy * gridSize;
    if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height) {
        let canMoveToPosition = true;
        rocks.forEach(rock => {
            if (newX === rock.x && newY === rock.y) {
                canMoveToPosition = false;
            }
        });
        if (canMoveToPosition) {
            oozeTrail.positions.push({ x: player.x, y: player.y, timestamp: Date.now() });
            player.x = newX;
            player.y = newY;
            player.direction = dx;
            if (newY === 0) {
                canMove = false;
                showPopup();
            }
        }
    }
}

function resetGame() {
    player.x = Math.floor(cols / 2) * gridSize;
    player.y = (rows - 1) * gridSize;
    player.direction = 1;
    score = 0;
    level = 1;
    easterEggFound = false;
    scoreDisplay.textContent = `Score: ${score}`;
    createObstacles();
    createCollectibles();
    createRocks();
    canMove = true;
    gameOver = false;
    oozeTrail.positions = [];
    bomb.collected = false;
}

function showPopup() {
    popup.style.display = 'block';
    popup.querySelector('p').textContent = `Congratulations! Do you want to go to level ${level + 1}?`;
    displayRandomFunFact();
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
        createRocks();
        canMove = true;
    } else {
        alert('You have completed all levels!');
        resetGame();
        hidePopup();
    }
}

function showRetryPopup() {
    retryPopup.style.display = 'block';
    retryPopup.querySelector('p').textContent = getRandomCrashWord();
}

function hideRetryPopup() {
    retryPopup.style.display = 'none';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawCollectibles();
    drawPlayer();
    drawRocks();
    drawObstacles();
    drawCrashEffect();
    drawOozeTrail();
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

const crashWords = [
    "Smash!", "Crash!", "Wham!", "Bam!", "Pow!", "Biff!", "Zap!", "Whack!", "Thwack!", "Ouch!",
    "Bang!", "Clang!", "Boom!", "Thud!", "Crunch!", "Bump!", "Thump!", "Kaboom!", "Splat!", "Clunk!"
];

function getRandomCrashWord() {
    return crashWords[Math.floor(Math.random() * crashWords.length)];
}

const funFacts = [
    "Dogs have sweat glands only in their paws!",
    "Slugs can sleep for up to three years!",
    "A dog's sense of smell is 10,000 to 100,000 times better than a human's!",
    "Slugs have four noses!",
    "Dogs have three eyelids!",
    "Slugs can lift 50 times their own body weight!",
    "A dog's nose print is as unique as a human fingerprint!",
    "Slugs are hermaphrodites, meaning they have both male and female reproductive organs!",
    "Dogs can understand up to 250 words and gestures!",
    "Slugs have a lifespan of 1 to 5 years!",
    "Dogs have a 'third eyelid' that helps keep their eye protected and moist!",
    "Slugs move by a wave of muscle contractions that propel them forward!",
    "Dogs can see in the dark better than humans!",
    "Slugs can stretch their bodies up to 20 times their normal size!",
    "Dogs have a unique organ called the Jacobson's organ that allows them to 'taste' smells!",
    "Slugs have a slimy mucus that helps them move and protects them from predators!",
    "Dogs can hear sounds at a frequency of 67-45,000 Hz, while humans can only hear up to 20,000 Hz!",
    "Slugs can regenerate lost body parts!",
    "Dogs have a special gland that releases a scent when they are scared or excited!",
    "Slugs are nocturnal creatures, meaning they are most active at night!"
];

let usedFunFacts = [];

function getRandomFunFact() {
    let randomFact;
    do {
        randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    } while (usedFunFacts.includes(randomFact));
    usedFunFacts.push(randomFact);
    return randomFact;
}

function displayRandomFunFact() {
    funFactElement.textContent = `SLUGDOG FUN FACT: ${getRandomFunFact()}`;
}

createGlossary();
createObstacles();
createCollectibles();
createRocks();
gameLoop();