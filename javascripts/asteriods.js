
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
// constants
const focalDepth = 80;
const focalPoint = 256;
const maxAsteriods = 32;


// variables
var shieldUp;
var splutterCount=0;
var splutterNoise=60;
var canvas;
var context;
var localSpace = 0;

// asteriods 
var asteriods = [];

function SetupAsteriods(space)
{
  localSpace = space;
  asteriods = [];
  for (var i=0; i<maxAsteriods; i++)
  {
     asteriods.push(new Asteriod(space))
  }
}

function SpawnAsteriodsAt(loc)
{
  for (var i=0; i<8; i++)
  {
    var roid = new Asteriod(localSpace);
    roid.x = loc.x;
    roid.y = loc.y;
    roid.z = loc.z;
    roid.force.x = Math.random()*2-1;
    roid.force.y = Math.random()*2-1;
    roid.force.z = Math.random()*2-1;
    asteriods.push(roid);
  }
}

function RenderAsteriods()
{
  context.globalCompositeOperation='source-over';

  for (var i=0; i<asteriods.length;i++)
  {
    asteriods[i].render();
  }
}

function CompareRoids(a,b)
{
  return b.z - a.z;
}

function UpdateAsteriods()
{
  for (var i=0; i<asteriods.length;i++)
  {
    asteriods[i].update();
  }

 // should really broadphase but 32x32 checks is not awful
 /* no collisons
  for (var i=0; i<asteriods.length;i++)
  {
    var src = asteriods[i];
    for (var j=i+1; j<asteriods.length;j++)
    {
      var dst = asteriods[j];
      var dx = dst.x-src.x;
      var dy = dst.y-src.y;
      var dz = dst.z-src.z;
      if (dx*dx + dy*dy + dz*dz < 2)
      {
        dst.angVel.y*=-1;
        dst.angVel.p*=-1;

        src.angVel.y*=-1;
        src.angVel.p*=-1;
      }
    }
  }
  */
  // make sure roids sort amongst selfs
  asteriods.sort(CompareRoids);
}

function FragmentAsteriod(roid)
{
  if (roid.fragment == 2) return;
  chunk = new Asteriod();
  chunk.clone(roid);
  chunk.flatten((roid.fragment<<1));
  roid.flatten((roid.fragment<<1)+1);
  asteriods.push(chunk);
  
  // speed
  roid.angVel.p*=Math.PI*Math.random();
  chunk.angVel.p*=-Math.PI*Math.random();
  roid.angVel.y*=Math.PI*Math.random();
  chunk.angVel.y*=-Math.PI*Math.random();
  roid.angVel.r*=Math.PI*Math.random();
  chunk.angVel.r*=-Math.PI*Math.random();
}

function Asteriod()
{
  this.init();
}

Asteriod.prototype.init = function()
{
  this.fragment = 0;
  this.shieldsHit = false;
  this.asteroidVerts = [];
  
  this.x = Math.random()*localSpace-localSpace*0.5;
  this.y = Math.random()*localSpace-localSpace*0.5;
  this.z = Math.random()*localSpace-localSpace*0.5;

  this.force = {x:0, y:0, z:0};
  
  this.angVel = {y:(Math.random()-0.5)*Math.PI/120, p:(Math.random()-0.5)*Math.PI/120, r:(Math.random()-0.5)*Math.PI/120};
  this.rotation = new matrix3x3();
  
  // fetch the icosahedron data and morph it
  for (var i=0; i< icosahedronVerts.length; i++)
  {
    var deform = Math.random()*1.0-0.5;
    var x = (icosahedronVerts[i].x + icosahedronVerts[i].x * deform) * 1;
    var y = (icosahedronVerts[i].y + icosahedronVerts[i].y * deform) * 1;
    var z = (icosahedronVerts[i].z + icosahedronVerts[i].z * deform) * 1;
    this.asteroidVerts[i] = {x:x, y:y, z:z};
  }

}

