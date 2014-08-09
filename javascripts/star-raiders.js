// constant options
const focalDepth = 80;
const focalPoint = 256;
const eNone = 0;
const eGalacticScanner = 1;
const eLongRange = 2;
const eTargetComputer = 3;
const shieldRange = 5;

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

// overlay transitions
var lrsTargetX;
var lrsTargetY;
var lrsCentreX;
var lrsCentreY;
var lrsOffScreen = true;
var mapTargetX;
var mapTargetY;
var mapCentreX;
var mapCentreY;
var mapOffScreen = true;

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
var energy = 9999;

// ship damage
var shipDamage = {photons:false, engines:false, shields:false, computer:false, longrangescanner:false, subspaceradio:false};

// difficulty settings
var maxAsteriods = 32;
var maxNMEs = 8;

// needs moving
var targetComputer = false;
var trackingComputer = false;

var orientation = new matrix3x3();
var scannerView = new matrix3x3();

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
  
  // convert mouse to board
  warpLocation.x = Math.min(Math.max(x-border.x, 0), mapScale.x*16);
  warpLocation.y = Math.min(Math.max(y-border.y, 0), mapScale.y*16);
  
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
  var x = Math.min(Math.max(sx-border.x, 0), mapScale.x*16) / mapScale.x;
  var y = Math.min(Math.max(sy-border.y, 0), mapScale.y*16) / mapScale.y;
    
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

function renderLongRangeScanner()
{

  var radius = lrScale.x<lrScale.y ? lrScale.x : lrScale.y;
  var strobe = frameCount;
  
  // logic for enabling/disabling the scanner
  if (lrsOffScreen)
  {
    lrsCentreY = centreY*3;
    lrsCentreX = centreX;
  } 

  lrsTargetX = centreX;
  lrsTargetY = overlayMode == eLongRange ? centreY : centreY*3;
  
  if (Math.abs(lrsTargetY-lrsCentreY)>4)
  {
      // animate
      var dy = lrsTargetY - lrsCentreY;
      lrsCentreY+= dy/8;
      lrsOffScreen = false;
  }
  else
  {
      lrsOffScreen = overlayMode!=eLongRange;
  }
  // check if scanner is suppose to be on
  if (lrsOffScreen) return;
  
  // ok lets draw
  context.beginPath();
  context.arc(lrsCentreX, lrsCentreY, radius/2, 0, Math.PI*2.0, 0);
  context.fillStyle = 'rgba(0,0,64,0.5)';
  context.fill();
  context.beginPath();
  context.arc(lrsCentreX, lrsCentreY, radius/2, 0, Math.PI*2.0, 0);
  context.strokeStyle = 'rgba(0,0,255,0.5)';
  context.linewidth = 1;
  context.stroke(); 
  context.beginPath();
  context.arc(lrsCentreX, lrsCentreY, radius/8, 0, Math.PI*2.0, 0);
  context.stroke();
  context.beginPath();
  context.arc(lrsCentreX, lrsCentreY, radius/2, Math.PI*8.5/6, Math.PI*9.5/6, false);
  context.lineTo(lrsCentreX, lrsCentreY);
  context.closePath();
  context.stroke();
  context.strokeStyle = 'rgba(0,0,128,0.5)';
  for (var a=1; a<8; a++)
  {
    context.beginPath();
    context.arc(lrsCentreX, lrsCentreY, (a/8) * radius*0.5, Math.PI*8.5/6, Math.PI*9.5/6, 0);
    context.stroke();
  }

  // render asteriods
  var s = (radius/canvas.width) * 1.3;

  // I think a matrix is now going to be faster..    
  for (var i=0; i<asteriods.length; i++)
  {
      var x = modulo(localPosition.x - asteriods[i].x)-512;
      var y = modulo(localPosition.y - asteriods[i].y)-512;
      var z = modulo(localPosition.z - asteriods[i].z)-512;

      var t = scannerView.transform(x,y,z);
      var depth = focalPoint*5 / ((t.z + 1400) +1);
      var sz = 5 * depth;
      // draw a blob
      var grey =  Math.floor(depth*400-200);
      context.beginPath();
      context.rect(t.x*depth*s+lrsCentreX-sz*0.5, t.y*depth*s+lrsCentreY-sz*0.5, sz, sz);
      context.fillStyle = 'rgba('+grey+','+grey+','+grey+',1)';
      context.fill();
  }
  
  strobe+=1;
  for (var i=0; i<nmes.length; i++)
  {
      var x = modulo(localPosition.x - nmes[i].pos.x)-512;
      var y = modulo(localPosition.y - nmes[i].pos.y)-512;
      var z = modulo(localPosition.z - nmes[i].pos.z)-512;
      var t = scannerView.transform(x,y,z);
    
      var depth = focalPoint*5 / ((t.z + 1400) +1);
      var sz = 8 * depth;
      // draw a blob
      var red =  Math.floor(depth*400-200);
      context.beginPath();
//      context.rect(t.x*depth*s+centreX-sz*0.5, t.y*depth*s+centreY-sz*0.5, sz, sz);
      context.arc(t.x*depth*s+lrsCentreX, t.y*depth*s+lrsCentreY, sz, 0, Math.PI*2.0);
      context.fillStyle = 'rgba('+red+','+red*(strobe&4)+','+red*(strobe&8)+',1)';
      context.fill();
  }
}

