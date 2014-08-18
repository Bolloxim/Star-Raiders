// conceptualized and written by andi smithers
// copyright (C) 2014 andi smithers.
// freely distributable in whole or in partial
// please retain credit and comment if distributed
// thank you. 


// constant options
const focalDepth = 1400;
const focalPoint = 256;


// variables
var centreX;
var centreY;
var mouseX;
var mouseY;
var spawnX;
var spawnY;
var frameCount=0;
var phi = Math.PI*0.5;
var theta = 0;
var autoRotate = 0;
var cameraDepth = 0;

// test multiple groups
var parts = [];
var flyby = [];

// handles negative numbers correctly
function modulo2(a, b)
{
	return a-b * Math.floor(a/b);
}

function Part()
{
  this.init();
}

Part.prototype.init = function()
{
  this.pos = {x:0, y:0, z:0}
  this.vel = {x:0, y:0, z:0}  
}

Part.prototype.move = function()
{
  this.pos.x+=this.vel.x;
  this.pos.y+=this.vel.y;
  this.pos.z+=this.vel.z;
  
  this.vel.x*=1.03;
  this.vel.y*=1.03;
  this.vel.z*=1.03;
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
  window.addEventListener('resize', resize);
}

function initDemo()
{
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  
  mouseX = centreX;
  mouseY = centreY;

  // initialze variables  
  for (var i=0; i<4; i++)
  {
     parts[i] = new Part();   
  }
  
  for (var i=0; i<100; i++)
   {
     flyby[i] = {x:Math.random()*16384-8192, y:Math.random()*2048-1024, z:i*100};   
   }
}


// input functionsf

function mouseMove(event) 
{
	var rect = canvas.getBoundingClientRect();

	mouseX = event.clientX - rect.left,
	mouseY = event.clientY - rect.top
  if (!autoRotate)
    {
       phi = Math.atan2((centreX - mouseX) , canvas.width/2) + (Math.PI*0.5);
       theta = Math.atan2((centreY - mouseY) , canvas.height);
    }
}

function mouseClick()
{
	autoRotate^=1;
  if (!autoRotate)
  {
    phi = Math.atan2((centreX - mouseX) , canvas.width/2) + (Math.PI*0.5);
  }
  
  parts[0].vel.x = Math.random()*4;
  parts[0].vel.y = Math.random()*4;
  parts[0].pos.x = 0;
  parts[0].pos.y = 0;
}

function resize()
{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
    // compute centre of screen
  centreX = canvas.width/2;
  centreY = canvas.height/2;
}


// rendering functions


function render()
{
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height); 

  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,128)';
  context.textAlign = "center";
  context.fillText('Zylon Fighter', canvas.width/2, 20);
  context.font = '10pt Calibri';
  context.fillText('(look up star-raiders on wikipedia)', canvas.width/2, 40);

  context.font = '13pt Calibri';
  context.fillText('mouse button toggles autorotate', canvas.width/2, canvas.height-30);
  // autorotate
  if (autoRotate) 
  {
    theta=0;
    phi+=0.01;
  }  
  
  for (var i=99; i>=0; --i)
  {
      var index = Math.floor(modulo2(i + cameraDepth/100, 100));
		 var depth = modulo2(flyby[index].z - cameraDepth, 10000);
    
      renderZylon(flyby[index].x, flyby[index].y, depth, phi, theta);
   }
}

function renderZylon(x1, y1, z1, rotation, elevation, parts)
{
  
  // compute depth and 3D position
  var scale = 512/canvas.height;
  var depth = focalPoint*5 / (z1 + 5*scale);
  var x = x1 * depth + centreX;
  var y = y1 * depth + centreY;
  var size  = 1 * depth;

  if (!autoRotate)
  {
    rotation = Math.atan2((x - mouseX) , canvas.width/2) + (Math.PI*0.5);
     elevation = Math.atan2((y - mouseY) , canvas.height);
  }
  
  if (size<=0) return;
  
  var fade = 1.0;
  if (z1>128)  fade = 1.0 - (z1-128)/128;
  if (fade<0) fade = 0;
  context.globalAlpha = fade;
  // rotate the ship
  var angle = rotation;
  var c = Math.sin(angle+Math.PI*0.5);
  var s = Math.sin(angle);

  // exploit symetrical rendering and use angle to determine which wing to do first
  var itemAngle = c>=0? angle : angle+Math.PI;
  var itemEle = c>=0? elevation*-1 : elevation;

  if (s<0)
  {
 
    renderWing(x, y, size, itemAngle, itemEle);
    renderLauncher(x, y, size, itemAngle);

    renderCockpit(x, y, size, angle,elevation);
    renderFuselage(x, y, size, angle);

    // do other side
    itemAngle+=Math.PI;
    itemEle*=-1;
    renderLauncher(x, y, size, itemAngle);
    renderWing(x, y, size, itemAngle, itemEle);
  }
  else
  {
    renderWing(x, y, size, itemAngle, itemEle);
    renderLauncher(x, y, size, itemAngle);

    renderFuselage(x, y, size, angle);      
    renderCockpit(x, y, size, angle, elevation);

    // do other side
    itemAngle+=Math.PI;
    itemEle*=-1;
    renderLauncher(x, y, size, itemAngle);
    renderWing(x, y, size, itemAngle, itemEle);
  }

}

