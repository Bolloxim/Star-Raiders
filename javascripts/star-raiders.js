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

// basic matrices 3x3
function matrix3x3()
{
   // set as identiy
  this.m = [1,0,0,0,1,0,0,0,1];
}

matrix3x3.prototype.clone = function(matrix)
{
  this.m = matrix.m.slice(0);
}

matrix3x3.prototype.rotateX = function(angle)
{
   var c = Math.cos(angle);
   var s = Math.sin(angle);
   this.m = [1,0,0,0,c,-s,0, s, c];
}
matrix3x3.prototype.rotateY = function(angle)
{
   var c = Math.cos(angle);
   var s = Math.sin(angle);
   this.matrix = [c,0,s,0,1,0,-s, 0, c];
}
matrix3x3.prototype.rotateZ = function(angle)
{
   var c = Math.cos(angle);
   var s = Math.sin(angle);
   this.m = [c,-s,0,s,c,0,0,0,1];
}
matrix3x3.prototype.multiply = function(matrix)
{
   var m1 = this.m;
   var m2 = matrix.m;
   
   return {m:[m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6], 
              m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7], 
              m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8], 
              m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6], 
              m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7], 
              m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8], 
              m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6], 
              m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7], 
              m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]] };
}

matrix3x3.prototype.transform = function(tx, ty, tz)
{
  return {x:tx*this.m[0]+ty*this.m[1]+tz*this.m[2], 
          y:tx*this.m[3]+ty*this.m[4]+tz*this.m[5],
          z:tx*this.m[6]+ty*this.m[7]+tz*this.m[8]};
}

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

// depth modulo fucntion. custom
function modulo(a)
{
  // depth range is 1024
  const b = 1024;
	return a-b * Math.floor(a/b);
}

// board pieces 
function GetBoardPiece(x, y, useKnown)
{
  if (useKnown)
  {
      for (var i=0; i<boardPieces.length; i++)
      {
        if (boardPieces[i].lastknown.x == x && boardPieces[i].lastknown.y==y) return i;
      }      
  }
  else
  {
      for (var i=0; i<boardPieces.length; i++)
      {
        if (boardPieces[i].location.x == x && boardPieces[i].location.y==y) return i;
      }      
  }
  return -1;
}

function GetBoardPieceScreen(sx, sy, lastKnown)
{
  x = Math.floor(sx/mapScale.x) - 1;
  y = Math.floor(sy/mapScale.y) - 1;
  
  return GetBoardPiece(x, y, lastKnown);
}

// creates a piece
function BoardPiece(x, y, type)
{
  this.init(x, y, type);
}

// initializer
BoardPiece.prototype.init = function(fx, fy, type)
{
  // type 0 = base
  // type 1 = patrol
  // type 2 = group
  // type 3 = fleet
  
  // status = 0 dead
  // status = 1 alive
  this.type = type;
  this.laststate = 0;
  this.lastknown = {x:fx, y:fy};

  this.location = {x:fx, y:fy};
  this.status = 2;
  
  this.moveRate = type==3 ? 8 : type;
  this.nextMove = this.moveRate;
  
  this.numTargets = type==0 ? 0 : type+1;
}

// render pieces
BoardPiece.prototype.render = function(x, y, radius)
{
   var trailRad2 = radius*radius*0.25;
   var leadRad2 = radius*radius*4;

   var pos = this.screen(this.lastknown.x, this.lastknown.y);
   var dx = pos.x - x;
   var dy = pos.y - y;
   var distance2 = dx*dx+dy*dy;

   var fade=1;
  
	if (distance2<leadRad2) // update lastknow
   {
     fade = (distance2 - trailRad2) / (leadRad2-trailRad2);
     if (fade>0  && this.laststate!=0)
     {
        this.drawitem(pos, fade);
     }
   }
   else if (this.laststate!=0)
   {
      this.drawitem(pos, 1);
   }
  
   var pos2 = this.screen(this.location.x, this.location.y);
   var dx2 = pos2.x-x;
   var dy2 = pos2.y-y;
   var distance22 = dx2*dx2+dy2*dy2;
  
    if (distance22<leadRad2 && this.status>0) // update lastkno
    {
      fade = ((distance22 - trailRad2) / (leadRad2-trailRad2))+1.0;
      this.drawitem(pos2, fade);  
    }  
    else if (this.status == 1)
    {
      this.drawitem(pos2, fade);  
    }

}


