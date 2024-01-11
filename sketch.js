//Mustafa Emara
// Capstone proj CS30
let movingBall;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0, 102, 0); // green background
  setupBalls();
  movingBall = new Ball(width / 1.5, height / 2, 20, 2, 2); // Create a moving ball
}

function draw() {
  background(0, 102, 0); // redraw the background to clear old frames
  drawPoolTable();
  drawStaticBalls();
  movingBall.update(); // update and draw the moving ball
  movingBall.display();
}

function drawPoolTable() {
  // Drawing the table border
  stroke(139, 69, 19);
  strokeWeight(20);
  noFill();
  rect(10, 10, width - 20, height - 20);
}


function setupBalls() {
  // starting position for the triangle of balls
  let startX = width / 4;
  let startY = height / 2;
  let ballDiameter = 20; // diameter of each ball
  let ballDistance = ballDiameter + 5; // distance between balls

  // tri formation for balls
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      drawBall(x, y, ballDiameter);
    }
  }
}

function drawBall(x, y, diameter) {
  fill(255); // white color for the balls
  stroke(0); // black outline
  strokeWeight(2);
  ellipse(x, y, diameter, diameter); // drawing the ball
}

class Ball {
  constructor(x, y, diameter, vx, vy) {
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.vx = vx; // Velocity in x direction
    this.vy = vy; // Velocity in y direction
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Add boundary collision logic here
  }

  display() {
    fill(255);
    stroke(0);
    strokeWeight(2);
    ellipse(this.x, this.y, this.diameter, this.diameter);
  }
} 