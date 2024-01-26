// 8 Ball Pool Game: Capstone Coding Project
// Mustafa Emara
// Jan 25 2024

// Game Variables
let cueStickAngle = 0; 
let cueStickPower = 0; 
let isCueStickDragging = false; 
let cueStickMaxPower = 15; 
let cueStickPowerIncrement = 2; 
let wasCueStickDragging = false; 

// Matter.js setup

let Engine = Matter.Engine, // physics engine
    World = Matter.World, // The world
    Bodies = Matter.Bodies, // Used to create physical bodies
    Mouse = Matter.Mouse, // For mouse interaction
    MouseConstraint = Matter.MouseConstraint; // Constraint to move bodies using the mouse
let engine, world, cueBall; 
let balls = []; 
let mouseConstraint; 

// Game Configuration Variables
let ballColors = ['#FFD700', '#0D00F9', '#FF0000', '#81007F', '#FFA500', '#008000', '#870C25', '#000000', '#FFD700', '#0D00F9', '#FF0000', '#81007F', '#FFA500', '#008000', '#870C25']; // Colors for the balls
let ballNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']; // Numbers for the balls
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
let overlayTimeout; // Timeout for the overlay message
let showRulesScreen = false; // Flag to display the rules screen

// Relative dimensions for game elements based on the screen size
const RELATIVE_BALL_DIAMETER = 0.04; 
const RELATIVE_BALL_RADIUS = RELATIVE_BALL_DIAMETER / 2; 
const RELATIVE_CUE_LENGTH = 0.3; 
const RELATIVE_CUE_WIDTH = 0.005; 
const RELATIVE_POCKET_RADIUS = 0.04; 
const RELATIVE_BORDER_WIDTH = 0.15; 
const RELATIVE_CUE_BALL_START_X = 2 / 7.13; 
const RELATIVE_CUE_BALL_START_Y = 0.5;
const RELATIVE_MAX_SPEED = 0.01; 

// preload function to load images before the game starts
function preload() {
  poolTableImage = loadImage('assets/pool_table.jpg.png');
  backgroundImage = loadImage('assets/Background.png'); 
}

// setup function to initialize the game
function setup() {
  playerFouls = [0, 0]; // Reset player fouls
  createCanvas(windowWidth, windowHeight); 
  // Load and play background music
  backgroundMusic = loadSound('assets/Alone with Numbers.mp3', () => {
    backgroundMusic.setVolume(0.091);
    backgroundMusic.loop(); 
  });
  
  textStyle(BOLD); 
  engine = Engine.create(); // Create a Matter.js physics engine
  world = engine.world; 
  engine.world.gravity.y = 0; // Set the gravity in the y-direction to 0 

  // Call functions to set up te game
  setupBalls(); 
  drawPockets(); 
  createBoundaries(); 
  addCueBall(); 
  addMouseControl(); 
  
  // Listen for collision events in the physics engine
  Matter.Events.on(engine, 'collisionStart', function(event) {
    let pairs = event.pairs; 
  
    // Get all pairs of bodies that started colliding
    pairs.forEach(function(pair) {
      // Handling pocket collisions
      if (pair.bodyA.label === 'pocket') {
        // If one of the colliding bodies is a pocket, handle the collision for the other body
        handlePocketCollision(pair.bodyB);
      } else if (pair.bodyB.label === 'pocket') {
        // If the other body is a pocket, handle the collision for the first body
        handlePocketCollision(pair.bodyA);
      }
    });
  });
  currentPlayer = 0; // Start with player 1
  cueBallHit = false; // Reset cue ball hit flag
  scoreBoard = new ScoreBoard(); // Initialize the scoreboard
}

