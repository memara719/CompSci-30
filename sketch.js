let cueStickAngle = 0;
let cueStickPower = 0;
let isCueStickDragging = false;
let cueStickMaxPower = 15;
let cueStickPowerIncrement = 2;
let wasCueStickDragging = false;

let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;
let engine, world, cueBall;
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
let cueBallHitCount = 0;
let aimingLineLength = 10500;
let aimingLineVisible = true;
let poolTableImage;
let borderWidth = 20;
let backgroundImage;
let gameOver = false;
let overlayMessage = "";
let showOverlay = false;
let overlayTimeout;
let showRulesScreen = false;

const RELATIVE_BALL_DIAMETER = 0.04; 
const RELATIVE_BALL_RADIUS = RELATIVE_BALL_DIAMETER / 2;
const RELATIVE_CUE_LENGTH = 0.3; 
const RELATIVE_CUE_WIDTH = 0.005; 
const RELATIVE_POCKET_RADIUS = 0.09; 
const RELATIVE_BORDER_WIDTH = 0.15; 
const RELATIVE_CUE_BALL_START_X = 2 / 7.13; 
const RELATIVE_CUE_BALL_START_Y = 0.5; 
const RELATIVE_MAX_SPEED = 0.01; 


function preload() {
  poolTableImage = loadImage('assets/pool_table.jpg.png');
  backgroundImage = loadImage('assets/Background.png');
}

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
      // Handling pocket collisions
      if (pair.bodyA.label === 'pocket') {
        handlePocketCollision(pair.bodyB);
      } else if (pair.bodyB.label === 'pocket') {
        handlePocketCollision(pair.bodyA);
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
    if (showRulesScreen) {
      drawRulesScreen();
    }
  } else {
    
    background(0, 102, 0);
    image(poolTableImage, 0, 0, width, height);
    updateCueStick();
    drawCueStick();
    drawOverlay();
    drawPowerBar();
    displayPlayerTypes();
    if (aimingLineVisible) {
      drawAimingLine();
    }
  
    
    Engine.update(engine);

    for (let ball of balls) {
      limitSpeed(ball);
      drawBall(ball);
    }
    displayPocketedBallsCount();
    displayCurrentPlayer();


    if (wasCueStickDragging && !isCueStickDragging) {
      if (Math.abs(cueBall.velocity.x) > 0.1 || Math.abs(cueBall.velocity.y) > 0.1) {
          cueBallHit = true;
          cueBallHitCount++; 
      }
    }
    wasCueStickDragging = isCueStickDragging;
    resetCuestick();
    scoreBoard.display();
    drawOverlay();
  }
  
}


function updateCueStick() {
  // Update angle based on mouse position
  cueStickAngle = atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
}

