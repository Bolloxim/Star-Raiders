
/*****************************************************************************
The MIT License (MIT)

Copyright (c) 2014 Andi Smithers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*****************************************************************************/

// conceptualized and written by andi smithers

// module
(function()
{


// globals
var canvas, context, alpha;
var cX, cY, tX, tY, mouseX, mouseY, density;
var stars = [];
var cameraDepth=0;
var enterWarp, warpStartDepth, warpTime, velocity;
var warpspread = 3;

// define to 0 to brute force move all stars
const cameraTrick = 1;

// options
const starCount = 1024;
var initVelocity = -1.0;
var termVelocity = -10.0;
const topleft = 0;
const trackMouse = 1;
const focalPoint = 256;
const sparcity = 2.0;
const tailLength = 20;

const viewFront = 0;
const viewAft = 1;
var   viewIs = viewFront;
var   starsColorAlias = 'black';

// depth modulo fucntion. custom
function modulo(a)
{
  // depth range is 1024
  const b = 1024;
	return a-b * Math.floor(a/b);
}

// handles negative numbers correctly
function modulo2(a, b)
{
	return a-b * Math.floor(a/b);
}

function Star(index)
{
  // randomize a field -1024 to 1024 and positive z
  this.x = (Math.random() *2048-1024)*sparcity;
  this.y = (Math.random() *2048-1024)*sparcity;
  this.z = ((starCount-1)-index)/density;

  if (topleft==1) 
  {
    this.x = this.x + 1024;
    this.y = this.y + 1024;
  }
}

Star.prototype.move = function()
{
  // dont really have to move all stars
  this.z = modulo(this.z + velocity)
}

Star.prototype.pan = function(horizontal, vertical)
{
  // dont really have to move all stars
  this.x += horizontal*4;
  this.y += vertical*4;
  // modulo math went a bit wonky  
  if (this.x<-1024*sparcity) this.x+=2048*sparcity;
  if (this.y<-1024*sparcity) this.y+=2048*sparcity;
  if (this.x>1024*sparcity) this.x-=2048*sparcity;
  if (this.y>1024*sparcity) this.y-=2048*sparcity;
}


Star.prototype.draw = function() 
{
  // compute depth perspective effect, cameraDepth is used when cameraTrick = 1

  var depth = focalPoint / (modulo(this.z + cameraDepth) +1);
  var x = this.x * depth + cX;
  var y = this.y * depth + cY;
  var sz = 5 * depth;
  
  // fill a rect
  context.beginPath();
  context.rect(x, y, sz,sz);
  context.fillStyle = 'white';
  context.fill();
  // use border edge for twinkle effect 
  context.lineWidth = 0;
  context.strokeStyle = starsColorAlias;
  context.stroke();
};

Star.prototype.warpline = function() 
{
  var depth = modulo(this.z + cameraDepth)+1;
  var depthStart = modulo(this.z + warpStartDepth)+1
  if (depth>depthStart && termVelocity<0) depth = 1;
  if (depth<depthStart && termVelocity>0) depthStart = 1;
  
  var invDepth = focalPoint / depth;
  var invDepthStart = focalPoint / depthStart;
  
  var x = this.x * invDepth + cX;
  var y = this.y * invDepth + cY;
  var sz = 5 * invDepth ;
  
  var wx = this.x * invDepthStart + cX;
  var wy = this.y * invDepthStart + cY;
  var wsz = 5 * invDepthStart;
	
  // computed quadrant dictates what 2 edges we see in rendering the trail
  var top = this.y<0? sz : 0;
  var left = this.x<0? sz : 0;
  var alpha = (sz/5.0+0.1) * 0.7;
  // fill a ray
  context.beginPath();
  context.moveTo(wx, wy);
  context.lineTo(x+sz, y+top);
  context.lineTo(x, y+top);
  context.moveTo(wx, wy);
  context.lineTo(x+left, y+sz);
  context.lineTo(x+left, y);
  context.closePath();
  context.fillStyle = termVelocity<0?'rgba(64,128,192,'+alpha+')':'rgba(192,64,32,'+ alpha+')';
  context.fill();
  // use border edge for twinkle effect 
 // context.lineWidth = 0;
 // context.strokeStyle = 'black';
 // context.stroke();

};

function init()
{
  // setup canvas and context
	canvas = document.getElementById('star-raiders');
	context = canvas.getContext('2d');
  // set canvas to be window dimensions
  resize();
  canvas.addEventListener('mousemove', mousemove);
  //canvas.addEventListener('click', mouseclick);
  window.addEventListener('resize', resize);

  // compute center of screen (its really centre but for americans I change it)
	tX = cX = canvas.width/2;
	tY = cY = canvas.height/4;
  
  if (topleft==1) 
  {
    cX=0;
    cY=0;
  }
  
  density = starCount/1024;
  // allocate and init stars
  for (i=0; i<starCount; i++)
  {
  	stars[i] = new Star(i);
  }
  
  alpha = 6.0;
  enterWarp = false;
  velocity = initVelocity;

  window.velocity = velocity;
  window.initVelocity = initVelocity;
  window.enterWarp = enterWarp;
  window.cX = cX;
  window.cY = cY;
  window.tX = tX;
  window.tY = tY;
  window.starsColorAlias = starsColorAlias;
  window.density = density;
  window.cameraDepth = cameraDepth;
  window.warpStartDepth = warpStartDepth;
}

function animate()
{
  // movement update
  move();
  // render update
  render();
  // trigger next frame
  requestAnimationFrame(animate);
}

function panStarfield(horizontal, vertical)
{
  for (i = 0; i < stars.length; i++) 
  {
    stars[i].pan(horizontal, vertical);
  };
}

function move()
{
  moveStarfield();
}

function moveStarfield()
{
  
  if (enterWarp)
  {
    velocity*=1.02;
    if (velocity<termVelocity && termVelocity<0) velocity=termVelocity;
    if (velocity>termVelocity && termVelocity>0) velocity=termVelocity;
    warpTime=warpTime+1;
    if (warpTime>140) enterWarp = false;
    if (warpTime>tailLength) warpStartDepth=modulo(warpStartDepth+velocity);
    // catchup time
    if (warpTime>130)
    {
      warpStartDepth = modulo(warpStartDepth + (cameraDepth-warpStartDepth) * 0.3);
    }
  }
  else
  {
     // slow down
	   var dv = velocity - initVelocity;
     velocity-= dv * 0.01;
  }
  // brute force move.. will replace with camera trick
  if (cameraTrick==0)
  {
  	for (i = 0; i < stars.length; i++) 
  	{
  		stars[i].move();
  	};
  }
  else
  {
  	// camera movement trick
  	cameraDepth = modulo(cameraDepth+velocity);
  }
  
  var dx = tX - cX;
  var dy = tY - cY;
  var dist = Math.sqrt(dx*dx + dy*dy);

  if (dist!=0)
   {
     dx/=dist;
     dy/=dist;
   }
  dist = Math.min(dist, 512.0);

  cX = cX + (dist*dx*0.06125);
  cY = cY + (dist*dy*0.06125);
 
}

function render()
{
  // brute force clear
  context.clearRect(0, 0, canvas.width, canvas.height);

  renderStarfield();

  createButton(canvas.width/2-100, 10, 200, 32, termVelocity>0?"Aft View":"Bow View");
  
  // banner for a about 12 seconds
  alpha -= 0.008;
  if (alpha<=0) return;
  context.font = '40pt Calibri';
  context.fillStyle = 'rgba(255,255,255,'+alpha+')';
  context.textAlign = "center";
  context.fillText('Star Trek Field', canvas.width/2, 100);
  context.font = '10pt Calibri';
  context.fillText('(move mouse to change field options in script for effects)', canvas.width/2, 120);
  context.fillText('* Left Click Warps *', canvas.width/2, 140);
}

function renderStarfield()
{
  context.globalCompositeOperation='source-over';
  // draw all stars
  for (i = 0; i < stars.length; i++) 
  {
    var index = cameraTrick==1 ? modulo2((i + 1 + Math.floor(cameraDepth)*density) , stars.length) : i;
    // depending on direction of travel is order of drawing trails
    if (enterWarp && termVelocity<=0 && (index%warpspread)==0) stars[index].warpline();
    stars[index].draw();
    if (enterWarp && termVelocity>0 && (index%warpspread)==0) stars[index].warpline();
  };  
}

function mousemove(event) 
{
	var rect = canvas.getBoundingClientRect();

	mouseX = event.clientX - rect.left,
	mouseY = event.clientY - rect.top
  // just for fun lets just click on moving
  if (trackMouse)
  {
    tX = mouseX;
    tY = mouseY;
    if (termVelocity<=0)
    {
      tX = canvas.width - tX;
      tY = canvas.height - tY;
    }
  }
}

function mouseclick()
{
  tX = mouseX;
  tY = mouseY;
  if (termVelocity>0)
  {
    tX = canvas.width - tX;
    tY = canvas.height - tY;
  }  
  // swap
  if (hitButton(canvas.width/2-100, 10, 200, 32))
  {
    swapView();
    return;
  }
  
  if (!enterWarp)
  {
    enterWarp = true;
    warpStartDepth = cameraDepth;
    warpTime = 0;
  }
}
  

function resize()
{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function viewingFront()
{
  return viewIs == viewFront;
}

function viewingAft()
{
  return viewIs == viewAft;
}

function swapView()
{
  // toggle view
  viewIs ^= 1;

  // inverse the velocities
  initVelocity*=-1;
  termVelocity*=-1;
  velocity*=-1;
  // switch warplines
  if (enterWarp)
  {
    var tmp = cameraDepth;
    cameraDepth = warpStartDepth;
    warpStartDepth = tmp;
  }
  // change view point of travel
  if (termVelocity>0)
  {
    cX = canvas.width - cX;
    cY = canvas.height - cY;
    tX = canvas.width - tX;
    tY = canvas.height - tY;
    }
  else
  {
    cX = canvas.width - cX;
    cY = canvas.height - cY;
    tX = mouseX;
    tY = mouseY;
  }


}

// entry point
init();

window.renderStarfield = renderStarfield;
window.moveStarfield = moveStarfield;
window.panStarfield = panStarfield;
window.swapView = swapView;
window.viewIs = viewIs;
window.viewingAft = viewingAft;
window.viewFront = viewFront;
window.viewAft = viewAft;
window.viewingFront = viewingFront;

})();