function draw() {
  // Check if the game has started
  if (!gameStarted) {
    // If the game has not started,draw the start screen
    drawStartScreen();

    // If the rules screen flag is set to true, draw the rules screen
    if (showRulesScreen) {
      drawRulesScreen();
    }
  } else {
    // If the game has started, draw the following functions

    image(poolTableImage, 0, 0, width, height);

    updateCueStick();

    drawCuestick();


    drawPowerBar();

    displayPlayerTypes();

    if (aimingLineVisible) {
      drawAimingLine();
    }

    // Update the physics engine
    Engine.update(engine);

    // Go through each ball in the balls array and limit speed and draw them
    for (let ball of balls) {
      // Limit the speed of the ball
      limitSpeed(ball);
      // Draw the balls
      drawBall(ball);
    }

    displayPocketedBallsCount();
    displayCurrentPlayer();

    if (wasCueStickDragging && !isCueStickDragging) {
      // Check if the cue ball has significant velocity, which means that it has been hit
      if (Math.abs(cueBall.velocity.x) > 0.1 || Math.abs(cueBall.velocity.y) > 0.1) {
          cueBallHit = true;
          cueBallHitCount++; 
      }
    }

    // Update the wasCueStickDragging flag
    wasCueStickDragging = isCueStickDragging;

    checkNextPlayer();

    // Display the scoreboard
    scoreBoard.display();

    // Draw any active overlay messages 
    drawOverlay();
  }
}

// UpdateCueStick function to update the angle of the cue stick based on mouse position
function updateCueStick() {
  // Calculates the angle between the cue ball and the mouse cursor using arctan
  cueStickAngle = atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
}

// Function to draw the cue stick on the canvas
function drawCuestick() {

  let cueLength = Math.min(windowWidth, windowHeight) * RELATIVE_CUE_LENGTH;
  let cueWidth = Math.min(windowWidth, windowHeight) * RELATIVE_CUE_WIDTH;

  // Draw the cue stick only if the cue ball is not moving
  if (!cueBall.isMoving) {
    push(); 

    translate(cueBall.position.x, cueBall.position.y);
 
    rotate(cueStickAngle);

    // Apply an offset to the cue stick's position based on the current power
    let cueStickOffset = map(cueStickPower, 0, cueStickMaxPower, 0, 50);
    translate(-cueStickOffset, 0);

    // Drawe Cuestick
    fill(0, 0, 0); 
    rectMode(RADIUS); 
    rect(0, 0, cueLength, cueWidth); 
    pop(); 
  }
}

// Function to draw a pool ball on the canvas
function drawBall(ball) {
  // Radius of the ball
  let ballRadius = ball.circleRadius;
  fill(ball.render.fillStyle);
  stroke(ball.render.strokeStyle);
  strokeWeight(ball.render.lineWidth);
  // Draw the ball as an ellipse at the bodies position
  ellipse(ball.position.x, ball.position.y, ballRadius * 2);
  
  // If the ball is striped, draw a stripe on it
  if (ball.isStriped) {
    fill('white'); // White stripe
    rect(ball.position.x - ballRadius, ball.position.y - ballRadius / 4, ballRadius * 2, ballRadius / 2);
  }
  
  // Draw the ball's number at its center
  fill(0); 
  textSize(10); 
  textAlign(CENTER, CENTER); 
  text(ball.number, ball.position.x, ball.position.y);

  // Define ball's moving status based on its velocity
  ball.isMoving = Math.abs(ball.velocity.x) > 0.1 || Math.abs(ball.velocity.y) > 0.1;
}