Asteriod.prototype.clone = function(roid)
{   
  this.x = roid.x;
  this.y = roid.y;
  this.z = roid.z;
  
  this.angVel = {y:roid.angVel.y, p:roid.angVel.p, r:roid.angVel.r};
  this.rotation.clone(roid.rotation);
  
  // fetch the icosahedron data and morph it
  for (var i=0; i< icosahedronVerts.length; i++)
  {
    this.asteroidVerts[i] = {x:roid.asteroidVerts[i].x, y:roid.asteroidVerts[i].y, z:roid.asteroidVerts[i].z};
  }
}

Asteriod.prototype.flatten = function(side)
{
  this.fragment = (side>>1)+1;

  for (var i=0; i< icosahedronVerts.length; i++)
  {
    if (this.asteroidVerts[i].z>0 && side==0) this.asteroidVerts[i].z=0; 
    if (this.asteroidVerts[i].z<0 && side==1) this.asteroidVerts[i].z=0; 
    if (this.asteroidVerts[i].y>0 && side==2) this.asteroidVerts[i].y=0; 
    if (this.asteroidVerts[i].y<0 && side==3) this.asteroidVerts[i].y=0; 
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
  
  this.x += this.angVel.p + this.force.x*freqHz;
  this.y += this.angVel.r + this.force.y*freqHz;
  this.z += this.angVel.y + this.force.z*freqHz;

  // update collision
  var x = modulo2(localPosition.x - this.x, localSpace)-localSpace*0.5;
  var y = modulo2(localPosition.y - this.y, localSpace)-localSpace*0.5;
  var z = modulo2(localPosition.z - this.z, localSpace)-localSpace*0.5;

  // check shields
  if (x*x+y*y+z*z< shieldRange*shieldRange)
  {
    this.shieldsHit = true;
  }
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
      
      var x = modulo2(localPosition.x - this.x, localSpace)-localSpace*0.5;
      var y = modulo2(localPosition.y - this.y, localSpace)-localSpace*0.5;
      var z = modulo2(localPosition.z - this.z, localSpace)-localSpace*0.5;

      t.x += x;
      t.y += y;
      t.z += z;

      t = orientation.transform(t.x, t.y, t.z);
      
     
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
      var z = transforms[b].z <1 ? 1:transforms[b].z;
      // use cross product normal to reflect light, well its not really a true cross product but a scalar magnitude
      var shade = Math.min(Math.floor(Math.sqrt(cross * z)*scale)+25, 255);

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
  canvas = document.getElementById('star-raiders');
  context = canvas.getContext('2d');

  // initialze variables  
  buildVerts();
  
  // build asteroidds
  SetupAsteriods();

  window.shieldUp = shieldUp;
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

var shieldFlashTimer = 0
var shieldFlashX = 0;
var shieldFlashY = 0;
function shieldFlash(x, y)
{
  shieldFlashX = x;
  shieldFlashY = y;
  shieldFlashTimer = 30;
}

var spinX =0;
var spinY
function renderShield()
{
   splutterNoise++;
   spindx = angleX-spinX;
   spinX+=spindx*0.1;
   spindy = angleY-spinY;
   spinY+=spindy*0.1;
   
   if (splutterCount) splutterCount--;
   var splutter = splutterNoise&splutterCount;
   var shieldFlashCol = 0;
   var shadeAlpha = 0.1;
   if (shieldFlashTimer)
   {
      shieldFlashCol = Math.floor(shieldFlashTimer/30.0 * 255);
      shadeAlpha = 1.0;
      shieldFlashTimer--;
   }

   if ( shieldUp & !splutter)
   {
       context.globalCompositeOperation='lighter';

       var phi = Math.PI*0.5;
       var theta = spinX;
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
          context.fillStyle = 'rgba('+shieldFlashCol+','+shade+','+shieldFlashCol+',0.25)';
          context.fill();
          // edge it in red for fun
          context.lineWidth = 1;
          context.strokeStyle = 'rgba('+shieldFlashCol+','+shade+','+shieldFlashCol+','+shadeAlpha+')';
          context.stroke();
       }

       context.globalCompositeOperation='source-over';
  }
}

// entry point
init();

window.shieldFlash = shieldFlash;
window.RenderAsteriods = RenderAsteriods;
window.UpdateAsteriods = UpdateAsteriods;
window.FragmentAsteriod = FragmentAsteriod;
window.renderShield = renderShield;


})();