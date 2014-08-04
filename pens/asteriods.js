// constants
const focalDepth = 80;
const focalPoint = 256;
const maxAsteriods = 32;
var localSpaceCubed = 10;

// variables
var centreX;
var centreY;
var mouseX;
var mouseY;
var spawnX;
var spawnY;
var frameCount=0;
var shieldUp;
var splutterCount=0;
var splutterNoise=60;

// matrix
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

function RenderAsteriods()
{
  for (var i=0; i<asteriods.length;i++)
  {
    asteriods[i].render();
  }
}

function UpdateAsteriods()
{
  for (var i=0; i<asteriods.length;i++)
  {
    asteriods[i].update();
  }
}

function Asteriod()
{
  this.init();
}

Asteriod.prototype.init = function()
{
  this.asteroidVerts = [];
  
  this.x = Math.random()*localSpaceCubed-localSpaceCubed*0.5;
  this.y = Math.random()*localSpaceCubed-localSpaceCubed*0.5;
  this.z = Math.random()*localSpaceCubed-localSpaceCubed*0.5;
  
  this.angVel = {y:(Math.random()-0.5)*Math.PI/120, p:(Math.random()-0.5)*Math.PI/120, r:(Math.random()-0.5)*Math.PI/120};
  this.rotation = new matrix3x3();
  
  // fetch the icosahedron data and morph it
  for (var i=0; i< icosahedronVerts.length; i++)
  {
    var deform = Math.random()*1.0-0.5;
    var x = icosahedronVerts[i].x + icosahedronVerts[i].x * deform;
    var y = icosahedronVerts[i].y + icosahedronVerts[i].y * deform;
    var z = icosahedronVerts[i].z + icosahedronVerts[i].z * deform;
    this.asteroidVerts[i] = {x:x, y:y, z:z};
  }

}

Asteriod.prototype.update = function()
{
  var matrixY = new matrix3x3();
  var matrixP = new matrix3x3();
  var matrixR = new matrix3x3();
  matrixY.rotateZ(this.angVel.y);
  matrixP.rotateX(this.angVel.p);
  matrixR.rotateY(this.angVel.r);
  this.rotation.clone(this.rotation.multiply(matrixR.multiply(matrixP.multiply(matrixY))));
  
  this.x += this.angVel.p;
  this.y += this.angVel.r;
  this.z += this.angVel.y;
}

Asteriod.prototype.render = function()
{
   var scale = 512/canvas.height;

   var transforms = [];
   var cphi = Math.cos(phi);
   var sphi = Math.sin(phi);

   var ctheta = Math.cos(theta);
   var stheta = Math.sin(theta);
   
   // transform into 3d coords
   for (var i=0; i<this.asteroidVerts.length; i++)
   {
      var vert = this.asteroidVerts[i];
      var t = this.rotation.transform(vert.x, vert.y, vert.z);

/*      var tz = vert.z * ctheta + vert.y * stheta;
      var ty = vert.y * ctheta - vert.z * stheta;
      // rotate phi 
      var tx = vert.x * cphi - ty * sphi;
          ty = ty * cphi + vert.x * sphi;
 */

      t.x +=this.x;
      t.y +=this.y;
      t.z +=this.z;
     
      // pixel depth using a long focal distance to ensure all set is in focus
      var depth = focalPoint*5 / ((t.z + 5*scale) +1);
      if (depth<=0) return;
     
      var x1 = t.x*depth+centreX;
      var y1 = t.y*depth+centreY;
     transforms.push(  {x:x1, y:y1, z:t.z} );
     
   }
  
   for (var i=0; i<icosahedronTris.length;i+=3)
   {
      var a = icosahedronTris[i];
      var b = icosahedronTris[i+1];
      var c = icosahedronTris[i+2];
      // back face cull
      var dx1 = transforms[b].x - transforms[a].x;
      var dy1 = transforms[b].y - transforms[a].y;
      var dx2 = transforms[b].x - transforms[c].x;
      var dy2 = transforms[b].y - transforms[c].y;
      var cross = (dx1*dy2 - dy1*dx2);
      if (cross < 0) continue;
      // use cross product normal to reflect light
      var shade = Math.floor(Math.sqrt(cross)*scale)+10;

     // fill the triangle
      context.beginPath();
      context.moveTo(transforms[a].x, transforms[a].y);
      context.lineTo(transforms[b].x, transforms[b].y);
      context.lineTo(transforms[c].x, transforms[c].y);
      context.closePath();
      context.fillStyle = 'rgba('+shade+','+shade+','+shade+',1)';
      context.fill();
      // edge it in red for fun
      context.lineWidth = 1;
      context.strokeStyle = 'rgba('+(shade>>1)+','+(shade>>1)+','+(shade>>1)+', 1)';
      context.stroke();
   }
}