// Function to set up the initial positions of the balls on the pool table
function setupBalls() {
  let ballDiameter = Math.min(windowWidth, windowHeight) * RELATIVE_BALL_DIAMETER;
  // Variables for triangle formation of balls
  let startX = width * 0.66; 
  let startY = height / 2; 
  let ballDistance = ballDiameter * 1.25; 
  let ballIndex = 0; 

  // Reset current player and cue ball hit
  currentPlayer = 0;
  cueBallHit = false;

  // Loop that will place balls in a triangle formation
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballDistance;
      let y = startY - row * ballDistance / 2 + col * ballDistance;
      let isStriped = ballIndex >= 8; // First 8 balls are solid, rest are striped

      // Define options for balls physics and style
      let ballOptions = {
        restitution: 1, // Bounciness
        friction: 0.05, // Friction 
        label: 'ball', // Label for the ball
        render: {// Rendering style
          sprite: {
            xScale: 1,
            yScale: 1,
          },
          fillStyle: ballColors[ballIndex], 
          strokeStyle: ballColors[ballIndex], 
          lineWidth: 1 
        }
      };

      // Create a ball body and add it to the world and balls array
      let ball = Bodies.circle(x, y, ballDiameter / 2, ballOptions);
      ball.number = ballNumbers[ballIndex]; // Assign a number to the ball
      ball.isStriped = isStriped; 
      balls.push(ball); 
      World.add(world, ball); 
      ballIndex++; 
    }
  }
}

// Create boundaries of the pool table
function createBoundaries() {

  let thickness = Math.min(windowWidth, windowHeight) * RELATIVE_BORDER_WIDTH;

  // Static rectangular bodies for the boundaries
  World.add(world, [
    // Top boundary
    Bodies.rectangle(width / 2, 0, width, thickness, { isStatic: true, label: 'boundary' }),
    // Bottom boundary
    Bodies.rectangle(width / 2, height, width, thickness, { isStatic: true, label: 'boundary' }),
    // Left boundary
    Bodies.rectangle(0, height / 2, thickness + 10, height, { isStatic: true, label: 'boundary' }),
    // Right boundary
    Bodies.rectangle(width, height / 2, thickness + 10, height, { isStatic: true, label: 'boundary' })
  ]);
}

// Function to add cue ball to the game
function addCueBall() {
  let cueBallRadius = Math.min(windowWidth, windowHeight) * RELATIVE_BALL_RADIUS;

  // Create the cue ball with physics properties and rendering style
  cueBall = Bodies.circle(width * RELATIVE_CUE_BALL_START_X, height * RELATIVE_CUE_BALL_START_Y, cueBallRadius, {
    label: 'cueBall', // Label
    restitution: 0.2, // Bounciness
    render: {
      fillStyle: 'white' // Fill color is white
    }
  });
  // Add the cue ball to the balls array and the physics world
  balls.push(cueBall);
  World.add(world, cueBall);
}

// Adds mouse control for interacting with the cue stick
function addMouseControl() {
  let mouse = Mouse.create(canvas.elt);
  // Add a category for the cue stick
  let cueStickCategory = 0x0002;
  // Create a mouse constraint
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    collisionFilter: { mask: cueStickCategory }// Mask so that mouse only collides with cuestick
  });

  // Add mouse constraint to the world
  World.add(world, mouseConstraint);
}

// Draw pockets on the pool table
function drawPockets() {

  let pocketRadius = Math.min(windowWidth, windowHeight) * RELATIVE_POCKET_RADIUS; 

  // Array of pocket positions on the pool table
  let pockets = [
    { x: borderWidth / 2 + 115, y: borderWidth / 2 + 100 }, // Top left pocket
    { x: width / 2, y: borderWidth / 2 + 50 }, // Top middle pocket
    { x: width - borderWidth / 2 - 115, y: borderWidth / 2 + 100 }, // Top right pocket
    { x: borderWidth / 2 + 115, y: height - borderWidth / 2 - 95 }, // Bottom left pocket
    { x: width / 2, y: height - borderWidth / 2 - 50 }, // Bottom middle pocket
    { x: width - borderWidth / 2 - 115, y: height - borderWidth / 2 - 95 } // Bottom right pocket
  ];

  // Loop through each pocket position and create a circular pocket body
  pockets.forEach(function(p) {
    let pocket = Bodies.circle(p.x, p.y, pocketRadius, {
      isStatic: true, 
      isSensor: true, // Make the pocket a sensor to detect collisions 
      label: 'pocket' 
    });
    // Add the pocket to the world
    World.add(world, pocket);
  });
}

