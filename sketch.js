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
let currentPlayer = 0; // 0 for player 1, 1 for player 2
let cueBallHit = false;
let playerScores = [0, 0];
let playerTypes = [null, null];
let foulOccurred = false;
let playerFouls = [0, 0];
let gameStarted = false;
const MAX_SPEED = 20;
let showNextPlayerFlag = false; 
let backgroundMusic;
let cueBallHitsThisTurn = 0;

function setup() {
  playerFouls = [0, 0];
  createCanvas(windowWidth, windowHeight);
  backgroundMusic = loadSound('assets/Alone with Numbers.mp3', () => {
    backgroundMusic.setVolume(0.091);
    backgroundMusic.loop();
  });
  textStyle(BOLD);
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
  
   
      if ((pair.bodyA === cueBall && pair.bodyB === cueStick) || (pair.bodyA === cueStick && pair.bodyB === cueBall)) {
        cueBallHit = true;
        cueBallHitsThisTurn++;
      } else if ((pair.bodyA === cueStick || pair.bodyB === cueStick) && (pair.bodyA.label === 'ball' || pair.bodyB.label === 'ball') && pair.bodyA !== cueBall && pair.bodyB !== cueBall) {
        playerFouls[currentPlayer]++;
        foulOccurred = true;
        switchToNextPlayer();
      }
    });
  });
  currentPlayer = 0;
  cueBallHit = false;
  scoreBoard = new ScoreBoard();
}

function draw() {
  if (!gameStarted) {
    drawStartScreen();
  } else {
    background(0, 102, 0);
    drawPoolTable();
    
    
    Engine.update(engine);

    for (let ball of balls) {
      limitSpeed(ball);
      drawBall(ball);
    }
    displayPocketedBallsCount();
    displayCurrentPlayer();
    // Draw Cue Stick
    drawCuestick()
    drawPocketEllipses()

  
    resetCuestick()
    if (foulOccurred) {
      switchToNextPlayer();
    }

    displayCurrentPlayer();
    if (showNextPlayerFlag) {
      push();
      fill(0, 102, 255, 150);  // Semi-transparent overlay
      rect(0, 0, width, height);
      textSize(60);
      fill(255);
      textAlign(CENTER, CENTER);
      text("Player " + (currentPlayer + 1) + "'s Turn", width / 2, height / 2);
      pop();
    }
    scoreBoard.display();
  }
}

function drawCuestick() {
  if (cueStick) {
    let angle = Math.atan2(cueBall.position.y - cueStick.position.y, cueBall.position.x - cueStick.position.x);
    push();
    translate(cueStick.position.x, cueStick.position.y);
    rotate(angle);
    fill(0, 0, 0);
    rectMode(CENTER);
    rect(0, 0, 100, 20);
    pop();
  }
}


function drawPocketEllipses(){
  for (let j = 0; j<2;j++){
    for (let i=0;i<3;i++) {
      fill(0);
      ellipse(i*width/2, height*j, 60);
    }
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
  currentPlayer = 0;
  cueBallHit = false;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      let isStriped = ballIndex >= 8; // First 8 balls are solid, rest are striped

      let ballOptions = {
        restitution: 0.9,
        friction: 0.005,
        label: 'ball',
        render: {
          sprite: {
            texture: isStriped ? 'striped_ball.png' : 'solid_ball.png',
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
  let thickness = 20; // Thickness of the boundary walls
  let pocketRadius = 15; // Radius of the pockets

  // Adjust the boundary dimensions and positions to accommodate pockets
  World.add(world, [
    // Top and bottom boundaries (split into three segments each)
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true, label: 'boundary' }), // Top boundary
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true, label: 'boundary' }), // Bottom boundary
    Bodies.rectangle(0, height / 2, thickness, height, { isStatic: true, label: 'boundary' }), // Left boundary
    Bodies.rectangle(width, height / 2, thickness, height, { isStatic: true, label: 'boundary' }) // Right boundary // Right
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
  cueStick = Bodies.rectangle(cueBall.position.x - 100, cueBall.position.y, 100, 20, {
    isStatic: false,
    angle: 0,
    collisionFilter: { category: cueStickCategory }, // Set collision filter here
    label: 'cueStick'
  });
  World.add(world, cueStick);
}

function addMouseControl() {
  let mouse = Mouse.create(canvas.elt);

  // Define a collision category for the cue stick
  let cueStickCategory = 0x0002;

  // Set the collision category for the cue stick
  cueStick.collisionFilter.category = cueStickCategory;

  // Create a MouseConstraint with a filter that only interacts with the cue stick
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
  for (let i = 0; i < pocketPositions.length; i++) {
      let p = pocketPositions[i];
      ellipse(p[0], p[1], pocketRadius * 5, pocketRadius * 5);
      let pocket = Bodies.circle(p[0], p[1], pocketRadius, {
          isSensor: true,
          isStatic: true,
          label: 'pocket'
      });
      World.add(world, pocket);
  }
}



function handlePocketCollision(ball) {
  if (ball.label === 'ball') {
      let ballType;
      if (ball.isStriped) {
          ballType = 'Striped';
      } else {
          ballType = 'Solid';
      }

      if (playerTypes[currentPlayer] === null) {
          playerTypes[currentPlayer] = ballType;
          if (ballType === 'Striped') {
              playerTypes[(currentPlayer + 1) % 2] = 'Solid';
          } else {
              playerTypes[(currentPlayer + 1) % 2] = 'Striped';
          }
      } else if (playerTypes[currentPlayer] !== ballType) {
          foulOccurred = true;
      }

      if (!foulOccurred) {
          playerScores[currentPlayer]++;
          scoreBoard.updateScore(currentPlayer, playerScores[currentPlayer]);
      }

      pocketedBalls.push({ number: ball.number, isStriped: ball.isStriped });

      for (let i = 0; i < balls.length; i++) {
          if (balls[i] === ball) {
              balls.splice(i, 1);
              break;
          }
      }

      World.remove(world, ball);
  }
  cueBallHitsThisTurn = 0;
}

function displayPocketedBallsCount() {
    textSize(20);
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);

    let displayText = 'Pocketed Balls: ' + pocketedBalls.length + '\n';
    
    for (let i = 0; i < pocketedBalls.length; i++) {
        let ball = pocketedBalls[i];
        if (type === ball.isStriped) {
          let type = 'Striped';
        }
        else{
          let type ='Solid';
        }
        displayText += 'Ball ' + ball.number + ' (' + type + ')\n';
    }

    text(displayText, 30, 40);
}


function displayCurrentPlayer() {
  textSize(20);
  fill(255);
  noStroke();
  textAlign(RIGHT, TOP);
  text('Current Player: ' + (currentPlayer + 1), width-25, 100);
}

function resetCuestick() {
  if (cueBallHit && !cueBall.isMoving) {
    switchToNextPlayer()
    cueBallHit = false;
    
  }
}


function checkFoulConsequences() {
  for (let i = 0; i < playerFouls.length; i++) {
      if (playerFouls[i] >= 5) {
          alert('Player ' + (i + 1) + ' loses due to excessive fouls. PLEASE PLAY AGAIN');
          gameStarted = false;
          resetGame();
          break;
      }
  }
}

function drawStartScreen() {
  
  background(0); // black background
  fill('palegreen'); // pale green font color
  textSize(40);
  textAlign(CENTER, CENTER);
  text('mustafas pool game(goofy)', width / 2, height / 4);

  // Multiplayer
  fill(100, 200, 100);
  rect(width / 2 - 100, height / 2 - 25, 200, 50);
  fill('palegreen'); 
  textSize(20);
  text('Multiplayer', width / 2, height / 2);

  // Singleplayer 
  fill(100, 200, 100);
  rect(width / 2 - 100, height / 2 + 75, 200, 50);
  fill('white'); 
  text('Computer(add later)', width / 2, height / 2 + 100);

  // Rules
  fill(100, 200, 200);
  rect(width / 2 - 100, height / 2 + 150, 200, 50);
  fill('palegreen'); 
  text('Rules', width / 2, height / 2 + 175);
}

function mousePressed() {

  if (!gameStarted) {
    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 - 25 && mouseY <= height / 2 + 25) {
      gameStarted = true;
      setupGame(); 
    }
    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 + 150 && mouseY <= height / 2 + 200) {
      showRules();
    }
  }
}

