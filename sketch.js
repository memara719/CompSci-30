let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;
let engine;
let world;
let balls = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();  // create an engine
  world = engine.world; // get the world from the engine

  
  engine.world.gravity.y = 0;

  setupBalls();
  createBoundaries();
}

function draw() {
  background(0, 102, 0);
  drawPoolTable();

  Engine.update(engine); // update the physics engine

  for (let ball of balls) {
    fill(255); 
    stroke(0); 
    strokeWeight(2);
    ellipse(ball.position.x, ball.position.y, ball.circleRadius * 2, ball.circleRadius * 2);
  }
}

function drawPoolTable() {
   // Drawing the table border
  stroke(139, 69, 19); // brown color for the border
  strokeWeight(20);
  noFill();
  rect(10, 10, width - 20, height - 20);
}

function setupBalls() {
  let startX = width / 1.5;
  let startY = height / 2;
  let ballDiameter = 20;
  let ballDistance = ballDiameter + 5;

  // tri formation for balls
  // Creating the balls in a triangle formation
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      // Create a Matter.js circle body and add it to the world
      let ball = Bodies.circle(x, y, ballDiameter / 2, {
        restitution: 0.9, 
        friction: 0.005  
      });
      balls.push(ball);
      World.add(world, ball);
    }
  }
}

function createBoundaries() {
  let thickness = 20; 
  World.add(world, [
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true }), // Top
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true }), // Bottom
    Bodies.rectangle(0, height / 2, thickness, height, { isStatic: true }), // Left
    Bodies.rectangle(width, height / 2, thickness, height, { isStatic: true }) // Right
  ]);
}