// galactic scan


function renderGalacticScanner()
{
    // logic for enabling/disabling the scanner
  if (mapOffScreen)
  {
    mapCentreY = centreY*2;
    mapCentreX = 0;
  } 

  mapTargetX = 0;
  mapTargetY = overlayMode == eGalacticScanner ? 0 : centreY*2;
  
  var offFade = overlayMode == eGalacticScanner ? 1.0-Math.abs(mapTargetY-mapCentreY) / (centreY*2) : Math.abs(mapTargetY-mapCentreY) / (centreY*2);
  
  if (Math.abs(mapTargetY-mapCentreY)>4)
  {
      // animate
      var dy = mapTargetY - mapCentreY;
      mapCentreY += dy/8;
      mapOffScreen = false;
  }
  else
  {
      mapOffScreen = overlayMode!=eGalacticScanner;
  }
  // check if scanner is suppose to be on
  if (mapOffScreen) return;
  
  var offX = mapCentreX;
  var offY = mapCentreY;
  var scaleX = mapScale.x;
  var scaleY = mapScale.y;

  // clear a shaded area
  context.beginPath();
  context.rect(border.x+offX, border.y+offY, mapScale.x*16, mapScale.y*8);
  context.fillStyle = 'rgba(0,0,128,0.5)';
  context.fill();
  
  context.beginPath();
  
  for (var i=0; i<=galaxyMapSize.x; i++)
  {
    context.moveTo(scaleX*i+border.x+offX, border.y+offY);
    context.lineTo(scaleX*i+border.x+offX, scaleY*(galaxyMapSize.y)+offY+border.y);
  }
  context.strokeStyle = '#c0c0c0';
  context.lineWidth = 4;
  context.stroke();
  
  context.beginPath();

  for (var j=0; j<=galaxyMapSize.y; j++)
  {
    context.moveTo(border.x+offX, scaleY*(j)+offY+border.y);
    context.lineTo(scaleX*(galaxyMapSize.x)+offX+border.x, scaleY*(j)+offY+border.y);
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
  var shipX = shipPing.x * scaleX + border.x+offX;
  var shipY = shipPing.y * scaleY + border.y+offY;
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
  gradient.addColorStop(1, 'rgba(128, 255, 128,'+(1-distance)*(offFade)+')');

  context.fillStyle = gradient;
  context.arc(shipX, shipY, pingRadius*2, Math.PI*2, false);
  context.fill();

  // render hyperspace location
  clampX = warpLocation.x+border.x;
  clampY = warpLocation.y+border.y;
  context.beginPath();
  context.moveTo(clampX+offX, border.y+offY)
  context.lineTo(clampX+offX, scaleY*(galaxyMapSize.y)+border.y+offY);
  context.moveTo(border.x+offX, clampY+offY);
  context.lineTo(scaleX*(galaxyMapSize.x)+border.x+offX, clampY+offY);
  
  if (warpLocked)
  {
      warpAnim=(warpAnim+1)%(Math.sqrt(scaleX*scaleX+scaleY*scaleY)*0.5);
      context.arc(clampX+offX, clampY+offY, warpAnim, 0, Math.PI*2, false);
  }
  
  context.strokeStyle = '#c0ffc0';
  context.lineWidth = 1;
  context.stroke();
  
 
}

// initialization

function init()
{
  // setup canvas and context
  canvas = document.getElementById('star-raiders');
  context = canvas.getContext('2d');
    
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  canvas.addEventListener('mousedown', mouseDown);
  canvas.addEventListener('mouseup', mouseUp);
  canvas.addEventListener("mousewheel", mouseWheel, false);
  document.addEventListener('keydown', processKeydown, false);
  window.addEventListener('resize', resize);
  
  // initialze variables  
  SetShipLocation(galaxyMapSize.x*0.5, galaxyMapSize.y*0.5);

  // initial ping
  shipPing.x = shipPosition.x;
  shipPing.y = shipPosition.y;
  
  // buttons
  SetupButtons();
  
  // populate map
  BoardSetup();
  
  // populate local space
  SetupAsteriods(localSpaceCubed);
  
  SetupNMEs();
  
  var d = new Date();
  gameStart = d.getTime();
  
  // testing this
  PressButton("Target Comp");
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
  if (CheckButtons(mouseX, mouseY, false) == true) return;
  
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
   buttonpressed = CheckButtons(mouseX, mouseY, true);
   if (buttonpressed)
   {
     return;
   }
  
   if (overlayMode == eNone || eTargetComputer)
   {
      FirePhotons();
   }
  
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
  if (warpLocked) // need to rescale the warp location
  {
    tmpx = (warpLocation.x + border.x) / mapScale.x;
    tmpy = (warpLocation.y + border.y) / mapScale.y;
  }
  
  mapScale.x = canvas.width/(galaxyMapSize.x+6);
  mapScale.y = canvas.height/(galaxyMapSize.y+3);
  border.x = mapScale.x*3;
  border.y = mapScale.y;
  
  if (warpLocked) // need to rescale the warp location
  {
    warpLocation.x = tmpx*mapScale.x - border.x;
    warpLocation.y = tmpy*mapScale.y - border.y;
  }
  
  lrScale.x = canvas.width*16/18;
  lrScale.y = canvas.height*16/20;
  
  do
  {
    fontsize-=0.1;
    context.font = fontsize + 'pt Orbitron';
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
  

  renderStarDate();
  renderVelocity();
  renderEnergy();
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
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "left";
    context.fillText('Targets: ' + targets, mapScale.x, canvas.height-15);

    var fuel = ShipCalculateWarpEnergy(mouseX, mouseY);
   
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "center";
    context.fillText('Warp Energy: ' + fuel, canvas.width/2, canvas.height-40);
  
    if (warpLocked)
    {
      // does this in mouse coords for rollover.. so have to add the border back in
      var fuel = ShipCalculateWarpEnergy(warpLocation.x+border.x, warpLocation.y+border.y);

      context.textAlign = "centre";
      context.font = '22pt Orbitron';
          context.fillStyle = 'rgb(0,0,255)';
      context.fillText('Energy: ' + fuel, warpLocation.x+border.x+mapCentreX, warpLocation.y+mapCentreY+border.y-12);
     
    }
  
    var x = shipPosition.x*scaleX+border.x;
    var y = shipPosition.y*scaleY+border.y;
    renderIconShip(x, y, fontsize*1.5);
  
    context.globalAlpha = 1.0;
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,255)';
    context.textAlign = "center";
    context.fillText('Galactic Scanner', canvas.width/2, 30);
}

function renderLongRangeInformation()
{ 
    context.globalAlpha = 1.0;
  
//    renderIconShip(centreX, centreY, 10);
  
    context.globalAlpha = 1.0;
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,255)';
    context.textAlign = "center";
    context.fillText('Long Range Scanner', canvas.width/2, 30);   
}