// Function to handle collisions with pockets
function handlePocketCollision(ball) {
  // Handle the scenario when a normal ball enters a pocket
  if (ball.label === 'ball') {
    // Remove the pocketed ball from the balls array and from the physics world
    balls = balls.filter(b => b !== ball); 
    World.remove(world, ball); 
    // Determine the type of the pocketed ball 
    const ballType = ball.isStriped ? 'Striped' : 'Solid';

    // If the player type hasn't been set yet and it's the black ball then set the player type
    if (playerTypes[currentPlayer] === null && ball.number !== '8') {
      // Set the player's ball type based on the first pocketed ball
      updatePlayerTypes(ball.isStriped ? 'Striped' : 'Solid');
  
    } 
    // Check for a foul for wrong type of ball pocketed
    else if (ball.number !== '8' && playerTypes[currentPlayer] !== ballType) {
      handleFoul("Wrong ball pocketed"); 
      switchToNextPlayer(); 
      // Reset cue ball's position and velocity
      Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });
      Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
      return;
    }
  }

  // When the cue ball is pocketed
  if (ball.label === 'cueBall') {
    handleFoul("Cue ball pocketed");
    // Reset cue ball's position and velocity
    Matter.Body.setPosition(cueBall, { x: 2*width / 7.13, y: height/2 });
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
    return;
  }

  //When the 8-ball is pocketed
  if (ball.number === '8') {
    // Check if all assigned balls have been cleared before pocketing the 8-ball
    let allAssignedBallsCleared = checkAssignedBallsCleared(currentPlayer);
    if (allAssignedBallsCleared) {
      // Win condition
      displayOverlayMessage('Player ' + (currentPlayer + 1) + ' wins!');
      gameOver = true; 
      resetGame(); 
    } else {
      // Lose condition
      displayOverlayMessage('Player ' + (currentPlayer + 1) + ' loses. Black ball pocketed early.');
      gameOver = true; 
      resetGame(); 
    }
    return;
  }
  // Add the pocketed ball to the array of pocketed balls
  pocketedBalls.push({
    number: ball.number,
    isStriped: ball.isStriped
  });

  // Update score and display messages if no foul and the game is not over
  if (!foulOccurred &&! gameOver) {
    playerScores[currentPlayer]++; 
    displayOverlayMessage(`CONGRATS Player ${currentPlayer + 1}. YOU SCORED!`);
    scoreBoard.updateScore(currentPlayer, playerScores[currentPlayer]); 
  }
}

// Function to check if a player has cleared all their assigned balls
function checkAssignedBallsCleared(playerIndex) {
  let assignedType = playerTypes[playerIndex] === 'Striped'; 
  let assignedBallsPocketed = pocketedBalls.filter(ball => ball.isStriped === assignedType).length;

  // Return true if all 7 assigned balls have been pocketed
  return assignedBallsPocketed === 7;
}


// Function to limit the speed of a moving ball
function limitSpeed(ball) {
  const maxSpeed = Math.min(windowWidth, windowHeight) * RELATIVE_MAX_SPEED;
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);

  if (speed > MAX_SPEED) {
    // Scale down the velocity to the maximum speed
    const scaleFactor = MAX_SPEED / speed;
    Matter.Body.setVelocity(ball, {
      x: ball.velocity.x * scaleFactor,
      y: ball.velocity.y * scaleFactor
    });
  }
}
// Function to display the count of balls that have been pocketed
function displayPocketedBallsCount() {
  textSize(20);
  fill(255); 
  stroke(0); 
  textAlign(LEFT, TOP); 
  text('POCKETED BALLS', width-600, height-70);

  // Coordinates for pocketed balls
  let ballDisplayStartY = height-40; 
  let ballDisplayRadius = 10; 
  let ballSpacing = 25; 
  
  //Display each pocketed ball with its matching colour
  for (let i = 0; i < pocketedBalls.length; i++) {
    let ball = pocketedBalls[i];
    let ballColor = ballColors[int(ball.number) - 1]; 
    
    fill(color(ballColor));
    strokeWeight(2);
    // Draw each ball
    ellipse((width-600) + i * ballSpacing, ballDisplayStartY, ballDisplayRadius * 2);
  }
}