function drawCueStick() {
  let cueLength = Math.min(windowWidth, windowHeight) * RELATIVE_CUE_LENGTH;
  let cueWidth = Math.min(windowWidth, windowHeight) * RELATIVE_CUE_WIDTH;
  if (!cueBall.isMoving) {
    push();
    translate(cueBall.position.x, cueBall.position.y);
    rotate(cueStickAngle);

    // Adjust the position based on the cue stick power
    let cueStickOffset = map(cueStickPower, 0, cueStickMaxPower, 0, 50);
    translate(-cueStickOffset, 0);

    fill(0, 0, 0);
    rectMode(RADIUS);
    rect(0, 0, cueLength, cueWidth);
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

function setupBalls() {
  let ballDiameter = Math.min(windowWidth, windowHeight) * RELATIVE_BALL_DIAMETER;
  let startX = width * 0.66; // Starting X position at 2/3 of window width
  let startY = height / 2; // Starting Y position at center of window height
  let ballDistance = ballDiameter * 1.25; 
  let ballIndex = 0;
  currentPlayer = 0;
  cueBallHit = false;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      let isStriped = ballIndex >= 8; // First 8 balls are solid, rest are striped

      let ballOptions = {
        restitution: 1,
        friction: 0.05,
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
  let thickness = Math.min(windowWidth, windowHeight) * RELATIVE_BORDER_WIDTH; 

  World.add(world, [
    // Top and bottom boundaries (split into three segments each)
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true, label: 'boundary' }), // Top boundary
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true, label: 'boundary' }), // Bottom boundary
    Bodies.rectangle(0, height / 2, thickness+10, height, { isStatic: true, label: 'boundary' }), // Left boundary
    Bodies.rectangle(width, height / 2, thickness+10, height, { isStatic: true, label: 'boundary' }) // Right boundary // Right
  ]);
}
function addCueBallAndStick() {
  let cueBallRadius = Math.min(windowWidth, windowHeight) * RELATIVE_BALL_RADIUS;
  cueBall = Bodies.circle(width * RELATIVE_CUE_BALL_START_X, height * RELATIVE_CUE_BALL_START_Y, cueBallRadius, {
    label: 'cueBall',
    restitution: 0.2,
    render: {
      fillStyle: 'white', // Set the fill color to white
      
    }
  });
  balls.push(cueBall);
  World.add(world, cueBall);
}

function addMouseControl() {
  let mouse = Mouse.create(canvas.elt);
  let cueStickCategory = 0x0002;
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    collisionFilter: { mask: cueStickCategory }
  });

  World.add(world, mouseConstraint);
}


function drawPockets() {
  let borderWidth = 20; 
  let pocketRadius = Math.min(windowWidth, windowHeight) * RELATIVE_POCKET_RADIUS; 

  let pockets = [
    { x: borderWidth / 2 + 98, y: borderWidth / 2 + 70 }, // Top-left pocket
    { x: width / 2, y: borderWidth / 2 + 40 }, // Top-middle pocket
    { x: width - borderWidth / 2 - 98, y: borderWidth / 2 + 70 }, // Top-right pocket
    { x: borderWidth / 2 + 98, y: height - borderWidth / 2 - 70 }, // Bottom-left pocket
    { x: width / 2, y: height - borderWidth / 2 - 50 }, // Bottom-middle pocket
    { x: width - borderWidth / 2 - 98, y: height - borderWidth / 2 - 70 } // Bottom-right pocket
  ];

  pockets.forEach(function(p) {
    let pocket = Bodies.circle(p.x, p.y, pocketRadius, {
      isStatic: true,
      isSensor: true,
      label: 'pocket'
    });
    World.add(world, pocket);
  });
}



function handlePocketCollision(ball) {
  if (ball.label === 'ball') {
    const ballType = ball.isStriped ? 'Striped' : 'Solid';

    if (playerTypes[currentPlayer] === null && ball.number !== '8') {
      updatePlayerTypes(ball.isStriped ? 'Striped' : 'Solid');
      updatePlayerTypeDisplay();
    } else if (ball.number !== '8' && playerTypes[currentPlayer] !== ballType) {
      // Foul occurred
      handleFoul("Wrong ball pocketed");
      switchToNextPlayer();
    // Reset cue ball position
      Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });
      Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
      return;
    }


    balls = balls.filter(b => b !== ball); 
    World.remove(world, ball); 
  }

  if (ball.label === 'cueBall') {
    handleFoul("Cue ball pocketed");
    switchToNextPlayer();
    Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
    return;
  }

  if (ball.number === '8') {
    let allAssignedBallsCleared = checkAssignedBallsCleared(currentPlayer);
    if (allAssignedBallsCleared) {
      displayOverlayMessage('Player ' + (currentPlayer + 1) + ' wins!');
      gameOver = true;
      resetGame();
    } else {
      displayOverlayMessage('Player ' + (currentPlayer + 1) + ' loses. Black ball pocketed early.');
      gameOver = true;
      resetGame();
    }
    return;
  }
  pocketedBalls.push({
    number: ball.number,
    isStriped: ball.isStriped
  });

  if (!foulOccurred &&! gameOver) {
    playerScores[currentPlayer]++;
    displayOverlayMessage(`CONGRATS Player ${currentPlayer + 1}. YOU SCORED!`);
    scoreBoard.updateScore(currentPlayer, playerScores[currentPlayer]);
  }

 
}

