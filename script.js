const canvas = document.querySelector("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
let intervalTime = 1300;

if (innerWidth < 500) {
  intervalTime = 800;
}

const c = canvas.getContext("2d");
let mouse = {
  x: undefined,
  y: undefined,
};

let angle,
  intervalId,
  score = 0,
  bestScore = localStorage.getItem("bestScore");
let shoot = document.getElementById("shoot");
let explosion = document.getElementById("explosion");
let scoreSpan = document.getElementById("scoreSpan");
let bestScoreSpan = document.getElementById("bestScoreSpan");
let startBtn = document.getElementById("startGame-btn");
let gameStarted = false;
if (bestScore) {
  bestScoreSpan.innerHTML = bestScore;
}

let currentFrame = null;
let ironDomeArray = [];
let missileArray = [];
let splinterArray = [];

const friction = 0.99;

const explosionSound = () => {
  if (explosion.paused) {
    explosion.play();
  } else {
    explosion.currentTime = 0;
    explosion.play();
  }
};

const shootSound = () => {
  if (currentFrame) {
    if (shoot.paused) {
      shoot.play();
    } else {
      shoot.currentTime = 0;
      shoot.play();
    }
  }
};

// BluePrints of all the objects

class Missile {
  constructor(x, y, r, dx, dy, color) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  move() {
    this.draw();
    this.x += this.dx;
    this.y += this.dy;
  }
}

// __________
class IronDome extends Missile {
  constructor(...args) {
    super(...args);
    this.dx = this.dx * 10;
    this.dy = this.dy * 10;
  }
}

//________
class Splinter extends Missile {
  constructor(...args) {
    super(...args);
    this.alpha = 1;
  }
  draw() {
    c.save();
    c.globalAlpha = 0.1;
    super.draw();
    c.restore();
  }
  move() {
    this.alpha -= 0.01;
    this.dx = this.dx * friction;
    this.dy = this.dy * friction;
    super.move();
  }
}

// ________
class Player {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = "white";
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

// _______________________________________
// player instance
const player = new Player(innerWidth / 2, innerHeight / 2, 30);

//Missile Attack
const missileAttack = () => {
  intervalId = setInterval(() => {
    const r = Math.random() * (30 - 5) + 5;
    let x, y;
    if (Math.random < 0.5) {
      x = Math.random() < 0.5 ? 0 - r : innerWidth + r;
      y = Math.random() * innerHeight;
    } else {
      x = Math.random() * innerWidth;
      y = Math.random() < 0.5 ? 0 - r : innerHeight + r;
    }

    let angle = Math.atan2(innerWidth / 2 - x, innerHeight / 2 - y);
    missileArray.push(
      new Missile(
        x,
        y,
        r,
        Math.sin(angle),
        Math.cos(angle),
        `hsl(${Math.random() * 360}, 100%, 50%)`
      )
    );
  }, intervalTime);
};

// Animation
const startAnimation = () => {
  currentFrame = requestAnimationFrame(startAnimation);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, innerWidth, innerHeight);
  player.draw();

  splinterArray.forEach((splinter, index) => {
    if (splinter.alpha <= 0) {
      splinterArray.slice(index, 1);
    } else {
      splinter.move();
    }
  });

  //Missile Attack
  missileArray.forEach((missile, missileIndex) => {
    missile.move();
    //game over
    let killed =
      Math.hypot(player.x - missile.x, player.y - missile.y) -
        (missile.r + player.r) <
      1;
    if (killed) {
      startBtn.innerHTML = "Play Again";
      startBtn.style.display = "block";
      gameStarted = false;
      clearInterval(intervalId);

      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
      }
      cancelAnimationFrame(currentFrame);
      currentFrame = null;
    }

    ironDomeArray.forEach((ironDome, ironDomeIndex) => {
      const shot =
        Math.hypot(ironDome.x - missile.x, ironDome.y - missile.y) -
          (missile.r + ironDome.r) <
        1;

      //when our Iron Dome successfully intercepts the Missile fired at us
      if (shot) {
        score += 100;
        scoreSpan.innerHTML = score;

        let splinterCount = missile.r;
        for (let i = 0; i <= splinterCount; i++) {
          splinterArray.push(
            new Splinter(
              missile.x,
              missile.y,
              Math.random() * 4,
              (Math.random() - 0.5) * (Math.random() * 12),
              (Math.random() - 0.5) * (Math.random() * 12),
              missile.color
            )
          );

          explosionSound();
        }

        if (missile.r - 8 > 10) {
          gsap.to(missile, {
            r: missile.r - 10,
          });
          ironDomeArray.splice(ironDomeIndex, 1);
        } else {
          missileArray.splice(missileIndex, 1);
          ironDomeArray.splice(ironDomeIndex, 1);
        }
      }
    });
  });

  //shoot to kill
  ironDomeArray.forEach((ironDome, index) => {
    if (
      ironDome.x + ironDome.r <= 0 ||
      ironDome.x - ironDome.r >= innerWidth ||
      ironDome.y + ironDome.r <= 0 ||
      ironDome.y - ironDome.r >= innerHeight
    ) {
      ironDomeArray.splice(index, 1);
    }
    ironDome.move();
  });
};

if (gameStarted) {
}
addEventListener("click", (e) => {
  if (gameStarted) {
    mouse = {
      x: e.clientX,
      y: e.clientY,
    };
    angle = Math.atan2(mouse.x - innerWidth / 2, mouse.y - innerHeight / 2);
    ironDomeArray.push(
      new IronDome(
        innerWidth / 2,
        innerHeight / 2,
        10,
        Math.sin(angle),
        Math.cos(angle),
        "rgb(100, 100, 100)"
      )
    );

    shootSound();
  }
});

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  setTimeout(() => {
    gameStarted = true;
  }, 0);

  //setting the initial state of game
  currentFrame = null;
  ironDomeArray = [];
  missileArray = [];
  splinterArray = [];
  score = 0;
  scoreSpan.innerHTML = score;
  startAnimation();
  missileAttack();
});
