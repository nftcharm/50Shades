const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player;
let cursors;
let score = 0;
let scoreText;
let coinSound;
let powerUpSpeed;
let backgroundMusic;
let timeLeft = 60;
let blueCoinCount = 72;
let redCoinCount = 18;
let greenCoinCount = 42;
let blueCoinIncrease = 1
let greenCoinIncrease = 3
let redCoinIncrease = 6

const speedMultiplier = 2;
let isBoosting = false;
let currentRoom = 1;
let background;

function preload() {
  this.load.image("background1", "/images/ground.png");
  // this.load.image("background2", "/images/ground2.png");
  this.load.image("player", "/images/player.png");
  this.load.image("coin", "/images/blueCoin.png");
  this.load.image("redCoin", "/images/redCoin.png");
  this.load.image("greenCoin", "/images/greenCoin.png");
  this.load.image("powerUpSpeed", "/images/powerup.png");
  this.load.audio("coinSound", "/sounds/pickup.mp3");
  this.load.audio("backgroundMusic", "/sounds/background.mp3");
}

function create() {
  const bgMusic = this.sound.add("backgroundMusic", { loop: true });
  bgMusic.play();

  background = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, "background1");
  background.setOrigin(0, 0);

  player = this.physics.add.sprite(window.innerWidth / 2, window.innerHeight / 2, "player");
  player.setCollideWorldBounds(true);
  player.setDepth(1);

  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(window.innerWidth - 20, 20, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
  }).setOrigin(1, 0);

  timerText = this.add.text(window.innerWidth - 20, 60, "Time: 60", {
    fontSize: "32px",
    fill: "#fff",
  }).setOrigin(1, 0);

  this.timeLeft = 60;
  
  this.timerEvent = this.time.addEvent({
    delay: 1000,
    callback: updateTimer,
    callbackScope: this,
    loop: true,
  });

  coinSound = this.sound.add("coinSound");

  spawnCoin.call(this);
  scheduleRedCoin.call(this);
  scheduleGreenCoin.call(this);
  schedulePowerUpSpeed.call(this);
}

function update() {
  const speed = isBoosting ? 920 : 460;
  player.setVelocity(0);

  if (cursors.up.isDown) {
    player.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.setVelocityY(speed);
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
  }

  // if (player.x + 50 >= window.innerWidth || player.y + 50 >= window.innerHeight) {
  //   changeRoom.call(this);
  // }
}

function updateTimer() {
  this.timeLeft--;

  if (this.timeLeft <= 0) {
    this.timeLeft = 0;
    this.timerEvent.remove();
    player.setVisible(false);

    generatePixelArt.call(this, this.score);
    this.scene.pause();
  }

  timerText.setText('Time: ' + this.timeLeft);
}

// function changeRoom() {
//   currentRoom++;
//   if (currentRoom > 2) currentRoom = 1;

//   let newBackgroundKey = `background${currentRoom}`;
//   background.setTexture(newBackgroundKey);
//   player.setPosition(window.innerWidth / 2, window.innerHeight / 2);
// }

function spawnCoinOfType(coinType, displaySize, lifetime, scoreIncrement, bonusTime, destroy = true) {
  const x = Phaser.Math.Between(0, window.innerWidth);
  const y = Phaser.Math.Between(0, window.innerHeight);

  let coin = this.physics.add.sprite(x, y, coinType);
  coin.setDisplaySize(displaySize.width, displaySize.height);

  this.physics.add.overlap(player, coin, function (player, coin) {
    collect.call(this, player, coin, scoreIncrement, bonusTime);
  }, null, this);

  if (destroy) {
    this.time.delayedCall(lifetime, () => {
      if (coin) {
        coin.destroy();
      }
    });
  }
}

function spawnCoin() {
  spawnCoinOfType.call(this, "coin", { width: 60, height: 80 }, 9000, 1, 1, blueCoinIncrease);
}

function spawnGreenCoin() {
  spawnCoinOfType.call(this, "greenCoin", { width: 60, height: 80 }, 6000, 4, greenCoinIncrease);
}

function spawnRedCoin() {
  spawnCoinOfType.call(this, "redCoin", { width: 60, height: 80 }, 4500, 8, redCoinIncrease);
}