// Display the current player's turn
function displayCurrentPlayer() {
  textSize(20); 
  fill(255); 
  noStroke(); 
  textAlign(RIGHT, TOP); 
  text('Current Player: ' + (currentPlayer + 1), width-6, 30); 
}

// Switches turns
function checkNextPlayer() {
  // Check if the cue ball was hit and has stopped moving
  if (cueBallHit && !cueBall.isMoving) {
    switchToNextPlayer(); // Switch to the next player's turn
    // Display a message indicating the next player's turn
    displayOverlayMessage("Player " + (currentPlayer + 1) + "'s Turn");
    
    cueBallHit = false; // Reset the cueBallHit flag
  }
}

// Sees if you have exceeded the foul limit
function checkFoulConsequences() {
  const foulLimit = 5; // Foul limit
  if (playerFouls[currentPlayer] >= foulLimit) {
    // Alert function to show the player has lost the game due to exceeding foul limit, reset the game
    alert(`Player ${currentPlayer + 1} has exceeded the foul limit and LOSES the game.`);
    resetGame(); 
    return;
  }
}

// Draws the Start screen
function drawStartScreen() {

  image(backgroundImage, 0, 0, width, height); // Display the background image
  fill('white'); 
  textSize(100); 
  textAlign(CENTER, CENTER); 
  // Goofy
  text("MUSTAFA'S \n POOL GAME \n (goofy)", width / 2, height / 4);

  // Draw s the button for multiplayer
  fill(100, 200, 100); 
  rect(width / 2 - 100, height / 2 - 25, 200, 50); 
  fill('WHITE');
  textSize(20); 
  text('Multiplayer', width / 2, height / 2); 

  // Draws the button for game rules
  fill(100, 200, 200); 
  rect(width / 2 - 100, height / 2 + 150, 200, 50); 
  fill('palegreen');
  text('Rules/How to play', width / 2, height / 2 + 175); 
}

// Mouse pressed events
function mousePressed() {
  // If the cue ball is moving, don't allow any action
  if (cueBall.isMoving) {
    return;
  }
  // Check is the start screen buttons have been pressed
  if (!gameStarted) {
 
    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 - 25 && mouseY <= height / 2 + 25) {
      gameStarted = true; 
      setupGame(); 
    }
    if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= height / 2 + 150 && mouseY <= height / 2 + 200) {
      showRules(); 
    }
  }
  else {
    isCueStickDragging = true; // Other wise the cuestick is being dragged
  }

}


// Mouse release events
function mouseReleased() {
  // Apply force to the cueball and reset power to 0
  if (isCueStickDragging) {
    cueBallHit = false; 
    applyCueBallForce();
    isCueStickDragging = false; 
    cueStickPower = 0; 
  }
}

// Sets up the game
function setupGame() {
  // Remove all balls from the world and reset the arrays and game variables and call the functions from new
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
  addCueBall(); 
  currentPlayer = 0; 
  cueBallHit = false; 
}

// Handle key press events
function keyPressed() {
  if (keyCode === ESCAPE) {
    // If the Escape key is pressed
    if (showRulesScreen) {
      // Hide rules screen
      showRulesScreen = false;
    } else {
      // Otherwise the game resets
      gameStarted = false; 
      resetGame();
    }
  }
  if (keyCode === CONTROL) {
    // If the Control key is pressed
    // stop the game and show the start screen
    gameStarted = false; 
    drawStartScreen();
    cueBallHitCount = 0; 
  }
  // Handle increasing and decreasing cue stick power with x and z' keys
  if (key === 'X' || key === 'x') {

    cueStickPower += cueStickPowerIncrement;
    cueStickPower = constrain(cueStickPower, 0, cueStickMaxPower);

  } else if (key === 'Z' || key === 'z') {
    
    cueStickPower -= cueStickPowerIncrement;
    cueStickPower = constrain(cueStickPower, 0, cueStickMaxPower);
  }
}

