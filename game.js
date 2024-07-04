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

const speedMultiplier = 2;
let isBoosting = false;
let currentRoom = 1;
let background;

function preload() {
  this.load.image("background1", "/images/ground.jpg");
  this.load.image("background2", "/images/ground2.png");
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
  const speed = isBoosting ? 640 : 320;
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

  if (player.x + 50 >= window.innerWidth || player.y + 50 >= window.innerHeight) {
    changeRoom.call(this);
  }
}

function updateTimer() {
  this.timeLeft--;

  if (this.timeLeft <= 0) {
    this.timeLeft = 0;
    this.timerEvent.remove();
    alert('Game Over!');
    this.scene.pause();
  }

  timerText.setText('Time: ' + this.timeLeft);
}

function changeRoom() {
  currentRoom++;
  if (currentRoom > 2) currentRoom = 1;

  let newBackgroundKey = `background${currentRoom}`;
  background.setTexture(newBackgroundKey);
  player.setPosition(window.innerWidth / 2, window.innerHeight / 2);
}

function spawnCoinOfType(coinType, displaySize, lifetime, scoreIncrement, bonusTime) {
  const x = Phaser.Math.Between(0, window.innerWidth);
  const y = Phaser.Math.Between(0, window.innerHeight);

  let coin = this.physics.add.sprite(x, y, coinType);
  coin.setDisplaySize(displaySize.width, displaySize.height);

  this.physics.add.overlap(player, coin, function (player, coin) {
    collect.call(this, player, coin, scoreIncrement, bonusTime);
  }, null, this);

  this.time.delayedCall(lifetime, () => {
    if (coin) {
      coin.destroy();
    }
  });
}

function spawnCoin() {
  spawnCoinOfType.call(this, "coin", { width: 40, height: 60 }, 9000, 1, 1);
}

function spawnGreenCoin() {
  spawnCoinOfType.call(this, "greenCoin", { width: 40, height: 60 }, 6000, 10, 4);
}

function spawnRedCoin() {
  spawnCoinOfType.call(this, "redCoin", { width: 40, height: 60 }, 3000, 20, 8);
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

  // Respawn a new coin if the collected coin was a regular coin
  if (coin.texture.key === 'coin') {
    spawnCoin.call(this);
  }
}

function checkScore() {
  if (score >= 50) {
    this.scene.pause();

    let promptBackground = this.add.rectangle(
      window.innerWidth / 2,
      window.innerHeight / 2,
      400,
      200,
      0x000000,
      0.8
    );

    let promptText = this.add.text(
      window.innerWidth / 2,
      window.innerHeight / 2 - 50,
      "You reached 50 points! Generate NFT?",
      { fontSize: "20px", fill: "#fff" }
    ).setOrigin(0.5, 0.5);

    let yesButton = this.add.text(window.innerWidth / 2 - 50, window.innerHeight / 2 + 50, "Yes", {
      fontSize: "20px",
      fill: "#0f0",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        promptBackground.destroy();
        promptText.destroy();
        yesButton.destroy();
        noButton.destroy();
        alert("Generating your NFT!");
      });

    let noButton = this.add.text(window.innerWidth / 2 + 50, window.innerHeight / 2 + 50, "No", {
      fontSize: "20px",
      fill: "#f00",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        promptBackground.destroy();
        promptText.destroy();
        yesButton.destroy();
        noButton.destroy();
        this.scene.resume();
      });
  }
}