function scheduleFunction(delay, callback) {
  this.time.addEvent({
    delay,
    callback,
    callbackScope: this,
    loop: true,
  });
}

function schedulePowerUpSpeed() {
  scheduleFunction.call(this, 15000, spawnPowerUpSpeed);
}

function spawnPowerUpSpeed() {
  const x = Phaser.Math.Between(0, window.innerWidth);
  const y = Phaser.Math.Between(0, window.innerHeight);

  if (powerUpSpeed) {
    powerUpSpeed.destroy();
  }

  powerUpSpeed = this.physics.add.sprite(x, y, "powerUpSpeed");
  powerUpSpeed.setDisplaySize(100, 100);

  this.physics.add.overlap(player, powerUpSpeed, collectPowerUpSpeed, null, this);

  this.time.delayedCall(6000, () => {
    if (powerUpSpeed) {
      powerUpSpeed.destroy();
    }
  });
}

function scheduleRedCoin() {
  scheduleFunction.call(this, 40000, spawnRedCoin);
}

function scheduleGreenCoin() {
  scheduleFunction.call(this, 20000, spawnGreenCoin);
}

function collectPowerUpSpeed(player, powerUpSpeed) {
  powerUpSpeed.destroy();
  isBoosting = true;

  this.time.delayedCall(5000, () => {
    isBoosting = false;
  });

  coinSound.play();
}

function collect(player, coin, scoreIncrement, bonusTime) {
  coin.destroy();
  score += scoreIncrement;
  scoreText.setText("Score: " + score);
  coinSound.play();
  this.timeLeft += bonusTime;
  timerText.setText('Time: ' + this.timeLeft);

  // Zähle Münzen je nach Typ
  if (coin.texture.key === 'coin') {
    blueCoinCount += blueCoinIncrease;
    spawnCoin.call(this);
  } else if (coin.texture.key === 'redCoin') {
    redCoinCount += redCoinIncrease;
  } else if (coin.texture.key === 'greenCoin') {
    greenCoinCount += greenCoinIncrease;
  }
}

function generatePixelArt() {
  let totalPixels = blueCoinCount + redCoinCount + greenCoinCount;
  let pixelSize = 20;
  let size = Math.ceil(Math.sqrt(totalPixels));

  let graphics = this.add.graphics({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  graphics.clear();
  graphics.setDepth(2);

  graphics.x -= (size * pixelSize) / 2;
  graphics.y -= (size * pixelSize) / 2;

  let backgroundGraphics = this.add.graphics({ x: 0, y: 0 });
  backgroundGraphics.fillStyle(0x000000, 1);
  backgroundGraphics.fillRect(0, 0, window.innerWidth, window.innerHeight);

  let pixels = [];
  for (let i = 0; i < blueCoinCount; i++) pixels.push(0x0000ff);
  for (let i = 0; i < redCoinCount; i++) pixels.push(0xff0000);
  for (let i = 0; i < greenCoinCount; i++) pixels.push(0x00ff00);

  shuffleArray(pixels);

  pixels.forEach((color, index) => {
    let x = Math.floor(index % size);
    let y = Math.floor(index / size);
    graphics.fillStyle(color, 1);
    graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  });

  let textY = graphics.y + size * pixelSize + 50;

  let gameOver = this.add.text(window.innerWidth / 2, textY, 'GAME OVER', {
    fontSize: '42px',
    fill: '#ffffff',
    align: 'center'
  }).setOrigin(0.5, 0);

  let followText = this.add.text(window.innerWidth / 2, textY + 40, 'Follow us on X:', {
    fontSize: '20px',
    fill: '#ffffff',
    align: 'center'
  }).setOrigin(0.5, 0);

  let link1 = this.add.text(window.innerWidth / 2, textY + 70, '@0xShifters', {
    fontSize: '20px',
    fill: '#00bfff',
    align: 'center'
  }).setOrigin(0.5, 0).setInteractive();

  let link2 = this.add.text(window.innerWidth / 2, textY + 100, '@TED3166', {
    fontSize: '20px',
    fill: '#00bfff',
    align: 'center'
  }).setOrigin(0.5, 0).setInteractive();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
