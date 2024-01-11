//Mustafa Emara
// Capstone proj CS30
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0, 102, 0); //
}

function draw() {
  drawPoolTable();
  setupBalls();
}

function drawPoolTable() {
  stroke(139, 69, 19); // brown color for the border
  strokeWeight(20);
  noFill();
  rect(10, 10, width - 20, height - 20); // Drawing the border
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