// update to known location
BoardPiece.prototype.updateKnowns = function()
{
   if(this.status==2) this.status=1;
  
   this.lastknown.x = this.location.x;
   this.lastknown.y = this.location.y;
   this.laststate   = this.status;
}

// game piece movement logic - pretty rough randomizer

BoardPiece.prototype.move = function(gameCycle)
{
   this.updateKnowns();
  
   // scale game cycle time (radar beats every 10s)
   aiCycle = Math.floor(gameCycle/cycleScalar);
  
   if (this.nextMove<=aiCycle && this.type > 0) // new position except bases
   {
      var x, y;
      var target = boardPieces[targetBase].location;
      // bee-line
      var dx = target.x - this.location.x;
      var dy = target.y - this.location.y;
      x = Math.max(Math.min(dx, 1), -1) + this.location.x;
      y = Math.max(Math.min(dy, 1), -1) + this.location.y;
      
      var p = GetBoardPiece(x, y);
      if ((p>=0 || x<0 || y<0 || x>=galaxyMapSize.x || y>=galaxyMapSize.y) && p.type!=0) 
      {
          if (dx==0) x = Math.floor(Math.random()*2)*2-1 + this.location.x;
          else y = Math.floor(Math.random()*2)*2-1 + this.location.y;
          p = GetBoardPiece(x, y);
          // off board or occupied
          if (p>=0 || x<0 || y<0 || x>=galaxyMapSize.x || y>=galaxyMapSize.y) return;
      }

     // update movement time
     this.nextMove += this.moveRate;
     
     this.location.x = x;
     this.location.y = y;
     this.status = 2;

   }


}

// help functoin to convert from map to screen space
BoardPiece.prototype.screen = function(x, y)
{
  return {x:x*mapScale.x+mapScale.x*1.5, y:y*mapScale.y+mapScale.y*1.5};
}


// DRAW Board piece item with label text
BoardPiece.prototype.drawitem = function( pos, fading)
{
  var ascii = ["starbase", "patrol", "group", "fleet"];

	var light = (fading-1)*255;
   light = Math.floor(Math.max(Math.min(light, 255), 0));
  
  font = fontsize + (((fading-1.5)*40));
  if (this.status < 2 || fading <=1.5) font = fontsize;
  font*=0.75;
  context.globalAlpha = fading>1 ? 1.0: fading;
  context.font = font + 'pt Calibri';
  context.fillStyle = 'rgb('+light+',255,'+light+')';
  context.textAlign = "center";

  context.fillText(ascii[this.type], pos.x, pos.y+font*1.5);  
  
  pos.y-=font;
  
  switch(this.type)
    {
      case 0: // base
        context.beginPath();
        context.arc(pos.x, pos.y, font, 0, Math.PI, true);
        context.moveTo(pos.x+font, pos.y);
        context.quadraticCurveTo(pos.x, pos.y+font*0.75, pos.x-font, pos.y);
        context.fill();
        context.strokeStyle='#80ff80';
        context.stroke();
        break;
      case 1:  // patrol fighter
        context.beginPath();
        context.arc(pos.x, pos.y, font*0.75, 0, Math.PI*2, false);
        context.fill();
        context.moveTo(pos.x-font, pos.y-font);
        context.lineTo(pos.x-font, pos.y+font);
        context.moveTo(pos.x+font, pos.y-font);
        context.lineTo(pos.x+font, pos.y+font);
        context.strokeStyle='#80ff80';
        context.stroke();
        break;
      case 2: // group cruiser
        context.beginPath();
        context.moveTo(pos.x-font, pos.y);
        context.lineTo(pos.x-font/2, pos.y-font/2);
        context.lineTo(pos.x+font*2, pos.y);
        context.lineTo(pos.x-font/2, pos.y+font/2);
        context.closePath();
        context.fill();
        context.lineTo(pos.x+font*2, pos.y);
        context.strokeStyle='#80ff80';
        context.stroke();
        context.beginPath();
        context.arc(pos.x-font*1.5, pos.y-font*0.9, font*0.25, 0, Math.PI*2, false);
        context.arc(pos.x-font*2, pos.y+font*0.75, font*0.25, 0, Math.PI*2, false);
        context.fill();
        break;
        
      case 3: // fleet / basestar
        context.beginPath();
        context.moveTo(pos.x-font, pos.y-font/2);
        context.quadraticCurveTo(pos.x, pos.y-font, pos.x+font, pos.y-font/2);
        context.lineTo(pos.x-font, pos.y+font/2);
        context.quadraticCurveTo(pos.x, pos.y+font, pos.x+font, pos.y+font/2);
        context.closePath();
        context.fill();
        context.strokeStyle='#80ff80';
        context.stroke();
        break;
    }

}