function renderIconShip(posx, posy, scale)
{
     // render our ship
    var x = posx;
    var y = posy;
  
    context.fillStyle = 'rgb(255,255,0)';
    context.beginPath();
    context.arc(x, y, scale*0.5, 0, Math.PI*2);
    context.stroke();
    context.moveTo(x, y-scale*1.5);
    context.lineTo(x-scale, y+scale*1.5);
    context.lineTo(x, y);
    context.lineTo(x+scale, y+scale*1.5);
    context.closePath();

    context.stroke();
}

function renderTargetingComputer()
{
    if (!targetComputer) return;
  
    var x = centreX;
    var y = centreY;
    var w = canvas.width/16;
    var h = canvas.height/16;
  
    context.beginPath();
    context.moveTo(x+w/4, y);
    context.lineTo(x+w, y);
    context.moveTo(x-w/4, y);
    context.lineTo(x-w, y);
    context.moveTo(x, y-h/4);
    context.lineTo(x, y-h);
    context.moveTo(x, y+h/4);
    context.lineTo(x, y+h);
    context.lineWidth = 7;
    context.strokeStyle = 'rgba(255,0,0,0.5)';
    context.stroke();
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(255,0,0,1)';
    context.stroke();
}

function renderStarDate()
{
  var d = new Date();
  var currentTime = d.getTime();
  
  var gameTime = currentTime - gameStart;
  var decimalTime = gameTime / 60000;
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "left";
  leadingzero = decimalTime<10 ? '0':'';
  context.fillText('StarDate: ' + leadingzero + decimalTime.toFixed(2), canvas.width-mapScale.x*3, canvas.height-15);
}

