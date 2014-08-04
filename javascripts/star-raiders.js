// constant options
const focalDepth = 80;
const focalPoint = 256;
const eNone = 0;
const eGalacticScanner = 1;
const eLongRange = 2;

// variables
var centreX;
var centreY;
var mouseX=0;
var mouseY=0;
var frameCount=0;
var gameStart;

var context;
var canvas;
var fontsize = 20;
var overlayMode = eNone;

// test multiple groups
var boardPieces  = [];
var mapScale     = {x:0, y:0};
var border       = {x:0, y:0};
var galaxyMapSize = {x:16, y:8};
var shipLocation = {x:0, y:0};
var shipPosition = {x:0, y:0};
var localPosition = {x:0, y:0, z:0};
var shipPing     = {x:0, y:0};
var pingRadius   = 100;
var lastCycle    = 0;
var cycleScalar   = 1; // 3 = 30 seconds. 
var targetBase   = 0;
var localSpaceCubed = 1024;
var lrScale         = {x:0, y:0};

var warpLocation = {x:0, y:0};
var warpAnim     = 0;
var warpLocked = false;

// difficulty settings
var maxAsteriods = 32;
var maxNMEs = 8;

var orientation = new matrix3x3();


var nmes = [];

function SetupNMEs()
{
  for (var i=0; i<maxNMEs; i++)
  {
     var nme = new NME();
     nme.randomize(0);
     nmes.push(nme);
  }
}

function UpdateNMEs()
{
  for (var i=0; i<nmes.length; i++)
  {
    nmes[i].pos.x = modulo( nmes[i].pos.x + nmes[i].vel.x * nmes[i].speed );
    nmes[i].pos.y = modulo( nmes[i].pos.y + nmes[i].vel.y * nmes[i].speed );
    nmes[i].pos.z = modulo( nmes[i].pos.z + nmes[i].vel.z * nmes[i].speed );
  }
}

// nme objects
function NME()
{
  this.pos = {x:0, y:0, z:0};
  this.rot = {y:0, p:0, r:0};
  this.vel = {x:0, y:0, z:0};
  this.speed = 0;
  this.damage = 0;
  this.type = 0; // 0 = fighter, 1 = cruiser, 2 = basestar
}

NME.prototype.randomize = function(type)
{
  this.pos.x = Math.random()*localSpaceCubed;
  this.pos.y = Math.random()*localSpaceCubed;
  this.pos.z = Math.random()*localSpaceCubed;
  
  this.vel.x = Math.random()*2-1;
  this.vel.y = Math.random()*2-1;
  this.vel.z = Math.random()*2-1;
  
  this.speed = 1.2;
}


function SetShipLocation(x, y)
{
  shipLocation.x = Math.floor(x);
  shipLocation.y = Math.floor(y);
  shipPosition.x = x;
  shipPosition.y = y;
}

function SetWarpPoint(x, y, lock)
{
  if (warpLocked == true && lock == false) return;
  warpLocked = lock;
  warpLocation.x = x;
  warpLocation.y = y;
  warpAnim = 0;
  
}

function ClearWarpPoint()
{
  warpLocked = false;
}

// many thanks to http://www.sonic.net/~nbs/star-raiders/docs/v.html 
var distanceTable =[100,130,160,200,230,500,700,800,900,1200,1250,1300,1350,1400,1550,1700,1840,2000,2080,2160,2230,2320,2410, 2500,9999];

function ShipCalculateWarpEnergy(sx, sy)
{
   // convert sx and sy into board-coords

  var x = (sx/mapScale.x) - 1;
  var y = (sy/mapScale.y) - 1;
  
  var dx = shipPosition.x - x;
  var dy = shipPosition.y - y;

  // location
  var distance = Math.sqrt(dx*dx+dy*dy);

  var di = Math.floor(distance);
  if (di>23) di=23;

  var energy = distanceTable[di];
  energy+= (distanceTable[di+1]-energy) * (distance-di);
  
  return Math.floor(energy);
}



// long range scan
var shipPhi = 0.0;
var shipTheta = 0;
var strobe = 0;