function checkAssignedBallsCleared(playerIndex) {
  let assignedType = playerTypes[playerIndex] === 'Striped';
  let assignedBallsPocketed = pocketedBalls.filter(ball => ball.isStriped === assignedType).length;

  return assignedBallsPocketed === 7;
}

function updatePlayerTypeDisplay() {
}

function limitSpeed(ball) {
  const maxSpeed = Math.min(windowWidth, windowHeight) * RELATIVE_MAX_SPEED;
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  if (speed > MAX_SPEED) {
    const scaleFactor = MAX_SPEED / speed;
    Matter.Body.setVelocity(ball, {
      x: ball.velocity.x * scaleFactor,
      y: ball.velocity.y * scaleFactor
    });
  }
}

function displayPocketedBallsCount() {
  textSize(20);
  fill(255);
  stroke(0);
  textAlign(LEFT, TOP);
  text('POCKETED BALLS', width-600, height-70);

  let ballDisplayStartY = height-40; 
  let ballDisplayRadius = 10; 
  let ballSpacing = 25; 
  for (let i = 0; i < pocketedBalls.length; i++) {
    let ball = pocketedBalls[i];
    let ballColor = ballColors[parseInt(ball.number) - 1];
    
    fill(color(ballColor));
    strokeWeight(2); 
    ellipse((width-600)+ i * ballSpacing, ballDisplayStartY , ballDisplayRadius * 2);
  }
}

function displayCurrentPlayer() {
  textSize(20);
  fill(255);
  noStroke();
  textAlign(RIGHT, TOP);
  text('Current Player: ' + (currentPlayer + 1), width-6, 30); 
}

function resetCuestick() {
  if (cueBallHit && !cueBall.isMoving) {
    switchToNextPlayer();
    displayOverlayMessage("Player " + (currentPlayer + 1) + "'s Turn");
    
    
    cueBallHit = false;
    
  }
}


function checkFoulConsequences() {

  const foulLimit = 5; 
  if (playerFouls[currentPlayer] >= foulLimit) {

    alert(`Player ${currentPlayer + 1} has exceeded the foul limit and LOSES the game.`);

    resetGame();
    return;
  }

  if (foulOccurred) {

    displayOverlayMessage(`Foul by Player ${currentPlayer + 1}. It's now Player ${(currentPlayer + 1) % 2 + 1}'s turn.`);
  
    switchToNextPlayer();
  }
}


function drawStartScreen() {
  
  image(backgroundImage, 0, 0, width, height); // Black background
  fill('white'); // Pale green font color
  textSize(100);
  textAlign(CENTER, CENTER);
  text("MUSTAFA'S POOL GAME (goofy)", width / 2, height / 4);

  // Multiplayer Button
  fill(100, 200, 100);
  rect(width / 2 - 100, height / 2 - 25, 200, 50);
  fill('WHITE'); // Pale green font color for buttons
  textSize(20);
  text('Multiplayer', width / 2, height / 2);

  // Rules Button
  fill(100, 200, 200);
  rect(width / 2 - 100, height / 2 + 150, 200, 50);
  fill('palegreen'); // Pale green font color for buttons
  text('Rules/How to play', width / 2, height / 2 + 175);
}

