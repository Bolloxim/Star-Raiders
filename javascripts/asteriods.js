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

function RenderAsteriods()
{
  context.globalCompositeOperation='source-over';

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
  
  this.x = Math.random()*localSpace-localSpace*0.5;
  this.y = Math.random()*localSpace-localSpace*0.5;
  this.z = Math.random()*localSpace-localSpace*0.5;
  
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
      var z = transforms[b].z;
      if (z<1) z=1;
      // use cross product normal to reflect light, well its not really a true cross product but a scalar magnitude
      var shade = Math.min(Math.floor(Math.sqrt(cross * transforms[b].z)*scale)+25, 255);

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
   splutterNoise++;
   spin+=0.01;
   if (splutterCount) splutterCount--;
   var splutter = splutterNoise&splutterCount;
   if ( shieldUp & !splutter)
   {
       context.globalCompositeOperation='lighter';

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

       context.globalCompositeOperation='source-over';
  }
}

// entry point
init();

