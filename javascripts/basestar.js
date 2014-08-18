// conceptualized and written by andi smithers
// copyright andi smithers.
// freely distributable in whole or in partial
// please retain credit and comment if distributed
// thank you. 

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
	canvas = document.getElementById('star-raiders');
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


  RenderBasestar(x, y, r, demoAngle);
  
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('3D Cylinder/Cone rendering on a 2D canvas', canvas.width/2, 40);
  context.fillText('Basestar for star-raiders', canvas.width/2, canvas.height-80);
  context.fillText('combines 2 hemispheres an inverted cylinder with r, -r', canvas.width/2, canvas.height-60);    context.fillText('plus 2 side cylinders at the side to show well cylinders', canvas.width/2, canvas.height-40);
}

// star base construction - eer well it was but its a cool blue marble demo for now
// to rotate horizontally switch out the x/y registers.  I should probably make this generic ..  however just want to use this for the starbase construction in star-raiders

function RenderBasestar(x, y, r, baseAngle)
{  
    if (r < 10) return;
    var len = r/5;
    var r2 = -r;
  
    // compute y
    var y1 = y+len*2*Math.cos(baseAngle+Math.PI*0.5);
    var y2 = y-len*2*Math.cos(baseAngle+Math.PI*0.5);
  
    if (baseAngle<Math.PI*0.5 || baseAngle>Math.PI*1.5)
    {
      RenderBaseHemisphere(x, y2, r, baseAngle, '#808080', '#808080');

      RenderCylinder(x, y, r2, r, len*2, baseAngle, '#808080', '#808080', 'darkred');
      RenderLazers(x, y, r, baseAngle);
      RenderBaseHemisphere(x, y1, r, (baseAngle+Math.PI)%(Math.PI*2),'#808080', '#808080');
    }
    else
    {
      RenderBaseHemisphere(x, y1, r, (baseAngle+Math.PI)%(Math.PI*2), '#808080', '#808080');
      RenderCylinder(x, y, r2, r, len*2, baseAngle, '#808080', '#808080', 'darkred');
      RenderLazers(x, y, r, baseAngle);
      RenderBaseHemisphere(x, y2, r, baseAngle, '#808080', '#808080');      
    }
    
}

function RenderLazers(x, y, r, baseAngle)
{
//   context.rotate(Math.PI*0.5);
  // context.translate(-x+y,-y-x);
    var r1 = r/10;
    var r2 = r2;
    var y3 = y;

   RenderCylinder(x-150, y3, r2, r1, r/2, baseAngle+Math.PI*0.5, 'rgba(255,255,0,1)','rgba(255,128,0,1)','rgba(255,0,0,1)');
   RenderCylinder(x+150, y3, r2, r1, r/2, baseAngle+Math.PI*0.5, 'rgba(255,255,0,1)','rgba(255,128,0,1)','rgba(255,0,0,1)');

}

function RenderBaseHemisphere(x, y, r, angle, colTop, colBot)
{
   // rotation
    m = 0.5522848;

    tr =r*Math.cos(angle)*0.5;          // top hemisphere angle *rad
    br =r*Math.cos(angle)*0.5;            // bottom angle *rad

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
    if (angle<Math.PI) br = r*0.5;
    if (angle>Math.PI) tr = r*0.5;
  
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

function RenderCylinder(x, y, r1, r2, side, angle, colTop, colBot, colSide)
{
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
    var gradient = context.createRadialGradient(x, y, 0, x, y, Math.abs(r1));
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, '#404040');

    context.fillStyle = gradient;
    context.fill();
  
    context.beginPath();
    context.moveTo(x+r1, y1)
    context.bezierCurveTo(x+r1,  y1+tkr, x+xkr, y1+tr,  x,    y1+tr)  // top r
    context.bezierCurveTo(x-xkr, y1+tr,  x-r1,  y1+tkr, x-r1, y1)     // top l
    context.lineTo(x-r2,    y2);
    context.bezierCurveTo(x-r2,  y2+bkr2, x-xkr2, y2+br2,  x,    y2+br2)  // bot l
    context.bezierCurveTo(x+xkr2, y2+br2,  x+r2,  y2+bkr2, x+r2, y2)     // bot r
    context.closePath();
//    context.fillStyle = colSide;
      context.fillStyle = gradient;
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
init();
//animate();
