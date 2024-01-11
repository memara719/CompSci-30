function setup() {
  createCanvas(800, 400); // sset the size of the canvas
  background(0, 102, 0); // set the background color to green
}

function draw() {
  drawPoolTable();
}

function drawPoolTable() {
  //draw table 
  stroke(139, 69, 19); 
  strokeWeight(20); 
  noFill();
  rect(10, 10, width - 20, height - 20); 


}