function renderFuselage(x, y, size, angle)
{
  context.fillStyle = 'rgb(255,255,255)';
  
  context.beginPath();
  context.arc(x, y, size, 2 * Math.PI, false);
  context.fill();
  context.lineWidth = size/100 * 8;
  context.strokeStyle = '#808080';
  context.stroke();
} 

function renderCockpit(x, y, size, angle, elev)
{
  context.fillStyle = '#000000';
  context.beginPath();  
  var c = Math.cos(angle);
  var s = Math.sin(angle);
    
  var ce = Math.cos(elev+Math.PI*0.5);
  var se = Math.sin(elev+Math.PI*0.5);
  // really should be a fully transformed X not a radius hack
  drawEllipseByCenter(context, x+ c*size*0.9, y+ce*size*0.9, s*size, se*size);
  context.fill();
  context.lineWidth = size/100 * 8;
  context.strokeStyle = '#404040';
  context.stroke();

}


// found a useful ellipse by centre by Steve Tranby. 
function drawEllipseByCenter(ctx, cx, cy, w, h) 
{
  drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
}

function drawEllipse(ctx, x, y, w, h) 
{
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  //ctx.closePath(); // not used correctly, see comments (use to close off open path)
  ctx.stroke();
}

function renderWing(x, y, size,  angle, ele)
{
  var inc = Math.PI /3;
  context.fillStyle = '#000000';
  context.beginPath();

  var s = Math.sin(angle+Math.PI*.5);
  var c = Math.sin(angle);
  
  var wingRad = size*1.5;
  var wingSize = size*1.6;
  
  context.moveTo(x + c*wingRad + (wingSize*Math.cos(ele))*s, y + wingSize*Math.sin(ele));
  for (var i = 1; i < 6; i++) 
  {
    context.lineTo(x + c*wingRad + (wingSize*Math.cos(inc*i+ele))*s, y + wingSize*Math.sin(inc*i+ele));
  }
  context.closePath();
  context.fill();   
  context.lineWidth = size/100 * 8;;
  context.strokeStyle = '#FFFFFF';
  context.stroke();

  context.beginPath();

  for (var i = 0; i < 6; i++) 
  {
    context.moveTo(x + c*wingRad , y+0);
    context.lineTo(x + c*wingRad + (wingSize*Math.cos(inc*i+ele))*s, y + wingSize*Math.sin(inc*i+ele));
    context.lineWidth = size/100 * 8;
    context.strokeStyle = '#FFFFFF';
    context.stroke();
  }
  
}

function renderLauncher(x, y, size, angle)
{
  var inc = Math.PI /3;
  context.fillStyle = '#FFFFFF';
  context.beginPath();

  var s = Math.sin(angle+Math.PI*.5);
  var c = Math.sin(angle);
  
  context.fillStyle = 'rgb(255,255,255)';
  
  context.beginPath();
  context.arc(x + c*size*1.25, y, size*0.25, 2 * Math.PI, false);
  context.fill();
  context.lineWidth = size/100 * 8;
  context.strokeStyle = '#808080';
  context.stroke();
 
}
// movement functions

var accel = 5;
function update()
{ 
  accel+=0.1;
  if (accel>20) accel = 20;
  if (!autoRotate)
      cameraDepth += accel;
  for (var j=0; j<100; j++)
    {
      radial = ((modulo2(cameraDepth+flyby[j].z),10000) *Math.PI*2) / 12500;
      distance = modulo2(cameraDepth+flyby[j].z,10000) - 5000;
      flyby[j].x = distance * Math.sin(radial+j*3) - distance*Math.cos(radial+j);
      flyby[j].y = distance * Math.sin(radial+j/2) + distance*Math.cos(radial);
    }
  for (var i=0; i<4; i++)
    {
      parts[i].move();
    }
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


// entry point
init();
//initDemo();
//animate();