function CountHostiles(loc)
{
  var count = 0;
    for (var i=-1; i<2; i++)
    {
      for (var j=-1; j<2; j++)
        {
          var p = GetBoardPiece(loc.x+i, loc.y+j);
          if (p>=0 && p.type!=0) count++;
        }
    }
  
  return count;
}


function BoardSetup()
{
  // clear board
  targetBase = 0;
  boardPieces = [];
  
  var x, y, border = 1;
  for (var i =0; i<4; i++)  // types
  {
    for (var j=0; j<4; j++)  // counts
    {

      do
      {
        x = Math.floor(Math.random() * (galaxyMapSize.x-border*2))+border;
        y = Math.floor(Math.random() * (galaxyMapSize.y-border*2))+border;
        
        var p = GetBoardPiece(x, y);
      } while(p>=0);

      boardPieces.push(new BoardPiece(x, y, i));
    }
    border = 0;
  }
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

// asteriods 
var asteriods = [];

function SetupAsteriods()
{
  asteriods = [];
  for (var i=0; i<maxAsteriods; i++)
  {
     asteriods.push(new Asteriod())
  }
}

function Asteriod()
{
  this.init();
}

Asteriod.prototype.init = function()
{
  this.x = Math.random()*localSpaceCubed;
  this.y = Math.random()*localSpaceCubed;
  this.z = Math.random()*localSpaceCubed;
}


// initialization

function init()
{
  // setup canvas and context
	canvas = document.getElementById('test');
	context = canvas.getContext('2d');
  
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  canvas.addEventListener('mousedown', mouseDown);   canvas.addEventListener('mouseup', mouseUp);
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
  SetupAsteriods();
  
  SetupNMEs();
  
	var d = new Date();
  gameStart = d.getTime();
  
  // testing this
  PressButton("Long Range");
  
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

// movement functions

function update()
{
  var d = new Date();
  var currentTime = d.getTime();
  var gameCycle = Math.floor((currentTime - gameStart)/10000);
  if (gameCycle!=lastCycle)
  {
    for (var b=0; b<boardPieces.length; b++)
    {
      boardPieces[b].move(gameCycle);
    }
    shipPing.x = shipPosition.x;
    shipPing.y = shipPosition.y;
  }
  lastCycle = gameCycle;
  
    // check starbase health and trigger destruction 
   var base = boardPieces[targetBase];
   var count = CountHostiles(base.location);
   if (count>=4) // trigger kaboom
   {
     if (base.nextMove==0) base.nextMove = gameCycle + 2;
     if (base.nextMove<gameCycle)
     { 
       targetBase++;
       base.status = 0;
       boardPieces.push(new BoardPiece(base.location.x, base.location.y, 1)); 
     }
   }
   else
   {
     base.nextMove = 0;  
   }
  
   if (targetBase == 4 ) // zylons win
   {
      BoardSetup();
   }
  
   UpdateShipControls();
  
   UpdateNMEs();
}

// per frame tick functions

function animate()
{
  frameCount++;
  // movement update
  update();
  // render update
  render();
  // trigger next frame
  requestAnimationFrame(animate);
}

// array to hold all buttons
var buttons = [];


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

}


// checks hits against the button list
function CheckButtons(x, y)
{
   var buttonhit=false;
   for (var i=0; i<buttons.length; i++)
   {
     buttonhit |= buttons[i].hit(x,y);
   }
   return buttonhit;
}

// renders the buttons
function RenderButtons()
{
   for (var i=0; i<buttons.length; i++)
   {
     buttons[i].render();
   }
}

function ClearButtonState(name)
{
   for (var i=0; i<buttons.length; i++)
   {
     if (name == buttons[i].name)
     {
       buttons[i].state = 0;
     }
   }
}

// debug function to emumlate button presses
function PressButton(name)
{
   for (var i=0; i<buttons.length; i++)
   {
     if (name == buttons[i].name)
     {
       buttons[i].callback(buttons[i]);
     }
   }
}

function Button(x, y, w, h, name, callback)
{
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.name = name;
  this.callback = callback;
  this.state = 0;
  // add button to stack
  buttons.push(this);
}

Button.prototype.render = function()
{
  // generate 8 points for the 3d button
  /*
  var x1 = this.x;
  var x2 = this.x+this.w;
  var y1 = this.y*2;
  var y2 = this.y*2+this.h;
  var z1 = 0;
  var z2 = 20;
  var b = 10;
  var coordinates = [x1, y1, z1, x2, y1, z1, x2, y2, z1, x1, y2, z1,
                     x1-b, y1-b, z2, x2+b, y1-b, z2, x2+b, y2+b, z2, x1-b, y2+b, z2];
  var transforms = [];
  
  var hud = new matrix3x3();
  hud.rotateX(-Math.PI*0.25);
  var temp = new matrix3x3();
  temp.rotateZ(-Math.PI*0.25);
  hud.clone(hud.multiply(temp));
  
  for (var i=0; i<8; i++)
  {
      var x = coordinates[i*3+0];
      var y = coordinates[i*3+1];
      var z = coordinates[i*3+2];
       
      var t = hud.transform(x,y,z);
      var depth = focalPoint*4/ ((t.z +focalDepth*20) +1);
      transforms[i] = {x:t.x*depth, y:t.y*depth};
   }
   
  var polys = [3,2,1,0, 0,1,5,4, 1,2,6,5, 2,3,7,6, 3,0,4,7, 4,5,6,7];
  for (var i=0; i<5; i++)
  {
     var c0 = transforms[polys[i*4+0]];
     var c1 = transforms[polys[i*4+1]];
     var c2 = transforms[polys[i*4+2]];
     var c3 = transforms[polys[i*4+3]];

     context.beginPath();
     context.moveTo(c0.x, c0.y);
     context.lineTo(c1.x, c1.y);
     context.lineTo(c2.x, c2.y);
     context.lineTo(c3.x, c3.y);
     context.closePath();

     // cross product
     var dx1 = c1.x-c0.x;
     var dx2 = c1.x-c2.x;
     var dy1 = c1.y-c0.y;
     var dy2 = c1.y-c2.y;
     var cross = dx1 * dy2 - dx2 * dy1;
     var shade = Math.floor(cross*0.25);

     context.fillStyle = 'rgba(0,'+shade+',0,0.5)';
     context.fill();
     context.strokeStyle = 'rgba(192,255,192,0.5)';
     context.stroke();
  }
  */
    // fill a rect
  context.beginPath();
  context.rect(this.x, this.y, this.w, this.h);
  if (this.state==0)
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  else
    context.fillStyle = 'rgba(0, 128, 0, 0.5)';
  context.fill();

  context.lineWidth = 2;
  context.strokeStyle = 'rgba(120, 240, 120, 0.5)';
  context.stroke();
  
  context.moveTo(this.x, this.y);
  context.font = '10pt Calibri';
  context.fillStyle = 'rgba(127,255,127, 1)';
  context.textAlign = "center";
  context.fillText(this.name, this.x+this.w/2, this.y+this.h-9);
}

Button.prototype.hit = function(x, y)
{
   if (x>=this.x && x<this.x+this.w && y>this.y && y<this.y+this.h)
   {
      // hit
     this.callback(this);
     return true;
   }
   return false;
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
  var speed = 5;
  localPosition.x += orientation.m[3]*speed;
  localPosition.y += orientation.m[4]*speed;
  localPosition.z += orientation.m[5]*speed;
 }

// entry point
init();
animate();