function mousePressed() {
  if (cueBall.isMoving) {
    return;
  }
  if (!gameStarted) {

    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 - 25 && mouseY <= height / 2 + 25) {
      gameStarted = true;
      setupGame(); 
    }
    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 + 150 && mouseY <= height / 2 + 200) {
      showRules(); // Call a function to display the rules
    }
  }
  else{
    isCueStickDragging = true;
    
  }
}
function mouseReleased() {
  // Release the cue stick and apply force
  if (isCueStickDragging) {
      cueBallHit = false; // Reset the cueBallHit flag
      applyCueBallForce();
      isCueStickDragging = false;
      cueStickPower = 0;
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
    if (showRulesScreen) {
      // Hide the rules screen
      showRulesScreen = false;
    } else {
      // Other escape key functionality
      gameStarted = false; 
      resetGame();
    }
  }
  if (keyCode === CONTROL) {
    
    gameStarted = false; 
    drawStartScreen();
    cueBallHitCount = 0;
  }
  if (key === 'X' || key === 'x') {
    cueStickPower += cueStickPowerIncrement;
    cueStickPower = constrain(cueStickPower, 0, cueStickMaxPower);
  } else if (key === 'Z' || key === 'z') {
    cueStickPower -= cueStickPowerIncrement;
    cueStickPower = constrain(cueStickPower, 0, cueStickMaxPower);
  }



}

function resetGame() {
 
  balls.forEach(ball => World.remove(world, ball));
  balls = [];
  pocketedBalls = [];
  playerScores = [0, 0];
  playerFouls = [0, 0];
  foulOccurred = false;
  currentPlayer = 0;
  cueBallHit = false;
  gameStarted = false;
  gameOver = false;
  setupGame();
}
function showRules() {
  showRulesScreen = true;
}

function drawRulesScreen() {
  push();
  fill(0, 0, 0, 200); // Semi-transparent black background
  rect(0, 0, width, height);
  fill(255); // White text
  textAlign(CENTER, CENTER);
  textSize(32);
  text("POOL GAME RULES / HOW TO PLAY", width / 2, height * 0.15);
  textSize(24);

  text("Objective: Pocket all your assigned balls and the 8-ball to win.", width / 2, height * 0.25);
  
  text("Press 'X' to increase cue power, 'Z' to decrease.", width / 2, height * 0.3);
  text("Release mouse to shoot the cue ball.", width / 2, height * 0.35);
  text("Wait patiently for your turn.", width / 2, height * 0.4);

  text("Alternate turns; next player's turn even if you score.", width / 2, height * 0.45);
  text("Fouls: Wrong ball pocketed, or cue ball pocketed.", width / 2, height * 0.5);
  text("Clear your balls, then pocket the 8-ball in a pocket to win.", width / 2, height * 0.55);
  text("Pocketing the black ball early results in a loss.", width / 2, height * 0.6);

  text("Press 'ESC' to reset the game and return to the main menu.", width / 2, height * 0.65);
  text("Press 'CTRL' to exit to the main menu.", width / 2, height * 0.7);

  text("Press 'ESC' to close this window.", width / 2, height * 0.75);
  pop();
}

function switchToNextPlayer() {
  cueBallHitCount = 0;
  currentPlayer = (currentPlayer + 1) % 2;
  foulOccurred = false;
  scoreBoard.updateFouls(currentPlayer, playerFouls[currentPlayer]);
  checkFoulConsequences();

}

function showNextPlayerMessage() {
  showNextPlayerFlag = true; 
  setTimeout(() => { showNextPlayerFlag = false; }, 1000); 
  push();
  fill(0, 102, 255, 150);  
  rect(0, 0, width, height);
  textSize(60);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Player " + (currentPlayer + 1) + "'s Turn", width / 2, height / 2);
  pop();
  setTimeout(() => clearNextPlayerMessage(), 1000);  
}


class ScoreBoard {
  constructor() {
    this.playerScores = [0, 0];
    this.playerFouls = [0, 0];
    this.boardWidth = 600; 
    this.boardHeight = 40; 
    this.boardX = width - this.boardWidth - 170; 
    this.boardY = 10; // Position Y
  }

  updateScore(playerIndex, score) {
    this.playerScores[playerIndex] = score;
  }