function renderLongRangeScanner()
{
  var radius = lrScale.x<lrScale.y ? lrScale.x : lrScale.y;

  context.beginPath();
  context.arc(centreX, centreY, radius/2, 0, Math.PI*2.0, 0);
  context.fillStyle = 'rgba(0,64,0,0.5)';
  context.fill();
  context.beginPath();
  context.arc(centreX, centreY, radius/2, 0, Math.PI*2.0, 0);
  context.strokeStyle = 'rgba(0,255,0,0.5)';
  context.linewidth = 1;
  context.stroke(); 
  context.beginPath();
  context.arc(centreX, centreY, radius/8, 0, Math.PI*2.0, 0);
  context.stroke();
  context.beginPath();
  context.arc(centreX, centreY, radius/2, Math.PI*8.5/6, Math.PI*9.5/6, false);
  context.lineTo(centreX, centreY);
  context.closePath();
  context.stroke();
   context.strokeStyle = 'rgba(0,64,0,0.5)';
  for (var a=1; a<8; a++)
  {
    context.beginPath();
    context.arc(centreX, centreY, (a/8) * radius*0.5, Math.PI*8.5/6, Math.PI*9.5/6, 0);
    context.stroke();
  }

  // render asteriods

//  localPosition.x+=2;
//  localPosition.y+=1;
//  localPosition.y+=10;
  
  var cphi = Math.cos(shipPhi);
  var sphi = Math.sin(shipPhi);
  var ctheta = Math.cos(shipTheta);
  var stheta = Math.sin(shipTheta);
  
  var s = radius/canvas.width;

  // I think a matrix is now going to be faster..  
  
  for (var i=0; i<asteriods.length; i++)
  {
      var x = modulo(localPosition.x - asteriods[i].x)-512;
      var y = modulo(localPosition.y - asteriods[i].y)-512;
      var z = modulo(localPosition.z - asteriods[i].z)-512;

      var t = orientation.transform(x,y,z);
      var depth = focalPoint*5 / ((t.z + 1000) +1);
      var sz = 4 * depth;
      // draw a blob
      var grey =  Math.floor(depth*128);
      context.beginPath();
      context.rect(t.x*depth*s+centreX, t.y*depth*s+centreY, sz, sz);
      context.fillStyle = 'rgba('+grey+','+grey+','+grey+',1)';
      context.fill();
  }
  
  strobe+=1;
  for (var i=0; i<nmes.length; i++)
  {
      var x = modulo(localPosition.x - nmes[i].pos.x)-512;
      var y = modulo(localPosition.y - nmes[i].pos.y)-512;
      var z = modulo(localPosition.z - nmes[i].pos.z)-512;
      var t = orientation.transform(x,y,z);
    
      var depth = focalPoint*5 / ((t.z + 1000) +1);
      var sz = 6 * depth;
      // draw a blob
      var red =  Math.floor(depth*128);
      context.beginPath();
      context.rect(t.x*depth*s+centreX, t.y*depth*s+centreY, sz, sz);
      context.fillStyle = 'rgba('+red+','+red*(strobe&4)+','+red*(strobe&8)+',1)';
      context.fill();
  }
  
//  context.fillStyle = 'rgba(255,255,255,1)';
//  context.fill();
  // render targets
}

// galactic scan