// Reset the game to its initial state
function resetGame() {
  // Remove all balls from the world and reset game variables
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
  setupGame(); // Set up the game again
}

// Display the rules screen
function showRules() {
  showRulesScreen = true; // Set the flag to show the rules screen
}

// Function to draw the rules screen
function drawRulesScreen() {
  push(); 
  // Semi transparent black background
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  fill(255); 

  textAlign(CENTER, CENTER);
  textSize(32);
  text("POOL GAME RULES / HOW TO PLAY", width / 2, height * 0.15);
  textSize(24);
  
  // List of game rules and controls
  text("Pocket all your assigned balls and the 8-ball to win", width / 2, height * 0.25);
  text("Press 'X' to increase cue power, 'Z' to decrease.", width / 2, height * 0.3);
  text("Release mouse to shoot the cue ball.", width / 2, height * 0.35);
  text("Alternate turns; next player's turn even if you score.", width / 2, height * 0.4);
  text("Fouls: Wrong ball pocketed, or cue ball pocketed.", width / 2, height * 0.45);
  text("Clear your balls, then pocket the 8-ball in a pocket to win.", width / 2, height * 0.5);
  text("Pocketing the black ball early results in a loss.", width / 2, height * 0.55);
  text("Press 'ESC' to reset the game and return to the main menu.", width / 2, height * 0.6);
  text("Press 'CTRL' to exit to the main menu.", width / 2, height * 0.65);
  text("Press 'ESC' to close this window.", width / 2, height * 0.75);

  pop();
}

// Switch to the next player
function switchToNextPlayer() {
  cueBallHitCount = 0; // Reset cue ball hit count
  currentPlayer = (currentPlayer + 1) % 2; //Switch
  foulOccurred = false; 

  
  // Update the fouls on the scoreboard and check for foul consequences
  scoreBoard.updateFouls(currentPlayer, playerFouls[currentPlayer]);
  checkFoulConsequences();
}


// ScoreBoard class to manage and display scores and fouls for each player
class ScoreBoard {
  constructor() {
    //Initializes scores, fouls, and coordinates
    this.playerScores = [0, 0]; 
    this.playerFouls = [0, 0]; 
    this.boardWidth = 500; 
    this.boardHeight = 40; 
    this.boardX = width - this.boardWidth - 170; 
    this.boardY = 10; 
  }

  // Method to update the score of a player
  updateScore(playerIndex, score) {
    this.playerScores[playerIndex] = score; // Set the score for the player
  }

  // Method to update the fouls count for a player
  updateFouls(playerIndex, fouls) {
    this.playerFouls[playerIndex] = fouls; 
  }

  // Method to display the scoreboard on the canvas
  display() {
    push(); 
    fill(255, 255, 255, 100); 
    noStroke(); 

    rect(this.boardX, this.boardY + 15, this.boardWidth, this.boardHeight, 80);// Curvy rectangles for background
    rect(170, this.boardY + 15, this.boardWidth, this.boardHeight, 80);
    fill(0); 
    textSize(30); 
    textAlign(LEFT, TOP); 

    // Display the scores and fouls for both players
    text(`Player 1     Fouls: ${this.playerFouls[0]}`, 190, this.boardY + 20);
    text(`Score: ${this.playerScores[0]}`, 500, this.boardY + 20);
    text(`Score: ${this.playerScores[1]}`, this.boardX + 330, this.boardY + 20);
    text(`  Player 2   Fouls: ${this.playerFouls[1]}`, this.boardX + 30, this.boardY + 20);

    fill(255, 0, 0); 
    displayPlayerTypes(); //Display player types (stripes/solids)
    pop(); 
  }
}