function renderVelocity()
{ 
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "right";
  leadingzero = shipVelocity<10 ? '0':'';
  context.fillText('V: ' + leadingzero + shipVelocity.toFixed(2), canvas.width-mapScale.x, 30);
}

function renderEnergy()
{ 
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "center";
  leadingzero = energy<10 ? '000':'';
  leadingzero = energy<100 ? '00':'';
  leadingzero = energy<1000 ? '0':'';
  context.fillText('Energy: ' + leadingzero + energy.toFixed(0), canvas.width/2, canvas.height-15);
}

function renderGameScreen()
{
  renderStarfield();
  RenderAsteriods();
  RenderParticles();

  renderShield();
}

function renderOverlays()
{
  switch (overlayMode)
  {
      case eGalacticScanner:
        renderGalacticScanner();
        if (!lrsOffScreen) renderLongRangeScanner();
        break;
    case eLongRange:
        renderLongRangeScanner();
        if (!mapOffScreen) renderGalacticScanner();
        break;
    case eTargetComputer:
        renderTargetingComputer();
        if (!lrsOffScreen) renderLongRangeScanner();
        if (!mapOffScreen) renderGalacticScanner();
        break;
      
    default:
        if (!lrsOffScreen) renderLongRangeScanner();
        if (!mapOffScreen) renderGalacticScanner();
        break;
  }
  
}

// rendering functions