function renderGalacticScanner()
{
  var scaleX = mapScale.x;
  var scaleY = mapScale.y;

  context.beginPath();
  
  for (var i=0; i<=galaxyMapSize.x; i++)
  {
    context.moveTo(scaleX*(i+1), scaleY);
    context.lineTo(scaleX*(i+1), scaleY*(galaxyMapSize.y+1));
  }
  context.strokeStyle = '#c0c0c0';
  context.lineWidth = 4;
  context.stroke();
  
  context.beginPath();

  for (var j=0; j<=galaxyMapSize.y; j++)
  {
    context.moveTo(scaleX, scaleY*(j+1));
    context.lineTo(scaleX*(galaxyMapSize.x+1), scaleY*(j+1));
  }
  
  context.strokeStyle = '#c0c0c0';
  context.lineWidth = 4;
  context.stroke();
  
  

  // ping every 5 seconds
  var d = new Date();
  var currentTime = d.getTime();
  var distance = ((currentTime - gameStart)%10000)/10000;
  pingRadius = distance * canvas.width/2;

  context.globalCompositeOperation='source-over';
  var shipX = shipPing.x * scaleX + scaleX;
  var shipY = shipPing.y * scaleY + scaleY;
    // update map with locations of ships
  for (var b=0; b<boardPieces.length; b++)
  {
    // fade in and out board pieces as the ping passes over them
    boardPieces[b].render(shipX, shipY, pingRadius);
  }

  context.globalCompositeOperation='lighter';
  context.globalAlpha = 1;
  context.beginPath();
  
  var gradient = context.createRadialGradient(shipX, shipY, pingRadius*0.5, shipX, shipY, pingRadius*2);
  gradient.addColorStop(0, 'rgba(128, 255, 128,0)');
  gradient.addColorStop(1, 'rgba(128, 255, 128,'+(1-distance)+')');

  context.fillStyle = gradient;
  context.arc(shipX, shipY, pingRadius*2, Math.PI*2, false);
  context.fill();

  // render hyperspace location
  context.beginPath();
  clampX = Math.max(Math.min(warpLocation.x, scaleX*(galaxyMapSize.x+1)), scaleX);
  clampY = Math.max(Math.min(warpLocation.y, scaleY*(galaxyMapSize.y+1)), scaleY);
  
  context.moveTo(clampX, scaleY)
  context.lineTo(clampX, scaleY*(galaxyMapSize.y+1));
  context.moveTo(scaleX, clampY);
  context.lineTo(scaleX*(galaxyMapSize.x+1), clampY);
  
  if (warpLocked)
  {
      warpAnim=(warpAnim+1)%(Math.sqrt(scaleX*scaleX+scaleY*scaleY)*0.5);
      context.arc(clampX, clampY, warpAnim, 0, Math.PI*2, false);
  }
  
  context.strokeStyle = '#c0ffc0';
  context.lineWidth = 1;
  context.stroke();
  
 
}

// input functions

function mouseMove(event) 
{
  var rect = canvas.getBoundingClientRect();

  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  
  SetWarpPoint(mouseX, mouseY, false);
  
  if (event.which&1 && dragging)
  {
    DragEvent(event);
  }
}

function mouseDown(event)
{
  console.log("mousedown" + event.which);
  if (event.which&1)
  {
      dragging = true;
      DragEventStart(event);
   }
}

function mouseUp(event)
{
  if (event.which&1 && dragging)
  {
      DragEventDone(event);
  }
} 

function mouseClick()
{
   var scaleX = mapScale.x;
   var scaleY = mapScale.y;
  
   var x = (mouseX/scaleX)-1;
   var y = (mouseY/scaleY)-1;
  
   //SetShipLocation(x, y);
   buttonpressed = CheckButtons(mouseX, mouseY);
   if (buttonpressed) return;
  
   // lock in warp point
   if (overlayMode == eGalacticScanner)
   {
     if (!warpLocked)
       SetWarpPoint(mouseX, mouseY, true);
     else
       ClearWarpPoint();
   }
}

function resize()
{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
    // compute centre of screen
  centreX = canvas.width/2;
  centreY = canvas.height/2;
  fontsize = 21;
  
  // resize font based on canvas size
  mapScale.x = canvas.width/(galaxyMapSize.x+2);
  mapScale.y = canvas.height/(galaxyMapSize.y+2);
  border.x = mapScale.x;
  border.y = mapScale.y;
  
  lrScale.x = canvas.width*16/18;
  lrScale.y = canvas.height*16/18;
  
  do
  {
    fontsize-=0.1;
    context.font = fontsize + 'pt Calibri';
    var fits = context.measureText('group');
  }while((fits.width+20>mapScale.x || mapScale.y<fontsize*4) && fontsize >5);

  // reset buttons

  SetupButtons();
}

function renderInformation()
{
  switch (overlayMode)
  {
    case eGalacticScanner:
      renderGalaxyInformation();
      break;
    case eLongRange:
      renderLongRangeInformation();
      break;
  }
}