// Function to apply force to the cue ball based on the cue stick's power and angle
function applyCueBallForce() {
  // Calculate the force magnitude based on the cue stick's power
  let forceMagnitude = cueStickPower / cueStickMaxPower;
  // Calculate the force components in X and Y directions
  let forceX = forceMagnitude * cos(cueStickAngle);
  let forceY = forceMagnitude * sin(cueStickAngle);
  // Apply the calculated force to the cue ball
  Matter.Body.applyForce(cueBall, cueBall.position, {x: forceX, y: forceY});
}

// Draw an aiming line from the cue ball while aiming
function drawAimingLine() {
  // If the cue ball is not moving and the cue stick is being dragged
  if (!cueBall.isMoving && isCueStickDragging) {
    //  Coordinates
    let aimingLineEndX = cueBall.position.x + aimingLineLength * cos(cueStickAngle);
    let aimingLineEndY = cueBall.position.y + aimingLineLength * sin(cueStickAngle);

    stroke(255, 0, 0); // Red line for aim line
    strokeWeight(2);
    line(cueBall.position.x, cueBall.position.y, aimingLineEndX, aimingLineEndY);
  }
}

// Draws power bar
function drawPowerBar() {
  let powerBarWidth = 40;
  let powerBarHeight = 500;

  // Level of power in the power bar
  let powerLevel = map(cueStickPower, 0, cueStickMaxPower, 0, powerBarHeight);
  
  push(); 
  
  fill(255); // White background for the bar
  rect(width - powerBarWidth / 2 - 27, 300, powerBarWidth, powerBarHeight);

  // Draws the actual power level
  fill(100, 200, 100); 
  rect(width - powerBarWidth / 2 - 27, 300, powerBarWidth, powerLevel);
  pop(); 
}

function handleFoul(reason) {// Takes in text as parameter to be displayed 
  playerFouls[currentPlayer]++; // Increase foul count
  // Display message
  displayOverlayMessage("Foul by Player " + (currentPlayer + 1) + ": " + reason);
  switchToNextPlayer(); // Switch turns
}

// Display the users ball types
function displayPlayerTypes() {
  fill(255);
  textSize(20); 
  textAlign(CENTER, CENTER); 

  // Display ball type for player 1
  if (playerTypes[0] !== null) {

    text((playerTypes[0] === 'Striped' ? 'Stripes' : 'Solids'), 300, 15);
  } else {
    // If not yet determined
    text(" Not yet determined", 300, 15);
  }

  // Display ball type for player 2
  if (playerTypes[1] !== null) {

    text((playerTypes[1] === 'Striped' ? 'Stripes' : 'Solids'), width - 300, 15);
  } else {
    // If not yet determined
    text("Not yet determined", width - 300, 15);
  }
}

// Takes in ball type and sets the player's type based on that
function updatePlayerTypes(ballType) {
  // Assign ball types to the players based on the first ball pocketed
  if (currentPlayer === 0) {
    playerTypes[0] = ballType;
    playerTypes[1] = ballType === 'Striped' ? 'Solid' : 'Striped'; // Opposite type for player 2
  } else {
    playerTypes[1] = ballType; // Vice versa
    playerTypes[0] = ballType === 'Striped' ? 'Solid' : 'Striped'; 
  }
}

// Takes in text and displays it
function displayOverlayMessage(msg) {
  overlayMessage = msg; 
  showOverlay = true; 
  clearTimeout(overlayTimeout); // Clear any existing timeout to reset the overlay
  // Timeout to hide overlay ater 2 seconds
  overlayTimeout = setTimeout(() => {
    showOverlay = false;
  }, 2000);
}

// Draw the actual overlay when showOverlay is true
function drawOverlay() {
  if (showOverlay) {
    // Draw it
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