function setupGame() {

  balls.forEach(ball => World.remove(world, ball));
  balls = [];
  pocketedBalls = [];
  playerScores = [0, 0];
  playerFouls = [0, 0];
  foulOccurred = false;
  gameStarted = true;
  scoreBoard = new ScoreBoard();
  setupBalls();
  createBoundaries();
  addCueBallAndStick();
  currentPlayer = 0;
  cueBallHit = false;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    gameStarted = false; 
    resetGame(); 
  }
}

function resetGame() {
  for (let i = 0; i < balls.length; i++) {
      World.remove(world, balls[i]);
  }
  balls = [];
  pocketedBalls = [];
  playerScores = [0, 0];
  playerFouls = [0, 0];
  foulOccurred = false;
  currentPlayer = 0;
  cueBallHit = false;
  gameStarted = false;
  scoreBoard = null; 
}

function showRules() {
  alert("will add later");
}

function checkGameOver() {
  
  if (playerScores[currentPlayer] == 7 && !pocketedBalls.includes(8)) {
   
    alert('Player ' + (currentPlayer + 1) + ' wins!');
    resetGame();
    return true;
  } else if (pocketedBalls.includes(8)) {
    alert('Player ' + (currentPlayer + 1) + ' loses. Black ball pocketed early.');
    resetGame();
    return true;
  }
  return false;
} 

function switchToNextPlayer() {
  currentPlayer = (currentPlayer + 1) % 2;
  foulOccurred = false;
  scoreBoard.updateFouls(currentPlayer, playerFouls[currentPlayer]);
  checkFoulConsequences();
  showNextPlayerMessage();
}

function showNextPlayerMessage() {
  push();
  fill(0, 102, 255, 150); 
  rect(0, 0, width, height);
  textSize(60);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Player " + (currentPlayer + 1) + "'s Turn", width / 2, height / 2);
  pop();
  setTimeout(clearNextPlayerMessage, 2000); 
}

function clearNextPlayerMessage() {
  showNextPlayerFlag = false;
}

function showNextPlayerMessage() {
  push();
  fill(0, 102, 255, 150); 
  rect(0, 0, width, height);
  textSize(60);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Player " + (currentPlayer + 1) + "'s Turn", width / 2, height / 2);
  pop();
  setTimeout(clearNextPlayerMessage, 2000); 
}

class ScoreBoard {
  constructor() {
      this.playerScores = [0, 0];
      this.playerFouls = [0, 0];
  }

  updateScore(playerIndex, score) {
      this.playerScores[playerIndex] = score;
  }

  updateFouls(playerIndex, fouls) {
      this.playerFouls[playerIndex] = fouls;
  }

  display() {
      textSize(20);
      fill(255);

      text("Player 1(Striped) Score: " + this.playerScores[0], width - 30, 30);
      text("Player 2(Solids) Score: " + this.playerScores[1], width - 30, 60);

      fill(255, 0, 0);
      text("Fouls - Player 1: " + this.playerFouls[0], 200, height / 2 - 30);
      text("Fouls - Player 2: " + this.playerFouls[1], 200, height / 2);
  }
}