// test multiple groups
var icosahedronVerts = [];
var icosahedronTris = [];

function buildVerts()
{
  icosahedronVerts = 
  [
    {x: 0.000, y: 0.000, z: 1.000},
    {x: 0.894, y: 0.000, z: 0.447},
    {x: 0.276, y: 0.851, z: 0.447},
    {x:-0.724, y: 0.526, z: 0.447},
    {x:-0.724, y:-0.526, z: 0.447},
    {x: 0.276, y:-0.851, z: 0.447},
    {x: 0.724, y: 0.526, z:-0.447},
    {x:-0.276, y: 0.851, z:-0.447},
    {x:-0.894, y: 0.000, z:-0.447},
    {x:-0.276, y:-0.851, z:-0.447},
    {x: 0.724, y:-0.526, z:-0.447},
    {x: 0.000, y: 0.000, z:-1.000}
  ];
  
  icosahedronTris = 
  [
   0,1,2,
   0,2,3,
   0,3,4,
   0,4,5,
   0,5,1,
   11,7,6,
   11,8,7,
   11,9,8,
   11,10,9,
   11,6,10,
   2,1,6,
   2,7,3,
   3,8,4,
   4,9,5,
   5,10,1,
   6,7,2,
   7,8,3,
   8,9,4,
   9,10,5,
   10,6,1
  ];
}
  
 // initialization

