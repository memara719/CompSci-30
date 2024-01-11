let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies;
let engine;
let world;
let balls = [];


function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create(); // create an engine
  world = engine.world; // get the world from the engine

  setupBalls();
}
function draw() {
  background(0, 102, 0);
  drawPoolTable();

  Engine.update(engine); // update the physics engine

  for (let ball of balls) {
    fill(255);
    stroke(0);
    strokeWeight(2);
    ellipse(ball.position.x, ball.position.y, 20, 20); 
  }
}

function drawPoolTable() {
  stroke(139, 69, 19); // brown color for the border
  strokeWeight(20);
  noFill();
  rect(10, 10, width - 20, height - 20); 
}

function setupBalls() {
  // starting position for the triangle of balls
  let startX = width / 1.5;
  let startY = height / 2;
  let ballDiameter = 20; // Diameter of each ball
  let ballDistance = ballDiameter + 5; // Distance between balls

  // Creating the balls in a triangle formation
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;

      // Create a Matter.js circle body and add it to the world
      let ball = Bodies.circle(x, y, ballDiameter / 2);
      balls.push(ball);
      World.add(world, ball);
    }
  }
}

function drawBall(x, y, diameter) {
  fill(255); // white color for the balls
  stroke(0); // black outline
  strokeWeight(2);
  ellipse(x, y, diameter, diameter); // drawing the ball
}