function renderGalaxyInformation()
{
   var scaleX = mapScale.x;
   var scaleY = mapScale.y;
  
   var i = GetBoardPieceScreen(mouseX, mouseY);
   var targets = 'empty';
   if (i>0)
   {
      targets = boardPieces[i].numTargets;
      if (targets == 0) targets = 'starbase';
   }
  
    context.globalAlpha = 1.0;
    context.font = '20pt Calibri';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "left";
    context.fillText('Targets: ' + targets, mapScale.x, canvas.height-15);

    var fuel = ShipCalculateWarpEnergy(mouseX, mouseY);
   
    context.font = '20pt Calibri';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "center";
    context.fillText('Warp Energy: ' + fuel, canvas.width/2, canvas.height-15);
  
    if (warpLocked)
    {
      var clampX = Math.max(Math.min(warpLocation.x, mapScale.x*(galaxyMapSize.x+1)), mapScale.x);
      var clampY = Math.max(Math.min(warpLocation.y, mapScale.y*(galaxyMapSize.y+1)), mapScale.y);
      var fuel = ShipCalculateWarpEnergy(clampX, clampY);

      context.textAlign = "centre";
      context.font = '11pt Calibri';
      context.fillText('Energy: ' + fuel, clampX, clampY-12);
     
    }
    var x = shipPosition.x*scaleX+scaleX;
    var y = shipPosition.y*scaleY+scaleY;
    renderIconShip(x, y, fontsize);
  
    context.globalAlpha = 1.0;
    context.font = '20pt Calibri';
    context.fillStyle = 'rgb(255,255,255)';
    context.textAlign = "center";
    context.fillText('Galactic Scanner', canvas.width/2, 30);
}

function renderLongRangeInformation()
{ 
    context.globalAlpha = 1.0;
  
    renderIconShip(centreX, centreY, 10);
  
    context.globalAlpha = 1.0;
    context.font = '20pt Calibri';
    context.fillStyle = 'rgb(255,255,255)';
    context.textAlign = "center";
    context.fillText('Long Range Scanner', canvas.width/2, 20); 
    context.font = '14pt Calibri';
    context.fillText('(hold left mouse down and DRAG to YAW and PITCH ship)', canvas.width/2, canvas.height-5);
  
}

function renderIconShip(posx, posy, scale)
{
     // render our ship
    var x = posx;
    var y = posy;
  
    context.fillStyle = 'rgb(255,255,0)';
    context.beginPath();
    context.arc(x, y, scale*0.5, 0, Math.PI*2);
    context.fill();
    context.moveTo(x, y-scale*1.5);
    context.lineTo(x-scale, y+scale*1.5);
    context.lineTo(x, y);
    context.lineTo(x+scale, y+scale*1.5);
    context.closePath();

    context.fill();
}

function renderStarDate()
{
  var d = new Date();
  var currentTime = d.getTime();
  
  var gameTime = currentTime - gameStart;
  var decimalTime = gameTime / 60000;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "right";
  leadingzero = decimalTime<10 ? '0':'';
  context.fillText('StarDate: ' + leadingzero + decimalTime.toFixed(2), canvas.width-mapScale.x, canvas.height-15);
}


// rendering functions

function render()
{
 
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height); 
  
  switch (overlayMode)
  {
      case eGalacticScanner:
        renderGalacticScanner();
        break;
    case eLongRange:
        renderLongRangeScanner();
        break;
  }

  renderInformation();
  
  renderStarDate();
  
  RenderButtons();
}

// per frame tick functions
var previousTime = 0;
var currentTime = 0;
var freqHz = 0.016666;

function updateclocks()
{ 
  // compute frequency
  frameCount++;
  // compute time between frames
  currentTime = new Date().getTime();
  if (previousTime)  freqHz = (currentTime - previousTime)/1000.0;
  previousTime = new Date().getTime();
}

// movement functions

function update()
{

   UpdateBoard();
  
   UpdateShipControls();
  
   UpdateNMEs();
}


function animate()
{
  // compute frequency
  updateclocks();

  // movement update
  update();
  // render update
  render();
  // trigger next frame
  requestAnimationFrame(animate);
}

