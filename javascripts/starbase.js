
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
// constant options
const focalDepth = 80;
const focalPoint = 256;


// variables
var centreX;
var centreY;
var mouseX;
var mouseY;
var spawnX;
var spawnY;
var frameCount=0;

// test multiple groups


// initialization

function init()
{
  // setup canvas and context
	canvas = document.getElementById('hemisphere');
	context = canvas.getContext('2d');
  
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  window.addEventListener('resize', resize);

  // initialze variables  
}


// input functions

function mouseMove(event) 
{
	var rect = canvas.getBoundingClientRect();

	mouseX = event.clientX - rect.left,
	mouseY = event.clientY - rect.top
}

function mouseClick()
{
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
var demoAngle = Math.PI*1.44;

function render()
{
 
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height); 
  

   var x = centreX;
   var y = centreY;
   var r = 200;
  demoAngle=(demoAngle+0.01)%(Math.PI*2);


  RenderStarbase(x, y, r, demoAngle);
  
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('Hemi-Sphere 2D rendering', canvas.width/2, 100);
  context.fillText('Blue Marble Cutaway', canvas.width/2, 350);

}

// star base construction - eer well it was but its a cool blue marble demo for now
// to rotate horizontally switch out the x/y registers.  I should probably make this generic ..  however just want to use this for the starbase construction in star-raiders

function RenderStarbase(x, y, r, baseAngle)
{  
    // attenuate light
    if (baseAngle<Math.PI*0.5 || baseAngle>Math.PI*1.5)
    {
      RenderHemisphere(x, y, r, baseAngle, '#c0c0f0', '#606080');
      RenderHemisphere(x, y, r*0.75, (baseAngle+Math.PI)%(Math.PI*2),'#a0a0d0', '#404070');
      RenderHemisphere(x, y+r*Math.cos(baseAngle+Math.PI*0.5), r*0.25, baseAngle, '#606090', '#303040');
    }
    else
    {
      RenderHemisphere(x, y+r*Math.cos(baseAngle+Math.PI*0.5), r*0.25, baseAngle, '#606090', '#303040');
      RenderHemisphere(x, y, r*0.75, (baseAngle+Math.PI)%(Math.PI*2), '#a0a0d0', '#404070');
      RenderHemisphere(x, y, r, baseAngle, '#c0c0f0', '#606080');      
    }
    
    
}

function RenderHemisphere(x, y, r, angle, colTop, colBot)
{
    // rotation
  
    m = 0.5522848;

    tr =r*Math.cos(angle);          // top hemisphere angle *rad
    br =r*Math.cos(angle);            // bottom angle *rad

    xkr = m*r;        // kappa * r
    tkr = m*tr;       // top height * kappa
    bkr = m*br;       // bottom height * kappa

    context.beginPath()
    context.moveTo(x+r, y)
    context.bezierCurveTo(x+r,  y-tkr, x+xkr, y-tr,  x,    y-tr)  // top r
    context.bezierCurveTo(x-xkr, y-tr,  x-r,  y-tkr, x-r,  y)     // top l
    context.bezierCurveTo(x-r,  y+bkr, x-xkr, y+br,  x,    y+br)  // bot l
    context.bezierCurveTo(x+xkr, y+br,  x+r,  y+bkr, x+r, y)     // bot r
    context.closePath();
    context.lineWidth = 1;
    context.fillStyle = colBot;
    context.fill();
    
    // drow the blue surface
    tr =r*Math.cos(angle+Math.PI);          // top hemisphere angle *rad
    br =r*Math.cos(angle+Math.PI);            // bottom angle *rad
    if (angle<Math.PI) br = r;
    if (angle>Math.PI) tr = r;
  
    xkr = m*r;        // kappa * r
    tkr = m*tr;       // top height * kappa
    bkr = m*br;       // bottom height * kappa

    context.beginPath()
    context.moveTo(x+r, y)
    context.bezierCurveTo(x+r,  y-tkr, x+xkr, y-tr,  x,    y-tr)  // top r
    context.bezierCurveTo(x-xkr, y-tr,  x-r,  y-tkr, x-r,  y)     // top l
    context.bezierCurveTo(x-r,  y+bkr, x-xkr, y+br,  x,    y+br)  // bot l
    context.bezierCurveTo(x+xkr, y+br,  x+r,  y+bkr, x+r, y)     // bot r
    context.closePath();
    context.lineWidth = 1;
    context.fillStyle = colTop;
    context.fill();

}

// movement functions

function update()
{ 
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
//init();
//animate();
