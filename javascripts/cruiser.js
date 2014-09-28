
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

// module
(function()
{


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
  canvas = document.getElementById('cruiser');
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
   var r = 25;
   demoAngle=(demoAngle+0.01)%(Math.PI*2);
  demoPhiAngle=Math.PI*1.4;

  RenderCruiser(x, y, r, demoPhiAngle, demoAngle);
  
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('3D Cylinder/Cone rendering on a 2D canvas', canvas.width/2, 40);
  context.fillText('Zylon Cruiser for star-raiders', canvas.width/2, canvas.height-80);
  context.fillText('Uses cylinders, cones and hemispheres', canvas.width/2, canvas.height-60);    context.fillText('Modeled roughly to a klingon cruiser', canvas.width/2, canvas.height-40);
}

// star base construction - eer well it was but its a cool blue marble demo for now
// to rotate horizontally switch out the x/y registers.  I should probably make this generic ..  however just want to use this for the starbase construction in star-raiders


function RenderCruiser(x, y, r, baseAngle, theta)
{  
    var len = r/10;
    var r2 = r;
    var hullr = r*3;
    var fuseLen = r*3
  
    // compute y
    var y1 = y+r*5*2*Math.cos(baseAngle);
    var y2 = y+len*2*Math.cos(baseAngle+Math.PI*0.5);
    var oppositeAngle = (baseAngle+Math.PI)%(Math.PI*2);
  
    var fusalageOrder =(baseAngle<Math.PI || baseAngle>Math.PI*2);
    if (baseAngle>Math.PI*0.5 && baseAngle<Math.PI*1.5)
    {
      if (!fusalageOrder) 
      {
        RenderNacells(x, y1, hullr, len*8, baseAngle);
        RenderHull(x, y1, hullr, len*8, oppositeAngle);
        RenderFusalage(x,y,r,fuseLen,baseAngle);
      }
      
      RenderHemisphere(x, y2, r*0.8, oppositeAngle, '#800000', '#800000');
      RenderBridge(x, y, r, r, len*2, oppositeAngle, '#203040', '#607080', '#304050');
      
      if (fusalageOrder)
      {
        RenderFusalage(x,y,r,fuseLen,baseAngle);
        RenderNacells(x, y1, hullr, len*8, baseAngle);
        RenderHull(x, y1, hullr, len*8, oppositeAngle);
      }
    }
    else
    {
      if (!fusalageOrder)
      {
        RenderHull(x, y1, hullr, len*8, oppositeAngle);
        RenderNacells(x, y1, hullr, len*8, baseAngle);
        RenderFusalage(x, y, r,fuseLen, baseAngle);
      }
      RenderBridge(x, y, r, r, len*2, oppositeAngle, '#203040', '#607080', '#304050');
      RenderHemisphere(x, y2, r*0.8, oppositeAngle, '#800000', '#800000');
      if (fusalageOrder)
      {
        RenderFusalage(x,y,r,fuseLen,baseAngle);
        RenderHull(x, y1, hullr, len*8, oppositeAngle);
        RenderNacells(x, y1, hullr, len*8, baseAngle);
      }
      
    }
    
}

function RenderFusalage(x, y, r, len, baseAngle)
{
    var r1 = r/3;
    var r2 = r/5;
    var y3 = y+Math.cos(baseAngle)*(r+len);

    RenderBridge(x, y3, r2, r1, len, baseAngle+Math.PI*0.5, '#103040', '#103040', '#103040');
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

function RenderHull(x, y, r1, side, angle)
{
   RenderBridge(x, y, r1*0.8, r1*1.1, side, angle, '#203040', '#607080', '#304050');
}

function RenderNacells(x, y, r1, side, angle)
{
    var y2 = y+side*1.5*Math.cos(angle+Math.PI*0.5);
    var r2 = r1/7.5;
    RenderBridge(x-r1, y2, r1/15, r2, r1, angle+Math.PI*0.5, '#f08040', '#f08040', '#f04050', true);
    RenderBridge(x+r1, y2, r1/15, r2, r1, angle+Math.PI*0.5, '#f08040', '#f08040', '#f04050', true);
}

function RenderBridge(x, y, r1, r2, side, angle, colTop, colBot, colSide, glow)
{
   var glowing = glow || 0;
   // rotation
    var m = 0.5522848;

    var tr =r1*Math.cos(angle);          // top hemisphere angle *rad
    var br =r1*Math.cos(angle);            // bottom angle *rad

    var xkr = m*r1;        // kappa * r
    var tkr = m*tr;       // top height * kappa
    var bkr = m*br;       // bottom height * kappa
  
    var y1 = y - side* Math.sin(angle);
    
    // drow the blue surface
    var tr2 =r2*Math.cos(angle);          // top hemisphere angle *rad
    var br2 =r2*Math.cos(angle);            // bottom angle *rad
  
    var xkr2 = m*r2;        // kappa * r
    var tkr2 = m*tr2;       // top height * kappa
    var bkr2 = m*br2;       // bottom height * kappa

    // compute x, y 
    var y2 = y + side*Math.sin(angle);

   //  render front side
    context.beginPath();
    context.moveTo(x+r1, y1)
    context.bezierCurveTo(x+r1,  y1-tkr, x+xkr, y1-tr,  x,    y1-tr)  // top r
    context.bezierCurveTo(x-xkr, y1-tr,  x-r1,  y1-tkr, x-r1, y1)     // top l
    context.lineTo(x-r2,    y2);
    context.bezierCurveTo(x-r2,  y2-bkr2, x-xkr2, y2-br2,  x,    y2-br2)  // bot l
    context.bezierCurveTo(x+xkr2, y2-br2,  x+r2,  y2-bkr2, x+r2, y2)     // bot r
    context.closePath();
//    context.fillStyle = colSide;
    var gradient = context.createRadialGradient(x, y, 0, x, y, Math.abs(side*0.5));
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, colSide);

    context.fillStyle = glowing==0?colSide:gradient;
    context.fill();
  
    context.beginPath();
    context.moveTo(x+r1, y1)
    context.bezierCurveTo(x+r1,  y1+tkr, x+xkr, y1+tr,  x,    y1+tr)  // top r
    context.bezierCurveTo(x-xkr, y1+tr,  x-r1,  y1+tkr, x-r1, y1)     // top l
    context.lineTo(x-r2,    y2);
    context.bezierCurveTo(x-r2,  y2+bkr2, x-xkr2, y2+br2,  x,    y2+br2)  // bot l
    context.bezierCurveTo(x+xkr2, y2+br2,  x+r2,  y2+bkr2, x+r2, y2)     // bot r
    context.closePath();

    context.fillStyle = glowing==0?colSide:gradient;
    context.fill();

    if (angle>Math.PI*0.5 && angle<Math.PI*1.5)
    {
        context.beginPath()
        context.moveTo(x+r2, y2)
        context.bezierCurveTo(x+r2,  y2-tkr2, x+xkr2, y2-tr2,  x,    y2-tr2)  // top r
        context.bezierCurveTo(x-xkr2, y2-tr2,  x-r2,  y2-tkr2, x-r2,  y2)     // top l
        context.bezierCurveTo(x-r2,  y2+bkr2, x-xkr2, y2+br2,  x,    y2+br2)  // bot l
        context.bezierCurveTo(x+xkr2, y2+br2,  x+r2,  y2+bkr2, x+r2, y2)     // bot r
        context.closePath();
        context.lineWidth = 0;
        context.fillStyle = colTop;
        context.fill();
    }
    else
    {
        context.beginPath() 
        context.moveTo(x+r1, y1)
        context.bezierCurveTo(x+r1,  y1-tkr, x+xkr, y1-tr,  x,    y1-tr)  // top r
        context.bezierCurveTo(x-xkr, y1-tr,  x-r1,  y1-tkr, x-r1, y1)     // top l
        context.bezierCurveTo(x-r1,  y1+bkr, x-xkr, y1+br,  x,    y1+br)  // bot l
        context.bezierCurveTo(x+xkr, y1+br,  x+r1,  y1+bkr, x+r1, y1)     // bot r
        context.closePath();
        context.lineWidth = 1;
        context.fillStyle = colBot;
        context.fill();      
    }

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
window.RenderCruiser = RenderCruiser;

})();
