function setup() {
  createCanvas(500, 500, WEBGL);
}

function draw() {
  let c = color(mouseX/4, mouseY/4, (mouseX + mouseY)/4);
  background('#663366');
  fill('yellow');
  //rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.02);
  //rotateZ(frameCount * 0.01);
  sphere(50, 10, 8);

//tardis
  translate(125, 0, 125);
  push();
  c = color('#003b6f');
  smooth();
  fill(c);
  rotateZ(frameCount * 0.01);
  //rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  rotate(frameCount * 0.10);
  box(20, 20, 40);
  pop();
}