function init()
{
  // setup canvas and context
  canvas = document.getElementById('asteroid field 3d');
  context = canvas.getContext('2d');
  
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  window.addEventListener('resize', resize);

  // initialze variables  
  buildVerts();
  
  // build asteroidds
  SetupAsteriods();
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
  shieldUp^=1;
  splutterCount = 30;
  splutterNoise = 60;
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
var phi = Math.PI*0.5;
var theta = 0;

function renderIcosahedron()
{
   var scale = 512/canvas.height;
   phi+=0.009;
   theta+=0.01;
   var transforms = [];
   var cphi = Math.cos(phi);
   var sphi = Math.sin(phi);

   var ctheta = Math.cos(theta);
   var stheta = Math.sin(theta);
   
   // transform into 3d coords
   for (var i=0; i<icosahedronVerts.length; i++)
   {
      var vert = icosahedronVerts[i];
      var tz = vert.z * ctheta + vert.y * stheta;
      var ty = vert.y * ctheta - vert.z * stheta;
      // rotate phi 
      var tx = vert.x * cphi - ty * sphi;
          ty = ty * cphi + vert.x * sphi;
     
      // pixel depth using a long focal distance to ensure all set is in focus
      var depth = focalPoint*5 / ((tz + 5*scale) +1);
      var x1 = tx*depth+centreX;
      var y1 = ty*depth+centreY;
     transforms.push(  {x:x1, y:y1, z:tz} );
     
   }
  
   for (var i=0; i<icosahedronTris.length;i+=3)
   {
      var a = icosahedronTris[i];
      var b = icosahedronTris[i+1];
      var c = icosahedronTris[i+2];
      // back face cull
      var dx1 = transforms[b].x - transforms[a].x;
      var dy1 = transforms[b].y - transforms[a].y;
      var dx2 = transforms[b].x - transforms[c].x;
      var dy2 = transforms[b].y - transforms[c].y;
      var cross = (dx1*dy2 - dy1*dx2);
      if (cross < 0) continue;
      // use cross product normal to reflect light
      var shade = Math.floor(Math.sqrt(cross)*scale)+10;

     // fill the triangle
      context.beginPath();
      context.moveTo(transforms[a].x, transforms[a].y);
      context.lineTo(transforms[b].x, transforms[b].y);
      context.lineTo(transforms[c].x, transforms[c].y);
      context.closePath();
      context.fillStyle = 'rgba('+shade+','+shade+','+shade+',1)';
      context.fill();
      // edge it in red for fun
      context.lineWidth = 2;
      context.strokeStyle = 'rgba('+(shade>>4)+','+(shade>>4)+','+(shade>>4)+', 1)';
      context.stroke();
   }
}

var spin =0;
function renderShield()
{
  
   var phi = Math.PI*0.5;
   var theta = spin;
   var transforms = [];
   var cphi = Math.cos(phi);
   var sphi = Math.sin(phi);

   var ctheta = Math.cos(theta);
   var stheta = Math.sin(theta);
   
   // transform into 3d coords
   for (var i=0; i<icosahedronVerts.length; i++)
   {
      var vert = icosahedronVerts[i];
      var tz = vert.z * ctheta + vert.y * stheta;
      var ty = vert.y * ctheta - vert.z * stheta;
      // rotate phi 
      var tx = vert.x * cphi - ty * sphi;
          ty = ty * cphi + vert.x * sphi;
     
      // pixel depth using a long focal distance to ensure all set is in focus
      var depth = 1200 / ((tz + 0.2*256/canvas.height) +1);
      var x1 = tx*depth+centreX;
      var y1 = ty*depth+centreY;
     transforms.push(  {x:x1, y:y1, z:tz} );
     
   }
  
   for (var i=0; i<icosahedronTris.length;i+=3)
   {
      var a = icosahedronTris[i];
      var b = icosahedronTris[i+1];
      var c = icosahedronTris[i+2];
      // back face cull
      var dx1 = transforms[b].x - transforms[a].x;
      var dy1 = transforms[b].y - transforms[a].y;
      var dx2 = transforms[b].x - transforms[c].x;
      var dy2 = transforms[b].y - transforms[c].y;
      var cross = (dx1*dy2 - dy1*dx2);
      if (cross > 0) continue;
      // use cross product normal to reflect light
      var shade = Math.floor(Math.sqrt(-cross));

     // fill the triangle
      context.beginPath();
      context.moveTo(transforms[a].x, transforms[a].y);
      context.lineTo(transforms[b].x, transforms[b].y);
      context.lineTo(transforms[c].x, transforms[c].y);
      context.closePath();
      context.fillStyle = 'rgba('+0+','+shade+','+0+',0.25)';
      context.fill();
      // edge it in red for fun
      context.lineWidth = 1;
      context.strokeStyle = 'rgba('+0+','+shade+','+0+', 0.1)';
      context.stroke();
   }
}

function render()
{
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height); 


  context.globalCompositeOperation='source-over';
  RenderAsteriods();

  context.globalCompositeOperation='lighter';
  splutterNoise++;
  spin+=0.01;
  if (splutterCount) splutterCount--;
  var splutter = splutterNoise&splutterCount;
  if ( shieldUp & !splutter) renderShield();

  context.globalCompositeOperation='source-over';

  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('Icosahedron', canvas.width/2, 20);

  context.font = '14pt Calibri';
  context.fillText('(mouse button to Shield Up)', canvas.width/2, 40);

}

// movement functions

function update()
{ 
  UpdateAsteriods();
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
animate();