function render()
{
 
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  renderGameScreen();

  renderOverlays();

  renderInformation();
  
  RenderButtons();
  
    PhotonCheck();
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
   moveStarfield();
  
   UpdateAsteriods();

   UpdateBoard();
  
   UpdateShipControls();
  
   UpdateNMEs();
  
   UpdateParticles();
  
   energyManagement();
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

// keyboard controls
function processKeydown(event)
{
    var key = String.fromCharCode(event.keyCode);
    console.log("key = " + key);
    if (CheckShortcuts(key)==false)
    {
        // throttle
        if (key>='0' && key<='9')
        {
            var slider = GetControl("throttle");
            slider.value = key - '0';
            SetThrottle(slider);
        }
    }
}

// setup buttons
function SetupButtons()
{
  // erase old buttons
  buttons = [];
  var b = border;
  var ms = mapScale;
  var bx = border.x*0.25
  var bw = border.x*0.5;
  
  new Button(bx, b.y*2.2, bw, ms.y*0.6, "Long Range", SwitchToLongRange, 'L');
  new Button(bx, b.y*3.2, bw, ms.y*0.6, "Galaxy Chart", SwitchToGalaxyChart, 'G');
  new Button(bx, b.y*4.2, bw, ms.y*0.6, "Warp", ToggleWarp, 'H');
  new Button(bx, b.y*5.2, bw, ms.y*0.6, "Shields", ToggleShields, 'S');
  new Button(bx, b.y*6.2, bw, ms.y*0.6, "Target Comp", ToggleTargetComp, 'C');
  new Button(bx, b.y*7.2, bw, ms.y*0.6, "Tracking Comp", ToggleTrackingComp, 'T');

  new Slider(ms.x*20, b.y*2, border.x*0.25, ms.y*6, 10, true, 10, "throttle", SetThrottle);
 
}

function SwitchToLongRange(button)
{
  console.log("switching to long range");
  if (overlayMode == eLongRange) overlayMode = eNone;
  else overlayMode = eLongRange;
  button.state = overlayMode == eLongRange;
  ClearButtonState("Galaxy Chart");
  ClearButtonState("Target Comp");
}

function SwitchToGalaxyChart(button)
{
   console.log("switching to galatic range");
   if (overlayMode == eGalacticScanner) overlayMode = eNone;
   else overlayMode = eGalacticScanner;
   button.state = overlayMode == eGalacticScanner;
   ClearButtonState("Long Range");
   ClearButtonState("Target Comp");
}

function ToggleWarp(button)
{
  button.state^=1;
  if (button.state == false && triggerWarp!=normalSpace) triggerWarp=cancelHyperspace;
  else triggerWarp = enterHyperspace;
}

function ToggleShields(button)
{
  button.state^=1;
  
  shieldUp=button.state;
  splutterCount = 30;
  splutterNoise = 60;
}

function ToggleTargetComp(button)
{
  button.state^=1;
  targetComputer= button.state;

   if (overlayMode == eTargetComputer) overlayMode = eNone;
   else overlayMode = eTargetComputer;
   ClearButtonState("Long Range");
   ClearButtonState("Galaxy Chart");
}

function ToggleTrackingComp(button)
{
  button.state^=1;
  trackingComputer= button.state;
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
var setShipVelocity = 0;
var triggerWarp = 0;

const normalSpace = 0;
const enterHyperspace = 1;
const inHyperspace = 2;
const cancelHyperspace = 3;

function UpdateShipControls()
{
  TestMoveUnderMouse(mouseX, mouseY,dragging);
  if (triggerWarp!=normalSpace) EnteringWarp();
  

  return;
  
  
  
  var rotationForce = -(dragCurr.x - dragStart.x) / canvas.width; 
  var pitchForce = (dragCurr.y - dragStart.y) / canvas.height; 
  if (dragging==true) 
  {
    rotateVelocity+=rotationForce;
    pitchVelocity+=pitchForce;
  }
  rotateVelocity*=0.9;
  pitchVelocity*=0.9;
  shipTheta+=(pitchVelocity*Math.PI*0.25) / 60;
  shipPhi+=(rotateVelocity*Math.PI*0.25) / 60;

  // build rotation matrix
  var rx = new matrix3x3();
  var rz = new matrix3x3();
  var ry = new matrix3x3();
  rx.rotateX(shipTheta);
  ry.rotateY(shipPhi);
  orientation.clone(  ry.multiply(rx.multiply(dragmatrix)) );
  
  // orientate the view polar for the scanner
  var rotate90 = new matrix3x3();
  rotate90.rotateX(Math.PI*0.5);
  scannerView.clone(rotate90.multiply(orientation));
  
  // move along direction of rotation
  var dv = setShipVelocity-shipVelocity;
  if (dv<-1) dv = -0.2;
  if (dv>+1) dv = +0.2;
  shipVelocity += dv;
  
  var speed = -shipVelocity * freqHz;
  localPosition.x += orientation.m[6]*speed;
  localPosition.y += orientation.m[7]*speed;
  localPosition.z += orientation.m[8]*speed;

 }

// continual movement.. 
function TestMoveUnderMouse(mouseX, mouseY)
{
  // calculate the fov angle from the centre to the mouse
  var dx = centreX - mouseX;
  var sx = dx * focalPoint*5 / 1000;
  var dy = centreY - mouseY;
  var sy = -dy * focalPoint*5 / 1000;
  //convert into angle
  angleX = Math.tan(sx/1000);
  //convert into angle
  angleY = Math.tan(sy/1000);

  var rx = new matrix3x3();
  var rz = new matrix3x3();
  var ry = new matrix3x3();
  rx.rotateX(angleY*freqHz);
  ry.rotateY(angleX*freqHz);
  
  orientation.clone(  ry.multiply(rx.multiply(orientation)) );
  
  // orientate the view polar for the scanner
  var rotate90 = new matrix3x3();
  rotate90.rotateX(Math.PI*0.5);
  scannerView.clone(rotate90.multiply(orientation));
  
  // move along direction of rotation
  var dv = setShipVelocity-shipVelocity;
  if (dv<-1) dv = -0.2;
  if (dv>+1) dv = +0.2;
  shipVelocity += dv;
  
  var speed = -shipVelocity * freqHz;
  localPosition.x += orientation.m[6]*speed;
  localPosition.y += orientation.m[7]*speed;
  localPosition.z += orientation.m[8]*speed;
  // changing
  initVelocity = -setShipVelocity*0.05;

}

/*

var angleX=0;
var angleY=0;
function TestMoveUnderMouse(mouseX, mouseY, click)
{
  if (click)
  {
      // calculate the fov angle from the centre to the mouse
      var dx = centreX - mouseX;
      var sx = dx * focalPoint*5 / 1400;
      var dy = centreY - mouseY;
      var sy = -dy * focalPoint*5 / 1400;

      //convert into angle
      angleX = Math.tan(sx/1400);
      //convert into angle
      angleY = Math.tan(sy/1400);
  }
  else
  {
      angleX-=angleX*freqHz;
      angleY-=angleY*freqHz;
  }
  
  var rx = new matrix3x3();
  var rz = new matrix3x3();
  var ry = new matrix3x3();
  rx.rotateX(angleY*freqHz);
  ry.rotateY(angleX*freqHz);
  
  orientation.clone(  ry.multiply(rx.multiply(orientation)) );
  
  // orientate the view polar for the scanner
  var rotate90 = new matrix3x3();
  rotate90.rotateX(Math.PI*0.5);
  scannerView.clone(rotate90.multiply(orientation));
  
  // move along direction of rotation
  var dv = setShipVelocity-shipVelocity;
  if (dv<-1) dv = -0.2;
  if (dv>+1) dv = +0.2;
  shipVelocity += dv;
  
  var speed = -shipVelocity * freqHz;
  localPosition.x += orientation.m[6]*speed;
  localPosition.y += orientation.m[7]*speed;
  localPosition.z += orientation.m[8]*speed;
  
    // changing
  initVelocity = -setShipVelocity*0.125;

}
*/
// throttle + energy
var throttleTable =  [0, 0.3,  0.75, 1.5,  3,  6,  12, 25, 37, 43 ];
var throttleEnergy = [0,   1,   1.5,   2, 2.5, 3, 3.5, 7.5, 11.25, 15];

function mouseWheel(event)
{
    var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    var slider = GetControl("throttle"); 
    
    slider.value+=delta*freqHz*6;
    SetThrottle(slider);
}

function SetThrottle(slider)
{

  if (slider.value >9) slider.value = 9;
  if (slider.value <0) slider.value = 0;

  if (triggerWarp==normalSpace)
  {
    throttle = Math.round(slider.value);
    setShipVelocity = throttleTable[throttle];
    shipVelocityEnergy = throttleEnergy[throttle];
  }
}

function energyManagement()
{
  // twin ions
  energy -= (shipVelocityEnergy*freqHz);
  // shields
  if (shieldUp) energy -= 2*freqHz;
  // lifesupport
  energy -= 0.25 * freqHz;
  // tracking computer
  if (trackingComputer) energy -= 0.5 * freqHz;
  
  // check damage
  CheckShields();
}

function EnteringWarp()
{
   if (triggerWarp==enterHyperspace)
   {
      setShipVelocity = 99.99;
      if (!enterWarp && shipVelocity >90)
      {
        triggerWarp = inHyperspace;
        enterWarp = true;
        warpStartDepth = cameraDepth;
        warpTime = 0;
      }
   }
  if (triggerWarp == inHyperspace)
  {
    // waiting destination 
    if (enterWarp == false)
    {
       triggerWarp = normalSpace;
       var slider = GetControl("throttle");
       SetThrottle(slider);
       GetControl("Warp").state = 0;
    }
  }
  if (triggerWarp == cancelHyperspace)
  {
     triggerWarp = normalSpace;
     var slider = GetControl("throttle");
     SetThrottle(slider);
     energy-=100;
  }
}

var shipFireX = 1;
function FirePhotons()
{
   // alternate fire
   spawnX = centreX + shipFireX*canvas.width/32;
   spawnY = centreY + canvas.height/16;
   torpedoEmitter.create();
   if (shipDamage.photons==false) shipFireX*=-1;
  energy-=10;
}

function CheckShields()
{
  var i = asteriods.length;
  while (i)
  {
      --i;
    if (asteriods[i].shieldsHit) 
    {
      // spawn splash
      var roid = asteriods[i];
      var x = modulo2(localPosition.x - roid.x, localSpaceCubed)-localSpaceCubed*0.5;
      var y = modulo2(localPosition.y - roid.y, localSpaceCubed)-localSpaceCubed*0.5;
      var z = modulo2(localPosition.z - roid.z, localSpaceCubed)-localSpaceCubed*0.5;
        
      var scale =512/canvas.height;
      var t = orientation.transform(x, y, z);
      var depth = focalPoint*5 / ((t.z + 5*scale) +1);

      spawnX = t.x*depth+centreX;
      spawnY = t.y*depth+centreY;
      spawmZ =0;
      dustEmitter.create();
      ShieldHit(spawnX, spawnY, 100/(1<<roid.fragment));
      // delete roid
      asteriods.splice(i,1);
    }
  } 
}

function ShieldHit(x, y, damage)
{
  energy-=damage;
  if (shieldUp==false) // dead
  {
     // gameover
    energy = 0;
  }
  else
  {
     shieldFlash(x, y);
  }
}

function PhotonCheck()
{

  for (var i = 0; i< spawnList.length; i++)
  {
      if (spawnList[i].emitter instanceof PhotonTorpedoEmitter)
      {
          var pos = spawnList[i].particles[63].pos;

          var depth = focalPoint / (pos.z + focalDepth );
          if (depth<=0) continue;
    
          var sx = pos.x * depth + spawnList[i].particles[63].sx + cX-centreX;
          var sy = pos.y * depth + spawnList[i].particles[63].sy + cY-centreY;
          var sz = spawnList[i].particles[63].size * depth;
/*        
          context.beginPath();
          context.arc(sx, sy, sz, 0, Math.PI*2);
          context.fillStyle = 'rgb(255,255,255)';
          context.fill();
*/        
          var scale =512/canvas.height;
//          console.log("photon = " + pos.x + " " + pos.y + " " + pos.z);
          for (var j = 0; j<asteriods.length; j++)
          {
  
              var roid = asteriods[j];
              var x = modulo2(localPosition.x - roid.x, localSpaceCubed)-localSpaceCubed*0.5;
              var y = modulo2(localPosition.y - roid.y, localSpaceCubed)-localSpaceCubed*0.5;
              var z = modulo2(localPosition.z - roid.z, localSpaceCubed)-localSpaceCubed*0.5;

              var t = orientation.transform(x, y, z);
              var depth = focalPoint*5 / ((t.z + 5*scale) +1);
              if (depth<=0) continue;
              var size = depth*1.5;
     
              var x1 = t.x*depth+centreX;
              var y1 = t.y*depth+centreY;
              var dx = sx-x1;
              var dy = sy-y1;
              var dz = pos.z-500 - t.z;
/*            
              context.beginPath();
              context.arc(x1, y1, size, 0, Math.PI*2);
              context.strokeStyle = 'rgb(255,255,255)';
              context.stroke();
              context.fillText("dist="+Math.floor(dz), x1, y1-12);
*/
              if (dx*dx+dy*dy < size*size && dz*dz < 4000)
              {
                  // create particle
                  spawnX=x1;
                  spawnY=y1;
                  spawnZ=t.z;
              
                  dustEmitter.create();
                
                  // destroy blast
                  spawnList[i].life = 0;
                
                  // fragment rock
                  if (asteriods[j].fragment==2)
                    asteriods[j].init();    // destroy
                  else
                    FragmentAsteriod(asteriods[j]);

                  break;
              }
          }
      }
  }
}


// entry point
init();
animate();
