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
    
  } else {
    background(0, 102, 0);
    checkGameOver();
    image(poolTableImage, 0, 0, width, height);
    updateCueStick();
    drawCueStick();
    drawPowerBar();
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
    resetCuestick()
    if (cueBallHitCount > 1) {
      handleFoulForCueBall();
    }
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


function updateCueStick() {
  // Update angle based on mouse position
  cueStickAngle = atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
}

function drawCueStick() {
  if (!cueBall.isMoving) {
    push();
    translate(cueBall.position.x, cueBall.position.y);
    rotate(cueStickAngle);

    // Adjust the position based on the cue stick power
    let cueStickOffset = map(cueStickPower, 0, cueStickMaxPower, 0, 50);
    translate(-cueStickOffset, 0);

    fill(0, 0, 0);
    rectMode(RADIUS);
    rect(0, 0, 300, 10);
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
  let startX = width / 1.5;
  let startY = height / 2;
  let ballDiameter = 40;
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
  let thickness = 190; // Thickness of the boundary walls
  //let pocketRadius = 15; // Radius of the pockets

  // Adjust the boundary dimensions and positions to accommodate pockets
  World.add(world, [
    // Top and bottom boundaries (split into three segments each)
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true, label: 'boundary' }), // Top boundary
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true, label: 'boundary' }), // Bottom boundary
    Bodies.rectangle(0, height / 2, thickness+10, height, { isStatic: true, label: 'boundary' }), // Left boundary
    Bodies.rectangle(width, height / 2, thickness+10, height, { isStatic: true, label: 'boundary' }) // Right boundary // Right
  ]);
}
function addCueBallAndStick() {
  cueBall = Bodies.circle(2*width / 7.13, height / 2, 20, {
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
  let pocketRadius = 50; 

  let pockets = [
    { x: borderWidth / 2 + 98, y: borderWidth / 2 + 70 }, 
    { x: width / 2, y: borderWidth / 2 + 50 }, 
    { x: width - borderWidth / 2 - 98, y: borderWidth / 2 + 70 }, 
    { x: borderWidth / 2 + 98, y: height - borderWidth / 2 - 70 }, 
    { x: width / 2, y: height - borderWidth / 2 - 50 }, 
    { x: width - borderWidth / 2 - 98, y: height - borderWidth / 2 - 70 } 
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
      playerTypes[currentPlayer] = ballType;
      playerTypes[(currentPlayer + 1) % 2] = ballType === 'Striped' ? 'Solid' : 'Striped';
      updatePlayerTypeDisplay();
    } else if (ball.number !== '8' && playerTypes[currentPlayer] !== ballType) {
      handleFoul("Wrong ball pocketed");
      return;
    }


    


    pocketedBalls.push({
      number: ball.number,
      isStriped: ball.isStriped
    });

    balls = balls.filter(b => b !== ball); 
    World.remove(world, ball); 
  }

  if (ball.label === 'cueBall') {
    handleFoul("Cue ball pocketed");
    switchToNextPlayer();
    Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
  }

  if (ball.number === '8') {
    if (playerScores[currentPlayer] < 7) {
      alert('Player ' + (currentPlayer + 1) + ' loses. Black ball pocketed early.');
      resetGame();
    } else {
      alert('Player ' + (currentPlayer + 1) + ' wins!');
      resetGame();
    }
  }

  if (!foulOccurred) {
    playerScores[currentPlayer]++;
    alert(`CONGRATS Player ${currentPlayer + 1}. YOU SCORED!`);
    scoreBoard.updateScore(currentPlayer, playerScores[currentPlayer]);
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

function displayPocketedBallsCount() {
  textSize(20);
  fill(255);
  stroke(0);
  textAlign(LEFT, TOP);
  text('Pocketed Balls', width-170, 300);

  let ballDisplayStartY = 350; 
  let ballDisplayRadius = 10; 
  let ballSpacing = 25; 

  for (let i = 0; i < pocketedBalls.length; i++) {
    let ball = pocketedBalls[i];
    let ballColor = ballColors[parseInt(ball.number) - 1];
    
    fill(color(ballColor + '80'));
    ellipse(width-140, ballDisplayStartY + i * ballSpacing, ballDisplayRadius * 2);
  }
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
  const foulLimit = 3; 
  if (playerFouls[currentPlayer] >= foulLimit) {
  
    alert(`Player ${currentPlayer + 1} has exceeded the foul limit and LOSES the game.`);

    resetGame();
    return;
  }

  if (foulOccurred) {

    alert(`Foul by Player ${currentPlayer + 1}. It's now Player ${(currentPlayer + 1) % 2 + 1}'s turn.`);
    
    switchToNextPlayer();
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
  else{
    isCueStickDragging = true;
    
  }
}
function mouseReleased() {
  // Release the cue stick and apply force
  if (isCueStickDragging) {
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
    
    gameStarted = false; // Set gameStarted to false to show main menu
    resetGame();// Call a function to reset the game state
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
  alert(
    "Mustafa's Pool Game Rules:\n\n" +
    "1. Objective: Pocket all your assigned balls (striped or solid) and the black ball to win.\n" +
    "2. Turns: Alternate turns; keep playing if you pocket a ball.\n" +
    "3. Fouls:\n" +
    "   - Hitting wrong balls.\n" +
    "   - Cue ball hit twice in one turn.\n" +
    "   - Cue stick hits non-cue balls.\n" +
    "   - 5 fouls lead to automatic loss.\n" +
    "4. Winning: Clear your balls, then pocket black ball in a called pocket.\n" +
    "5. Losing: Pocket black ball early or accumulate 5 fouls.\n\n" +
    "Press 'Escape' to return to the main menu. Enjoy the game!"
  );
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
  cueBallHitCount = 0;
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
  setTimeout(() => clearNextPlayerMessage(), 1000);  
}
function showNextPlayerMessage() {
  showNextPlayerFlag = true;  
  setTimeout(() => { showNextPlayerFlag = false; }, 1000);  
 
}

class ScoreBoard {
  constructor() {
    this.playerScores = [0, 0];
    this.playerFouls = [0, 0];
    this.boardWidth = 150; 
    this.boardHeight = 150; 
    this.boardX = width - this.boardWidth - 10; 
    this.boardY = 130;
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
    rect(this.boardX, this.boardY, this.boardWidth, this.boardHeight, 10);
    fill(0);
    textSize(16);
    textAlign(LEFT, TOP);

    text(`Player 1 Fouls: ${this.playerFouls[0]}`, this.boardX + 10, this.boardY + 40);
    text(`Player 1 Score: ${this.playerScores[0]}`, this.boardX + 10, this.boardY + 10);
    
    text(`Player 2 Score: ${this.playerScores[1]}`, this.boardX + 10, this.boardY + 70);
    text(`Player 2 Fouls: ${this.playerFouls[1]}`, this.boardX + 10, this.boardY + 100);
    fill(255, 0, 0); 
    
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

function handleFoulForCueBall() {

  playerFouls[currentPlayer]++;
  alert("Foul: Player " + (currentPlayer + 1) + " hit the cue ball twice!");
  Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
  Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });

  foulOccurred=true;
  
  
  checkFoulConsequences();
  
}


function drawPowerBar() {
  let powerBarWidth = 200;
  let powerBarHeight = 20;
  let powerLevel = map(cueStickPower, 0, cueStickMaxPower, 0, powerBarWidth);
  
  push();
  fill(255);
  rect(width / 2 - powerBarWidth / 2, height - 60, powerBarWidth, powerBarHeight);
  fill(100, 200, 100);
  rect(width / 2 - powerBarWidth / 2, height - 60, powerLevel, powerBarHeight);
  pop();
}

function handleFoul(reason) {
  alert(`Foul by Player ${currentPlayer + 1}: ${reason}`);
  foulOccurred = true;
  playerFouls[currentPlayer]++;
  switchToNextPlayer();
}