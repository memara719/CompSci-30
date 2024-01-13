let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;
let engine, world, cueBall, cueStick;
let balls = [];
let mouseConstraint;
let ballColors = ['#FFD700', '#0D00F9', '#FF0000', '#81007F', '#FFA500', '#008000', '#870C25', '#000000', '#FFD700', '#0D00F9', '#FF0000', '#81007F', '#FFA500', '#008000', '#870C25'];
let ballNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
let pocketedBalls = [];

const MAX_SPEED = 20;


function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create(); 
  world = engine.world; 
  engine.world.gravity.y = 0;

  setupBalls();
  drawPockets();
  createBoundaries();
  addCueBallAndStick();
  addMouseControl();
  Matter.Events.on(engine, 'collisionStart', function(event) {
    let pairs = event.pairs;

    pairs.forEach(function(pair) {
      if (pair.bodyA.label === 'pocket') {
        handlePocketCollision(pair.bodyB);
      } else if (pair.bodyB.label === 'pocket') {
        handlePocketCollision(pair.bodyA);
      }
    });
  });
}

function draw() {
  background(0, 102, 0);
  drawPoolTable();
 
  
  Engine.update(engine);

  for (let ball of balls) {
    limitSpeed(ball);
    drawBall(ball);
  }

  // Draw Cue Stick
  drawCuestick()
  for (let j = 0; j<2;j++){
    for (let i=0;i<3;i++) {
      fill(0);
      ellipse(i*width/2, height*j, 60);
    }
  }
  

}

function drawCuestick(){
  if (cueStick) {
    push();
    translate(cueStick.position.x, cueStick.position.y);
    rotate(cueStick.angle);
    fill(0); 
    rectMode(CENTER);
    rect(0, 0, 100, 20); 
    pop();
  }

}




function drawBall(ball) {
  
  let ballRadius = ball.circleRadius;
  fill(ball.render.fillStyle);
  stroke(ball.render.strokeStyle);
  strokeWeight(ball.render.lineWidth);
  ellipse(ball.position.x, ball.position.y, ballRadius * 2);
  
  if (ball.isStriped) {
    fill('white');
    rect(ball.position.x - ballRadius, ball.position.y - ballRadius / 4, ballRadius * 2, ballRadius / 2);

  
  }
  
  fill(0);
  textSize(10);
  textAlign(CENTER, CENTER);
  text(ball.number, ball.position.x, ball.position.y);
   ball.isMoving = Math.abs(ball.velocity.x) > 0.1 || Math.abs(ball.velocity.y) > 0.1;
}



function drawPoolTable() {
  stroke(139, 69, 19); 
  strokeWeight(20);
  noFill();
  rect(10, 10, width - 20, height - 20);
}

function setupBalls() {
  let startX = width / 1.5;
  let startY = height / 2;
  let ballDiameter = 20;
  let ballDistance = ballDiameter + 5;
  let ballIndex = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      let isStriped = ballIndex >= 8; 
      let ballOptions = {
        restitution: 0.9,
        friction: 0.005,
        label: 'ball',
        render: {
          sprite: {
            xScale: 1,
            yScale: 1,
          },
          fillStyle: ballColors[ballIndex],
          strokeStyle: ballColors[ballIndex],
          lineWidth: 1
        }
      };

      let ball = Bodies.circle(x, y, ballDiameter / 2, ballOptions);
      ball.number = ballNumbers[ballIndex];
      ball.isStriped = isStriped;
      balls.push(ball);
      World.add(world, ball);
      ballIndex++;
    }
  }
}
function createBoundaries() {
  let thickness = 20; 
  let pocketRadius = 15; 

  World.add(world, [
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true }), // Top
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true }), // Bottom
    Bodies.rectangle(0, height / 2, thickness, height, { isStatic: true }), // Left
    Bodies.rectangle(width, height / 2, thickness, height, { isStatic: true }) // Right
  ]);
}
function addCueBallAndStick() {
  cueBall = Bodies.circle(width / 4, height / 2, 20, {
    label: 'cueBall',
    restitution: 0.9
  });
  balls.push(cueBall);
  World.add(world, cueBall);
  let cueStickCategory = 0x0002;
  // Cue Stick
  cueStick = Bodies.rectangle(cueBall.position.x - 100, cueBall.position.y, 200, 10, {
    isStatic: false,
    angle: 0,
    collisionFilter: { category: cueStickCategory }, 
    label: 'cueStick'
  });
  World.add(world, cueStick);
}

function addMouseControl() {
  let mouse = Mouse.create(canvas.elt);


  let cueStickCategory = 0x0002;

 
  cueStick.collisionFilter.category = cueStickCategory;

  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    collisionFilter: { mask: cueStickCategory }
  });

  World.add(world, mouseConstraint);
}


function drawPockets() {
  fill(0);
  let pocketRadius = 15; 
  let pocketPositions = [
    [10, 10], [width / 2, 10], [width - 10, 10],
    [10, height - 10], [width / 2, height - 10], [width - 10, height - 10]
  ];

  pocketPositions.forEach(p => {
    ellipse(p[0], p[1], pocketRadius * 5, pocketRadius * 5);
    let pocket = Bodies.circle(p[0], p[1], pocketRadius, {
      isSensor: true, // Make the pocket a sensor
      isStatic: true,
      label: 'pocket'
    });
    World.add(world, pocket);
  });
}



function handlePocketCollision(ball) {
  if (ball.label === 'ball') {
    
    pocketedBalls.push({
      number: ball.number,
      isStriped: ball.isStriped
    });
    balls = balls.filter(b => b !== ball); 
    World.remove(world, ball); 
  }
}

function limitSpeed(ball) {
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  if (speed > MAX_SPEED) {
    const scaleFactor = MAX_SPEED / speed;
    Matter.Body.setVelocity(ball, {
      x: ball.velocity.x * scaleFactor,
      y: ball.velocity.y * scaleFactor
    });
  }
}