// setup buttons
function SetupButtons()
{
  // erase old buttons
  buttons = [];
  var b = border;
  var ms = mapScale;
  new Button(b.x*0.05, b.y*1.2, b.x*0.8, ms.y*0.6, "Long Range", SwitchToLongRange);
  new Button(b.x*0.05, b.y*2.2, b.x*0.8, ms.y*0.6, "Galaxy Chart", SwitchToGalaxyChart);
  new Button(b.x*0.05, b.y*3.2, b.x*0.8, ms.y*0.6, "Warp", ToggleWarp);
  new Button(b.x*0.05, b.y*4.2, b.x*0.8, ms.y*0.6, "Shields", ToggleShields);
  new Button(b.x*0.05, b.y*5.2, b.x*0.8, ms.y*0.6, "Target Comp", ToggleTargetComp);

  new Slider(ms.x*16, b.y, b.x, ms.y*6,10, true, 10, "throttle", SetThrottle);
 
}

function SwitchToLongRange(button)
{
  console.log("switching to long range");
  if (overlayMode == eLongRange) overlayMode = eNone;
  else overlayMode = eLongRange;
  button.state = overlayMode == eLongRange;
  ClearButtonState("Galaxy Chart");
}

function SwitchToGalaxyChart(button)
{
   console.log("switching to galatic range");
   if (overlayMode == eGalacticScanner) overlayMode = eNone;
   else overlayMode = eGalacticScanner;
   button.state = overlayMode == eGalacticScanner;
   ClearButtonState("Long Range");
}

function ToggleWarp(button)
{
  button.state^=1;
}

function ToggleShields(button)
{
  button.state^=1;
}

function ToggleTargetComp(button)
{
  button.state^=1;
}

// flight controls
var dragStart = {x:0,y:0};
var dragging = false;
var dragCurr = {x:0, y:0};
var dragmatrix = new matrix3x3();

function DragEvent(event)
{
  dragCurr.x = event.clientX;
  dragCurr.y = event.clientY;
}

function DragEventStart(event)
{
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  dragCurr.x = event.clientX;
  dragCurr.y = event.clientY;
  dragmatrix.clone(orientation);
  shipPhi = 0;
  shipTheta = 0;
  
  dragging = true;
}

function DragEventDone(event)
{
  dragging =false;
}

var rotateVelocity = 0;
var pitchVelocity = 0;
var shipVelocity = 0;
var shipThrottle = 0;
var shipVelocityEnergy = 0;

function UpdateShipControls()
{
  var rotationForce = (dragCurr.x - dragStart.x) / canvas.width; 
  var pitchForce = (dragCurr.y - dragStart.y) / canvas.height; 
  if (dragging==true) 
  {
    rotateVelocity+=rotationForce;
    pitchVelocity+=pitchForce;
  }
  rotateVelocity*=0.9;
  pitchVelocity*=0.9;
  shipTheta+=(pitchVelocity*Math.PI*0.5) / 60;
  shipPhi+=(rotateVelocity*Math.PI*0.5) / 60;

  // build rotation matrix
  var rx = new matrix3x3();
  var rz = new matrix3x3();
  rz.rotateZ(shipPhi);
  rx.rotateX(shipTheta);

  orientation.clone(  rz.multiply(rx.multiply(dragmatrix)) );
  
  // move along direction of rotation
  var speed = shipVelocity * freqHz;
  localPosition.x += orientation.m[3]*speed;
  localPosition.y += orientation.m[4]*speed;
  localPosition.z += orientation.m[5]*speed;

 }

// throttle + energy
var throttleTable =  [0, 0.3,  0.75, 1.5,  3,  6,  12, 25, 37, 43 ];
var throttleEnergy = [0,   1,   1.5,   2, 2.5, 3, 3.5, 7.5, 11.25, 15];


function SetThrottle(slider)
{
  
  throttle = Math.round(slider.value);
  shipVelocity = throttleTable[throttle];
  shipVelocityEnergy = throttleEnergy[throttle];
}

// entry point
init();
animate();