  updateFouls(playerIndex, fouls) {
    this.playerFouls[playerIndex] = fouls;
  }

  display() {
    push();
    fill(255, 255, 255, 100); 
    noStroke();
    rect(this.boardX, this.boardY+15, this.boardWidth, this.boardHeight, 80);
    rect(170,this.boardY+15,this.boardWidth, this.boardHeight,80);
    fill(0);
    textSize(30);
    textAlign(LEFT, TOP);

    text(`Player 1      Fouls: ${this.playerFouls[0]}`, 190, this.boardY+20 );
    text(`Score: ${this.playerScores[0]}`, 500, this.boardY + 20);
    
    text(`Score: ${this.playerScores[1]}`, this.boardX + 390, this.boardY + 20);
    text(`  Player 2     Fouls: ${this.playerFouls[1]}`, this.boardX + 30, this.boardY + 20);
    fill(255, 0, 0); 
    
    displayPlayerTypes();
    pop();
  }
}


function applyCueBallForce() {
  let forceMagnitude = cueStickPower / cueStickMaxPower;
  let forceX = forceMagnitude * cos(cueStickAngle);
  let forceY = forceMagnitude * sin(cueStickAngle);
  Matter.Body.applyForce(cueBall, cueBall.position, {x: forceX, y: forceY});
}

function drawAimingLine() {
  if (!cueBall.isMoving && isCueStickDragging) {
    let aimingLineEndX = cueBall.position.x + aimingLineLength * cos(cueStickAngle);
    let aimingLineEndY = cueBall.position.y + aimingLineLength * sin(cueStickAngle);

    stroke(255, 0, 0); 
    strokeWeight(2);
    line(cueBall.position.x, cueBall.position.y, aimingLineEndX, aimingLineEndY);
  }
}


function drawPowerBar() {
  let powerBarWidth = 40;
  let powerBarHeight = 500;
  let powerLevel = map(cueStickPower, 0, cueStickMaxPower, 0, powerBarHeight);
  
  push();
  fill(255);
  rect(width - powerBarWidth / 2-27, 300,  powerBarWidth, powerBarHeight);
  fill(100, 200, 100);
  rect(width - powerBarWidth / 2-27, 300, powerBarWidth,powerLevel);
  pop();
}

function handleFoul(reason) {
  playerFouls[currentPlayer]++;
  displayOverlayMessage("Foul by Player " + (currentPlayer + 1) + ": " + reason);
  switchToNextPlayer();
}

function displayPlayerTypes() {
  fill(255); 
  textSize(20);
  textAlign(CENTER, CENTER);
  
  if (playerTypes[0] !== null) {
    text( (playerTypes[0] === 'Striped' ? 'Stripes' : 'Solids'), 300, 15);
  } else {
    text(" Not yet determined", 300, 15);
  }
  
  if (playerTypes[1] !== null) {
    text((playerTypes[1] === 'Striped' ? 'Stripes' : 'Solids'), width - 300, 15);
  } else {
    text("Not yet determined", width - 300, 15);
  }
}

function updatePlayerTypes(ballType) {
  if (currentPlayer === 0) {
    playerTypes[0] = ballType;
    playerTypes[1] = ballType === 'Striped' ? 'Solid' : 'Striped';
  } else {
    playerTypes[1] = ballType; 
    playerTypes[0] = ballType === 'Striped' ? 'Solid' : 'Striped';
  }
}

function displayOverlayMessage(msg) {
  overlayMessage = msg;
  showOverlay = true;
  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => {
    showOverlay = false;
  }, 2000);
}

function drawOverlay() {
  if (showOverlay) {
    push();
    fill(0, 102, 255, 150);  
    rect(0, 0, width, height);
    fill(255);
    textSize(60);
    textAlign(CENTER, CENTER);
    text(overlayMessage, width / 2, height / 2);
    pop();
  }
}