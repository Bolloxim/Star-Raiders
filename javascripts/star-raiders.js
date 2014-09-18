
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
const eNone = 0;
const eGalacticScanner = 1;
const eLongRange = 2;
const eTargetComputer = 3;
const shieldRange = 5;

// end game scenerios
const aborted    = 0;
const destroyed  = 1;
const energyLost = 2;
const basesGone  = 3;
const allDead    = 4;
const playing    = 5;

var backgroundColor;
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
var cycleScalar   = 3; // 3 = 30 seconds. 
var targetBase   = 0;
var localSpaceCubed = 1024;
var lrScale         = {x:0, y:0};

var warpLocation = {x:0, y:0};
var warpAnim     = 0;
var warpLocked = false;
var warpEnergy = 0;
var energy = 9999;
var kills = 0;
var badDriving = 0;
var redAlertColor = 0;

// tracking computer
var trackingTarget = 0;
// ship damage
var shipDamage = {photons:false, engines:false, shields:false, computer:false, longrangescanner:false, subspaceradio:false};

// difficulty settings
var maxAsteroids = 32;
var maxNMEs = 8;
var noContact = true;
var noDeaths= true;

// needs moving
var targetComputer = false;
var trackingComputer = false;
var redTime = 0;
var redAlert = 0;

var shipOrientation = new matrix3x3();
var orientation = new matrix3x3();
var scannerView = new matrix3x3();
var angleX = 0;
var angleY = 0;

var nmes = [];
var gameDifficultyHitBox = 1.5;
var statistics = {rank:0, kills:0, difficulty:0, played:0, roidsFragmented:0, roidsHit:0, refuel:0, shieldsHit:0, bases:0, shipsHit:0, killTypes:[0,0,0,0], damaged:0, shots:0, deflects:0, jumped:0, jumpedEnergy:0, travelled:0, jumpCancelled:0, timePlayed:0, accuracy:0, energy:0, distance:0, endgames:[0,0,0,0,0]};
var totals = {rank:0, kills:0, difficulty:0, played:0, roidsFragmented:0, roidsHit:0, refuel:0, shieldsHit:0, bases:0, shipsHit:0, killTypes:[0,0,0,0], damaged:0, shots:0, deflects:0, jumped:0, jumpedEnergy:0, travelled:0, jumpCancelled:0, timePlayed:0, accuracy:0, energy:0, distance:0, endgames:[0,0,0,0,0]};


var currentBoardItem = null;
var pauseGame = false;
var titleScreen = true;
var attractMode = 0;
var bestRanks = [{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100},{rank:-1000, date:new Date(), percentile:100}];
var lastScore = {rank:-1000, date:new Date(), percentile:100};

var difficultyNames = ['Novice', 'Pilot', 'Warrior', 'Commander'];

// endgame event
var endGameTime;
var endGameEvent;
var endGameLastMessage;
var endGameRank;

// global ranking
var gameTotalPlays=0;
var gameHitsPerRanks = [];
// warp tunnel navigation at higher levels
var warpDeltaDistance = 0;

function UpdateAllTotals()
{
   // update end game data
   statistics.energy=statistics.refuel;
   statistics.energy+=9999-energy;
   statistics.kills=kills;
   
   var gameTime = currentTime - gameStart;
   var decimalTime = gameTime / 60000;
   statistics.timePlayed = decimalTime;
  
   if (statistics.shots == 0)
     statistics.accuracy = 0;
   else
     statistics.accuracy = ((statistics.deflects+statistics.roidsFragmented+statistics.roidsHit+statistics.shipsHit) / statistics.shots) * 100;
  
   totals.played++;
   totals.diffculty+=statistics.difficulty; // make array?
   totals.roidsFragmented += statistics.roidsFragmented;
   totals.roidsHit+=statistics.roidsHit;
   totals.refuel+=statistics.refuel;
   totals.shieldsHit+=statistics.shieldsHit;
   totals.shipsHit+=statistics.shipsHit;
   totals.killTypes[0]+=statistics.killTypes[0];
   totals.killTypes[1]+=statistics.killTypes[1];
   totals.killTypes[2]+=statistics.killTypes[2];
   totals.killTypes[3]+=statistics.killTypes[3];
   totals.damaged+=statistics.damaged;
   totals.shots+=statistics.shots;
   totals.deflects+=statistics.deflects;
   totals.jumped+=statistics.jumped;
   totals.jumpedEnergy+=statistics.jumpedEnergy;
   totals.travelled+=statistics.travelled;
   totals.jumpCancelled+=statistics.jumpCancelled;
   totals.energy+=statistics.energy;
   totals.kills+=statistics.kills;
   totals.timePlayed+=statistics.timePlayed;
   totals.distance+=statistics.distance;
   totals.endgames[0]+=statistics.endgames[0];
   totals.endgames[1]+=statistics.endgames[1];
   totals.endgames[2]+=statistics.endgames[2];
   totals.endgames[3]+=statistics.endgames[3];
   totals.endgames[4]+=statistics.endgames[4];
  
   if (totals.shots == 0) 
     totals.accuracy = 0;
   else
    totals.accuracy = ((totals.deflects+totals.roidsFragmented+totals.roidsHit+totals.shipsHit) / totals.shots) * 100;

}

// difficulty setup, novice , pilot, warrior, commander
function ClearGame()
{
  // clear stats
  statistics = {kills:0, difficulty:0, played:0, roidsFragmented:0, roidsHit:0, refuel:0, shieldsHit:0, bases:0, shipsHit:0, killTypes:[0,0,0,0], damaged:0, shots:0, deflects:0, jumped:0, jumpedEnergy:0, travelled:0, jumpCancelled:0, timePlayed:0, accuracy:0, energy:0, distance:0, endgames:[0,0,0,0,0]};
  shipDamage = {photons:false, engines:false, shields:false, computer:false, longrangescanner:false, subspaceradio:false};
  
  // clear ship details
  shipLocation = {x:0, y:0};
  shipPosition = {x:0, y:0};
  localPosition = {x:0, y:0, z:0};
  
  shipOrientation = new matrix3x3();
  orientation = new matrix3x3();
  scannerView = new matrix3x3();
  targetComputer = false;
  trackingComputer = false;
  redTime = 0;
  redAlert = 0;
  
   warpLocation = {x:0, y:0};
   warpAnim     = 0;
   warpLocked = false;
   warpEnergy = 0;
   energy = 9999;
   kills = 0;
   badDriving = 0;
   redAlertColor = 0;
  
   setShieldUp(false);
}


function SetupNMEs(boardItem)
{
  // clear list
  nmes = [];
  currentBoardItem = boardItem;
  if (boardItem == null) return;
  noContact = true; 
  noDeaths = true;
  for (var i=0; i<boardItem.numTargets; i++)
  {
     var nme = new NME();
     nme.randomize(boardItem.targets[i]);
     nmes.push(nme);
  }
 
  if (boardItem.type != base) SetRedAlert();
}

function UpdateNMEs()
{

  for (var i=0; i<nmes.length; i++)
  {
     if (nmes[i].hitpoints)
     {
       var x = nmes[i].pos.x + nmes[i].vel.x * nmes[i].speed * freqHz;
       var y = nmes[i].pos.y + nmes[i].vel.y * nmes[i].speed * freqHz;
       var z = nmes[i].pos.z + nmes[i].vel.z * nmes[i].speed * freqHz;

       nmes[i].pos.x = x;
       nmes[i].pos.y = y;
       nmes[i].pos.z = z;
       
        switch(nmes[i].type)
        {
          case fighter:
            ZylonFighterAI(nmes[i]);
            break;
          case base:
          {
             // compute distance
             var delta = nmes[i].delta();
             var t = orientation.transform(delta.x, delta.y, delta.z);

             // compute angles
             var phi = Math.atan2(t.x, t.z);
             var theta = Math.atan2(t.y, Math.sqrt(t.x*t.x+t.z*t.z));
             var a = Math.abs(gradon(phi));
             var b = Math.abs(gradon(theta));
             var dock = (a <= 1 && b <= 1 && t.z <= 5) ? true:false;

             EnableDocking(dock);
             break;
          }
          case cruiser:
            ZylonCruiserAI(nmes[i]);
            break;
          case basestar:
            ZylonBaseStarAI(nmes[i]);
            break;
            
          default:
            ZylonFighterAI(nmes[i]);
            break;
         }
    }
  }
}


function nmeShoot(pos)
{
    var scale =512/canvas.height;
  
    var x = modulo2(localPosition.x - pos.x, localSpaceCubed)-localSpaceCubed*0.5;
    var y = modulo2(localPosition.y - pos.y, localSpaceCubed)-localSpaceCubed*0.5;
    var z = modulo2(localPosition.z - pos.z, localSpaceCubed)-localSpaceCubed*0.5;

    var t = orientation.transform(x, y, z);
    if (Math.abs(t.z)>128) return;
  
    var depth = focalPoint*5 / ((t.z + 5*scale) +1);
    if (depth<0) depth *= -1;

    var depthInv = focalPoint / ((t.z + focalDepth) +1);
    setSpawn((t.x*depth)/depthInv+centreX, (t.y*depth)/depthInv+centreY, t.z);

    getPlasmaEmitter().create();
    PlayDisruptor();
    // escalate
    noContact = false;
}

function ZylonFighterAI(nme)
{
var targetLocations = [{x:0, y:0, z:-70},{x:10, y:-10, z:-100},{x:-20, y:30, z:-50},{x:0, y:0, z:70},{x:20, y:10, z:50},{x:-30, y:10, z:30}];
   var targ = shipOrientation.invtransform(targetLocations[nme.target].x,targetLocations[nme.target].y,targetLocations[nme.target].z);
   var dir = nme.targetPoint(targ);
   // always swarm player
//   var dir = nme.deltaAhead(-100);
   // we want to go that way
   var dirn = new vector3(dir.x, dir.y, dir.z);
   dirn.normalize();
   var dx = nme.vel.x - dirn.x;
   var dy = nme.vel.y - dirn.y;
   var dz = nme.vel.z - dirn.z;
   nme.vel.x+=dirn.x*0.1;   
   nme.vel.y+=dirn.y*0.1;
   nme.vel.z+=dirn.z*0.1;
     var tmp = new vector3(  nme.vel.x,   nme.vel.y,   nme.vel.z);
   tmp.normalize();
  nme.vel.x = tmp.x;
  nme.vel.y = tmp.y;
  nme.vel.z = tmp.z;
  
  if (dir.lengthSquared()<25) 
  {
    nme.pass = (nme.pass+1) &63;
    if (nme.pass == 0)
        nme.target = (nme.target+1) % targetLocations.length;
  }
  nme.calcypr(); 
  var shotEnergy = 5 - (0.5 * gameDifficulty);
  nme.energy = Math.min(shotEnergy, nme.energy+freqHz);
  var canFire = Math.random() > 0.99;
  // randomize fire
  if (endGameEvent==playing && nme.energy>=shotEnergy && canFire)
  {
    nme.energy-=shotEnergy;
    nmeShoot(nme.pos);
  }
}

function ZylonCruiserAI(nme)
{
   var targetLocations = [{x:0, y:0, z:-70},{x:10, y:-10, z:100},{x:-20, y:30, z:-50},{x:0, y:0, z:70},{x:20, y:10, z:-50},{x:-30, y:10, z:40}];
   var targ = shipOrientation.invtransform(targetLocations[nme.target].x,targetLocations[nme.target].y,targetLocations[nme.target].z);
   var dir = nme.targetPoint(targ);
   if  (dir.lengthSquared() > 400*400 && noContact==true) dir = dir.mul(-1);
   // always swarm player
  //   var dir = nme.deltaAhead(-100);
   // we want to go that way
   var dirn = new vector3(dir.x, dir.y, dir.z);
   dirn.normalize();
   var dx = nme.vel.x - dirn.x;
   var dy = nme.vel.y - dirn.y;
   var dz = nme.vel.z - dirn.z;
   nme.vel.x+=dirn.x*0.1;   
   nme.vel.y+=dirn.y*0.1;
   nme.vel.z+=dirn.z*0.1;
   var tmp = new vector3(  nme.vel.x,   nme.vel.y,   nme.vel.z);
   tmp.normalize();
    nme.vel.x = tmp.x;
    nme.vel.y = tmp.y;
    nme.vel.z = tmp.z;
  
  if (dir.lengthSquared()<25) 
  {
    nme.pass = (nme.pass+1) &63;
    if (nme.pass == 0)
        nme.target = (nme.target+1) % targetLocations.length;
  }
  nme.calcypr(); 
  
  var shotEnergy = 4 - (0.5 * gameDifficulty);
  nme.energy = Math.min(shotEnergy*2, nme.energy+freqHz);
  var canFire = Math.random() > 0.97;
  // randomize fire
  if (endGameEvent==playing && nme.energy>=shotEnergy && canFire)
  {
    nme.energy-=shotEnergy;
    nmeShoot(nme.pos);
  }
}

function ZylonBaseStarAI(nme)
{
   var targetLocations = [{x:30, y:0, z:-70},{x:0, y:-30, z:-80},{x:-30, y:00, z:-50},{x:0, y:30, z:-70},{x:40, y:40, z:70},{x:-40, y:40, z:60},{x:-40, y:-40, z:90},{x:40, y:-40, z:40}];
   var targ = shipOrientation.invtransform(targetLocations[nme.target].x,targetLocations[nme.target].y,targetLocations[nme.target].z);
   var dir = nme.targetPoint(targ);
   if  (dir.lengthSquared() > 300*300 && noDeaths==true) dir=dir.mul(-1);
   // always swarm player
  //   var dir = nme.deltaAhead(-100);
   // we want to go that way
   var dirn = new vector3(dir.x, dir.y, dir.z);
   dirn.normalize();
   var dx = nme.vel.x - dirn.x;
   var dy = nme.vel.y - dirn.y;
   var dz = nme.vel.z - dirn.z;
   nme.vel.x+=dirn.x*0.1;   
   nme.vel.y+=dirn.y*0.1;
   nme.vel.z+=dirn.z*0.1;
   var tmp = new vector3(  nme.vel.x,   nme.vel.y,   nme.vel.z);
   tmp.normalize();
    nme.vel.x = tmp.x;
    nme.vel.y = tmp.y;
    nme.vel.z = tmp.z;
  
  if (dir.lengthSquared()<25) 
  {
    nme.pass = (nme.pass+1) &63;
    if (nme.pass == 0)
        nme.target = (nme.target+1) % targetLocations.length;
  }
  nme.calcypr(); 
  var shotEnergy = 5 - (0.5 * gameDifficulty);
  nme.energy = Math.min(shotEnergy*4, nme.energy+freqHz);
  var canFire = Math.random() > 0.95;
  // randomize fire
  if (endGameEvent==playing && nme.energy>=shotEnergy && canFire)
  {
    nme.energy -= shotEnergy;
    nmeShoot(nme.pos);
  }
}


function DestroyStarbase()
{
    // verify base
    if (nmes[0].type == base) 
    {
       // detroy base
       SpawnAsteroidsAt(nmes[0].pos);
       setSpawn(nmes[0].pos.x, nmes[0].pos.y, nmes[0].pos.z);
       getExplodeEmitter().create();
       getDustEmitter().create();
       PlayExplosion();
    }
}

function RenderNMEs()
{
  for (var i=0; i<nmes.length; i++)
  {
     if (nmes[i].hitpoints>0)
         nmes[i].render();
  }
}

function KillNmeType(shipType)
{
  if (shipType == base) DestroyStarbase();
  
  kills++;
  statistics.killTypes[shipType]++;
  // update board item
  currentBoardItem.killTarget(shipType);
  // escalate
  noContact = false;
  noDeaths = false;
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
  this.hitpoints = 0;
  this.target = 0;
  this.pass = 0;
  this.energy = 0;
  
  this.theta = 0;
  this.phi = 0;
}

NME.prototype.randomize = function(type)
{
  var hitpointTable = [4, 1, 1, 2];
  
  this.pos.x = Math.random()*localSpaceCubed;
  this.pos.y = Math.random()*localSpaceCubed;
  this.pos.z = Math.random()*localSpaceCubed;
  
  if (type!=base)  this.vel = RandomNormal();

  this.type = type;
  
  this.speed = 25;
  this.hitpoints = hitpointTable[type];
}

NME.prototype.delta = function()
{
   var x = modulo2(localPosition.x - this.pos.x, localSpaceCubed)-localSpaceCubed*0.5;
   var y = modulo2(localPosition.y - this.pos.y, localSpaceCubed)-localSpaceCubed*0.5;
   var z = modulo2(localPosition.z - this.pos.z, localSpaceCubed)-localSpaceCubed*0.5;
   return {x:x, y:y, z:z};
}

NME.prototype.targetPoint = function(target)
{
   var x = modulo2((localPosition.x+target.x) - this.pos.x, localSpaceCubed)-localSpaceCubed*0.5;
   var y = modulo2((localPosition.y+target.y) - this.pos.y, localSpaceCubed)-localSpaceCubed*0.5;
   var z = modulo2((localPosition.z+target.z) - this.pos.z, localSpaceCubed)-localSpaceCubed*0.5;
   return new vector3(x, y, z);
}

NME.prototype.calcypr = function()
{
   this.theta = Math.atan2(this.vel.x, this.vel.z) ;//+ Math.PI*0.5;
   this.phi = 0;//Math.asin(this.vel.y);
}

NME.prototype.render = function()
{
   var x = modulo2(localPosition.x - this.pos.x, localSpaceCubed)-localSpaceCubed*0.5;
   var y = modulo2(localPosition.y - this.pos.y, localSpaceCubed)-localSpaceCubed*0.5;
   var z = modulo2(localPosition.z - this.pos.z, localSpaceCubed)-localSpaceCubed*0.5;

   var camspace = orientation.transform(x, y, z);
   switch(this.type)
     {
       case base:
          var scale = 512/canvas.height;
          var depth = focalPoint*5 / camspace.z + 5*scale;
          var sx = camspace.x * depth + centreX;
          var sy =camspace.y * depth + centreY;
          var sz = 1 * depth;

          if (camspace.z>0) RenderStarbase(sx, sy, sz, Math.atan2(camspace.z, camspace.y)+Math.PI);
          break;
       case fighter:
          renderZylon(camspace.x, camspace.y, camspace.z, this.theta, this.phi);
          break;
       case cruiser:
          var scale = 512/canvas.height;
          var depth = focalPoint*5 / camspace.z + 5*scale;
          var sx = camspace.x * depth + centreX;
          var sy = camspace.y * depth + centreY;
          var sz = 0.5 * depth;
          if (sz<=0) return;
  
          var fade = 1.0;
          if (camspace.z>128)  fade = 1.0 - (camspace.z-128)/128;
          if (fade<0) fade = 0;
          context.globalAlpha = fade;
          if (camspace.z>0) RenderCruiser(sx, sy, sz, Math.atan2(camspace.y, camspace.z)+Math.PI*1.5);
          break;
       case basestar:
          var scale = 512/canvas.height;
          var depth = focalPoint*5 / camspace.z + 5*scale;
          var sx = camspace.x * depth + centreX;
          var sy = camspace.y * depth + centreY;
          var sz = 1 * depth;
         
          if (sz<=0) return;
          var fade = 1.0;
          if (camspace.z>128)  fade = 1.0 - (camspace.z-128)/128;
          if (fade<0) fade = 0;
          context.globalAlpha = fade;
         
         
          if (camspace.z>0) RenderBasestar(sx, sy, sz, Math.atan2(camspace.z, camspace.y)+Math.PI);
          break;
       default:
          renderZylon(camspace.x, camspace.y, camspace.z, 0, 0);
          break;
     }

}

var docking;
var dockTimer;

function EnableDocking(dock)
{
   if (dock && !docking)
   {
     docking = true;
     startText("docked with starbase: transfering...", border.x, 150);
     dockTimer = (new Date()).getTime()+5000;
   }
  
   if (!dock && docking)
   {
     docking = false;
     if (energy<9900)
       startText("docking aborted!", border.x, 150);
     else
       startText("undocked starbase", border.x, 150);
   }
  
   if (docking && dockTimer<(new Date()).getTime())
   {
      // refuel
      statistics.refuel += 9999-energy;
      energy = 9999;
      dockTimer+=100000;
      startText("transfer completed", border.x, 150);
   }
}

function SetRedAlert()
{
   redTime = (new Date()).getTime();
   PlayRedAlert(0.5);
}

function DrawRedAlert()
{

    var delta = (new Date()).getTime() - redTime;
    redAlert = delta<=4000;
    if (redAlert == false)
    {
      document.getElementById("star-raiders").style.background = 'black';
      backgroundColor = 'rgb(0,0,0)';
      starsColorAlias = backgroundColor;
      return;
    }

    redAlertColor = (Math.floor(delta/500) & 1)*64;
    context.globalAlpha = 1.0;
    context.font = '40pt Orbitron';
    context.fillStyle = 'rgb('+(redAlertColor*3^192)+',0,'+redAlertColor*3+')';
    context.textAlign = "center";
    context.fillText('RED ALERT', canvas.width/2, 50);
    
    backgroundColor = 'rgb('+((redAlertColor))+',0,'+((redAlertColor^64))+')';
    starsColorAlias = backgroundColor;
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
  context.lineWidth = 1;
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

  // render Asteroids
  var s = (radius/canvas.width) * 1.3;
  var asteroids = getAsteroids();

  // I think a matrix is now going to be faster..    
  for (var i=0; i<asteroids.length; i++)
  {
      var x = modulo(localPosition.x - asteroids[i].x)-512;
      var y = modulo(localPosition.y - asteroids[i].y)-512;
      var z = modulo(localPosition.z - asteroids[i].z)-512;

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
     if (nmes[i].hitpoints<=0) continue;
    
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
  clampX = warpLocation.x*mapScale.x+border.x;
  clampY = warpLocation.y*mapScale.y+border.y;
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
  window.AudioContext = window.AudioContext||window.webkitAudioContext;
  audioContext = new AudioContext();
  
  // init parse
  Parse.initialize("QiC9M2aTG3f4OpldOxdbav1VAwDuwDIX65GyBmYe", "RMg2Xv02FXTXu3d1UfiMeTsYbotrH4oSB7Pcbvyi");
  // track views
  var details = { Width:''+canvas.width, Height:''+canvas.height, Browser:window.navigator.userAgent};
  
  Parse.Analytics.track('Viewed', details);

  // audio
  initAudio();
  // load cookies
  // emergency delete
  //  DeleteCookie("lastScore");
  // DeleteCookie("bestRanks");
  LoadRanks();
  // load stats from local store
  LoadStats();
  // start game
//  StartGame(novice);
  // init title
  TitleScreen();
  
}

function TitleScreen()
{
  clearTitleClick = true;
  // init engine sounds
  StopEngine();
  // enable title
  titleScreen = true;
  // credit time
  titleStartTime = new Date().getTime();
  
  // clear text
  clearText();

  // populate local space
  SetupAsteroids(localSpaceCubed*0.25);
  SetupTitleButtons();

  // override
  setWarpSpread(2);
  
  // have starfield not track mouse
  setTrackingMouse(false);
  
  // set scroller
  setInitVelocity(-1.0);
  setTermVelocity(-10.0);
  
  // fetch ranks
  CacheGlobalRankings();
}
  
function StartGame(difficulty)
{
  // remove titlescreen
  titleScreen = false;
  clearTitleClick = false;
  endGameEvent = playing;
  
  // log
  Parse.Analytics.track('Started', {difficulty:difficultyNames[difficulty]});
  
  // initialze variables  
  ClearGame();
  
  //
  SetShipLocation(galaxyMapSize.x*0.5, galaxyMapSize.y*0.5);

  // initial ping
  shipPing.x = shipPosition.x;
  shipPing.y = shipPosition.y;
  
  // buttons
  SetupButtons();
  
  // populate map
  BoardSetup(difficulty);
  
  // populate local space
  SetupAsteroids(localSpaceCubed);
 
  // populate shiplocation
  SetupNMEs(GetPieceAtShipLocation());
  
  var d = new Date();
  gameStart = d.getTime();
  
  // override
  setWarpSpread(2);
  // track mouse
  setTrackingMouse(true);
  // init engine sounds
  InitEngine();
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
  if (clearTitleClick==false) return;
  if (CheckButtons(mouseX, mouseY, false) == true) return;
  
  if (event.which&1)
  {
      dragging = true;
      DragEventStart(event);
   }
}

function mouseUp(event)
{
  clearTitleClick=true;
  if (event.which&1 && dragging)
  {
      DragEventDone(event);
  }
} 

function mouseClick()
{
   buttonpressed = CheckButtons(mouseX, mouseY, true);
   if (buttonpressed || endGameEvent!=playing)
   {
     return;
   }
  
   if (titleScreen==true) return;
 
   if (overlayMode == eNone || overlayMode == eTargetComputer)
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
   var maxWidth = window.innerWidth;
   var maxHeight = window.innerHeight;
   canvas.width = maxWidth;
   canvas.height = maxHeight;
 /* 
   var width  = maxWidth;
   var height = maxWidth * 9 / 22;
  
  
   canvas.style.display = 'block';
   canvas.style.position = 'fixed';
   canvas.style.left = '0px';
   canvas.style.top  = (( maxHeight - height) / 2) + 'px';
  
  if (height > maxHeight) 
  {
    height = maxHeight;
    width  = maxHeight * 22 / 9;
    canvas.style.left = ((maxWidth - width) / 2) + 'px';
    canvas.style.top  = '0px';
  }
  
  canvas.width = width;
  canvas.height = height;
  */
    // compute centre of screen
  centreX = canvas.width/2;
  centreY = canvas.height/2;
  fontsize = 21;
  
  // resize font based on canvas size
  
  mapScale.x = canvas.width/(galaxyMapSize.x+6);
  mapScale.y = canvas.height/(galaxyMapSize.y+3);
  border.x = mapScale.x*3;
  border.y = mapScale.y;
  
  
  lrScale.x = canvas.width*16/18;
  lrScale.y = canvas.height*16/20;
  
  do
  {
    fontsize-=0.1;
    context.font = fontsize + 'pt Orbitron';
    var fits = context.measureText('group');
  }while((fits.width+20>mapScale.x || mapScale.y<fontsize*4) && fontsize >5);

  // reset buttons
  if (titleScreen == true)
    SetupTitleButtons();
  else if (endGameEvent ==playing)
    SetupButtons();
  else
    SetupMainMenuButton();
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
  
  RenderWarpPoint();
  renderStarDate();
  renderVelocity();
  renderEnergy();
  renderKills();
}

function renderGalaxyInformation()
{
   var scaleX = mapScale.x;
   var scaleY = mapScale.y;
  
   var i = GetBoardPieceScreen(mouseX, mouseY);
   var targets = 'empty';
   if (i>0 && boardPieces[i].status!=0)
   {
      targets = boardPieces[i].numTargets;
      if (boardPieces[i].type==base) targets = 'starbase';
   }
  
   // render timer
    var piece = boardPieces[targetBase];
    if (piece.nextMove!=0)
    {
      var x = piece.location.x*scaleX+border.x+mapCentreX;
      var y = piece.location.y*scaleY+border.y+mapCentreY;
      var currentTime = (new Date()).getTime() ;
      var gameTime = Math.floor((currentTime - gameStart));
      var remainingTime= Math.floor((piece.nextMove * 10000 - gameTime) / 600);
      
      var segment = (Math.PI*2 * remainingTime / 100);
      context.beginPath();
      context.moveTo(x+scaleX*0.5, y+scaleY*0.5);
      context.arc(x+scaleX*0.5, y+scaleY*0.5, scaleX<scaleY?scaleY:scaleY, Math.PI*1.5-segment, Math.PI*1.5);
      context.fillStyle = 'rgba(255,0,0,0.7)';
      context.fill();
      context.strokeStyle = 'rgba(255,128,0,0.7)';
      context.stroke();
      
      context.globalAlpha = 1.0;
      context.font = '12pt Orbitron';
      context.fillStyle = 'rgb(255,128,0)';
      context.textAlign = "right";
      context.fillText('.' + Math.floor(remainingTime), x+scaleX*0.9, y+20);      
    }
  
    context.globalAlpha = 1.0;
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "left";
    context.fillText('Targets: ' + targets, border.x+mapCentreX, border.y+mapScale.y*8+24+mapCentreY);

    var fuel = ShipCalculateWarpEnergy(mouseX, mouseY);
   
    context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,0)';
    context.textAlign = "center";
    context.fillText('Warp Energy: ' + fuel, canvas.width/2+mapCentreX, border.y+mapScale.y*8+24+mapCentreY);
  
    if (warpLocked)
    {
      // does this in mouse coords for rollover.. so have to add the border back in
      var fuel = ShipCalculateWarpEnergy(warpLocation.x*mapScale.x+border.x, warpLocation.y*mapScale.y+border.y);
      warpEnergy = fuel;
      context.textAlign = "centre";
      context.font = '22pt Orbitron';
      context.fillStyle = 'rgb(0,0,255)';
      context.fillText('Energy: ' + fuel, warpLocation.x*mapScale.x+border.x+mapCentreX, warpLocation.y*mapScale.y+mapCentreY+border.y-12);
     
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
    var x = posx+mapCentreX;
    var y = posy+mapCentreY;
  
    context.beginPath();
    context.arc(x, y, scale*0.5, 0, Math.PI*2);
    context.strokeStyle = 'rgb(255,255,255)';
    context.lineWidth =1;
    context.stroke();
    context.moveTo(x, y-scale*1.5);
    context.lineTo(x-scale, y+scale*1.5);
    context.lineTo(x, y);
    context.lineTo(x+scale, y+scale*1.5);
    context.closePath();

    context.stroke();
}

function gradon(radian)
{
  return Math.floor(radian*100 / (Math.PI*2));
}

function leadPadding(value, num, sign)
{
  var padded = value>=0 ? (sign?'+':'') :'-';
  var absvalue = Math.abs(value);
  for (var i=1;i<num;i++)
  {
    padded += (absvalue<Math.pow(10,i)) ? "0":"";
  }
  return padded+absvalue;
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
      if (viewingFront())
      {
        context.moveTo(x, y-h/4);
        context.lineTo(x, y-h);
        context.moveTo(x, y+h/4);
        context.lineTo(x, y+h);
      }
      context.lineWidth = 7;
      context.strokeStyle = 'rgba(255,0,0,0.5)';
      context.stroke();
      context.lineWidth = 3;
      context.strokeStyle = 'rgba(255,0,0,1)';
      context.stroke();
  
      if (viewingFront())
      {
        var x1 = mapScale.x*16;
        var y1 = mapScale.y*8;
        var xw =border.x;
        var yh =mapScale.y*2;
        context.beginPath();
        context.rect(x1, y1, xw, yh);
        context.fillStyle = 'rgba(0,0,128,0.5)';
        context.fill();
        context.rect(x1+xw*0.25, y1+yh*0.25, xw*0.5, yh*0.5);     
        context.moveTo(x1, y1+yh*0.5);
        context.lineTo(x1+xw*0.25, y1+yh*0.5);
        context.moveTo(x1+xw*0.75, y1+yh*0.5);
        context.lineTo(x1+xw, y1+yh*0.5);
        context.moveTo(x1+xw*0.5, y1);
        context.lineTo(x1+xw*0.5, y1+yh*0.25);
        context.moveTo(x1+xw*0.5, y1+yh*0.75);
        context.lineTo(x1+xw*0.5, y1+yh);
        context.lineWidth = 4;
        context.strokeStyle = 'rgba(255,255,255,0.5)';
        context.stroke();
        
        // compute tracking position
        var distance = 0;
        var gradonTheta = 0;
        var gradonPhi = 0;
        
        if (trackingTarget>=0 && trackingTarget < nmes.length && nmes[trackingTarget].hitpoints)
        {
             var x = modulo2(localPosition.x - nmes[trackingTarget].pos.x, localSpaceCubed)-localSpaceCubed*0.5;
             var y = modulo2(localPosition.y - nmes[trackingTarget].pos.y, localSpaceCubed)-localSpaceCubed*0.5;
             var z = modulo2(localPosition.z - nmes[trackingTarget].pos.z, localSpaceCubed)-localSpaceCubed*0.5;
             
             var t = orientation.transform(x,y,z);
             distance = Math.round(Math.sqrt(t.x*t.x+t.y*t.y+t.z*t.z));
             if (t.z<0) distance*=-1;
             // compute angles
             var phi = Math.atan2(t.x, t.z);
             var rx1 = (modulo2(phi+Math.PI, Math.PI*2) / (Math.PI*2)) * (xw-30) + x1+15;
             var theta = Math.atan2(t.y, Math.sqrt(t.x*t.x+t.z*t.z));
             var ry1 = (modulo2(theta+Math.PI, Math.PI*2) / (Math.PI*2)) *2* (yh-15) + y1+15-yh*0.5;
          
             context.beginPath();
             context.rect(rx1-8, ry1-8, 16,16);
             context.rect(rx1-15, ry1-15, 5, 30);
             context.rect(rx1+10, ry1-15, 5, 30);
             context.fillStyle= 'yellow';
             context.fill();
          
             // convert to gradons
             gradonTheta = gradon(theta);
             gradonPhi = gradon(phi);
            
          }
        
          context.font = '20pt Orbitron';
          context.fillStyle = 'rgb(255,255,0)';
          context.textAlign = "left";
        
          context.fillText('T:'+trackingTarget, x1, canvas.height-15);
          
          context.fillText('R:'+leadPadding(distance,3, true), x1+xw*0.5, canvas.height-15);   
          context.fillText('Φ:'+leadPadding(gradonPhi,2, true), x1, y1-15);
          context.fillText('θ:'+leadPadding(gradonTheta,2, true), x1+xw*0.5, y1-15);   
        
      }
  
  if (trackingComputer && triggerWarp==normalSpace)
  {
     var aim = getWarpCentre();  
    
    var x = aim.x;
    var y = aim.y;
    var w = canvas.width/64;
    var h = canvas.height/64;

      context.beginPath();
      context.moveTo(x, y+h);
      context.lineTo(x+w, y);
      context.lineTo(x, y-h);
      context.lineTo(x-w, y);
      context.closePath();
    
      context.lineWidth = 7;
      context.strokeStyle = 'rgba(255,255,0,0.2)';
      context.stroke();
      context.lineWidth = 3;
      context.strokeStyle = 'rgba(255,255,0,0.8)';
      context.stroke();
  
  }
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
  context.fillText('StarDate: ' + leadingzero + decimalTime.toFixed(2), canvas.width-border.x+15, canvas.height-15);
}

function renderKills()
{
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "left";
  leadingzero = kills<10 ? '0':'';
  context.fillText('Kills: ' + leadingzero + kills, 15, canvas.height-15);
}

function renderVelocity()
{ 
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.textAlign = "right";
  leadingzero = shipVelocity<10 ? '0':'';
    context.textAlign = "right";
  context.fillText('Velocity: ', canvas.width-mapScale.x-40, 30);
    context.textAlign = "right";
  var intVel = Math.floor(shipVelocity);
  context.fillText(leadingzero + intVel, canvas.width-mapScale.x, 30);
      context.textAlign = "left";
  var fracVel = Math.floor((shipVelocity-intVel)*100);
  postZero = fracVel<10? '0':'';
    context.fillText('.' + fracVel + postZero, canvas.width-mapScale.x, 30);
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
 // RenderStarDome();
  renderStarfield();
  RenderAsteroids();
  RenderNMEs();
  RenderParticles();

  renderShield();
}

function RenderRanks()
{
   context.textAlign = "center";
   context.fillStyle = 'rgb(0,0,255)';
   context.font = '20pt Orbitron';
   context.fillText('Best Ranks', canvas.width/2, 150);

   for (var i=0; i<bestRanks.length; i++)
   {
       // update the last score percentile
      bestRanks[i].percentile = UpdatePercentile(bestRanks[i].rank);

      if ((i*50+180) < (canvas.height-90))
      {
        context.font = '20pt Orbitron';
        context.fillText('Rank: '+ rank(bestRanks[i].rank)+'  -  Ranked in top '+bestRanks[i].percentile.toFixed(1)+'%', canvas.width/2, 180+i*50);
        context.font = '12pt Orbitron';
        context.fillText('Date: '+ bestRanks[i].date, canvas.width/2, 200+i*50);
      }
   }
}

function RenderStatistics(stat, lastgame, fade)
{
  var x = canvas.width/2 - 500;
  var y = 150;
  var yinc = 20;
  context.lineWidth = 1;
  context.font = '20pt Orbitron';
  context.strokeStyle = 'rgba(0,255,0,'+fade+')';
  context.textAlign = 'left';
  context.strokeText(lastgame?'Last Game Stats':'All time stats', x, y);
  y+=20;
  context.fillStyle = 'rgba(255,0,0,'+fade+')';
  context.font = '14pt Orbitron';
  context.fillText('You Won : '+ stat.endgames[allDead], x, y+=yinc);
  context.fillText('You were destroyed: '+ stat.endgames[destroyed], x, y+=yinc);
  context.fillText('You run out of energy: '+ stat.endgames[energyLost], x, y+=yinc);
  context.fillText('All your bases gone: '+ stat.endgames[basesGone], x, y+=yinc);
  context.fillText('Manually Aborted: '+ stat.endgames[aborted], x, y+=yinc);
  context.fillText('Difficulty: '+ stat.difficulty, x, y+=yinc);
  context.fillText('Played: '+ stat.played, x, y+=yinc);

  context.fillText('Meteors Fragmented: '+ stat.roidsFragmented, x, y+=yinc);
  context.fillText('Meteors Destroyed: '+ stat.roidsHit, x, y+=yinc);  
  context.fillText('Refueled: '+ stat.refuel.toFixed(2), x, y+=yinc);
  context.fillText('Shots Fired: '+ stat.shots, x, y+=yinc);
  context.fillText('Shields Hit: '+ stat.shieldsHit, x, y+=yinc);
  context.fillText('Ships Hit: '+ stat.shipsHit, x, y+=yinc);
  context.fillText('Shots Hit: '+ stat.deflects, x, y+=yinc);
  context.fillText('Accuracy: '+ stat.accuracy.toFixed(2), x, y+=yinc);
  context.fillText('Starbases lost: '+ stat.bases, x, y+=yinc);
  context.fillText('Starbases killed: '+ stat.killTypes[0], x, y+=yinc);
  context.fillText('Fighters killed: '+ stat.killTypes[1], x, y+=yinc);
  context.fillText('Cruisers killed: '+ stat.killTypes[2], x, y+=yinc);
  context.fillText('Basestars killed: '+ stat.killTypes[3], x, y+=yinc);
  context.fillText('Times jumped: '+ stat.jumped, x, y+=yinc);
  context.fillText('Energy jumped: '+ stat.jumpedEnergy.toFixed(2), x, y+=yinc);
  context.fillText('Sectors jumped: '+ stat.travelled, x, y+=yinc);
  context.fillText('Jumps cancelled: '+ stat.jumpCancelled, x, y+=yinc);
  context.fillText('Damaged Systems: '+ stat.damaged, x, y+=yinc);
  context.fillText('Metrons Travelled: '+ stat.distance.toFixed(2), x, y+=yinc);
  context.fillText('Energy Used: '+ stat.energy.toFixed(2), x, y+=yinc);
}

function RenderInstructions()
{
  var time = new Date().getTime() - titleStartTime;
  var dt   = modulo2(time, 40000);
  if (dt<1000) 
      fade = dt/1000;
  else if (dt<10000)
      fade = 1;
  else if (dt>10000)
      fade = (11000-dt)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  
  context.fillStyle = 'rgba(255,64,0,'+fade+')';
    
  context.font = '20pt Orbitron';
  context.fillText('original game written by', canvas.width/2, 150);
  context.fillText('Respectfully rejuvenated by', canvas.width/2, 250);
  context.font = '30pt Orbitron';
  context.fillStyle = 'rgba(255,128,0,'+fade+')';
  context.fillText('Doug Neubauer, Atari, 1979', canvas.width/2, 200);
  context.fillText('Andi Smithers, 2014', canvas.width/2,300);
 
  context.font = '14pt Orbitron';
  context.fillStyle = 'rgba(0,128,0,'+fade+')';
  context.fillText('Version 0.93 beta', canvas.width/2, 360);
  context.fillText('todo: Damage/Destroyed systems', canvas.width/2, 380);

  
  fade = 0;
  if (dt>20000) 
      fade = (21000-dt)/1000;
  else if (dt>11000)
      fade = 1;
  else if (dt>10000)
      fade = (dt-10000)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) + 500;
  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "right";
  context.fillText('Instructions', x, 150);
  context.fillStyle = 'rgba(0,255,0,'+fade+')';
  context.fillText('Protect starbases from being destroyed', x, 180);
  context.fillText('Use Hyperspace chart to warp to a sector',x, 270);
  context.fillText('Clear all enemies in a sector to remove threat', x, 330);
  context.fillText('Use shields to defend against meteors and weapons', x,390);
  context.fillStyle = 'rgba(0,192,0,'+fade+')';
  context.fillText('Starbases are vunerable when surrounded', x, 210);
  context.fillText('Select sector with cross hair before warping',x, 300);
  context.fillText('Dock at starbases to replenish energy', x,360);
  context.fillText('Keep Warp Cursor Centred for optimal warp', x,420);
  
  fade = 0;
  if (dt>30000) 
      fade = (31000-dt)/1000;
  else if (dt>21000)
      fade = 1;
  else if (dt>20000)
      fade = (dt-20000)/1000;
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) - 500;

  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "left";
  context.fillText('Keyboard short cuts', x, 150);
  context.fillStyle = 'rgba(0, 255,255,'+fade+')';
  context.fillText('S : Shields', x, 180);
  context.fillText('H : Hyperspace', x, 210);
  context.fillText('L : Longrange scanner',x, 240);
  context.fillText('G : Galactic chart', x, 270);
  context.fillText('C : Computer', x,300);
  context.fillText('T : Tracking', x,330);
  context.fillText('M : Select Target', x,360);
  context.fillText('A : Aft/Front view', x,390);
  context.fillText('0-9 : Throttle  (Mousewheel as well)', x,420);
  context.fillText('Mouse to target, Left Mouse fires weapons', x,450);
  
  fade = 0;
  if (dt<1000 && time>40000) 
      fade = (1000-dt)/1000;
  else if (dt>31000)
      fade = 1;
  else if (dt>30000)
      fade = (dt-30000)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) + 500;
  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "right";
  context.fillText('Strategies', x, 150);
  context.fillStyle = 'rgba(128,255,0,'+fade+')';
  context.fillText('Destroy Fast moving patrols first', x, 180);
  context.fillText('Starbases when destroyed will spawn a new enemy patrol', x,240);
  context.fillText('Destroying Asteroids is for fun only',x, 300);
  context.fillText('Cancel Hyperwarps before 99 and you get a free boost(well almost free)',x, 360);
  context.fillText('Watch your Energy and dont forget to refuel', x,420);
  context.fillStyle = 'rgba(0,192,0,'+fade+')';
  context.fillText('Patrols move every 30 seconds or so', x, 210);
  context.fillText('If you cant save the base, destroying it denies the enemy', x,270);
  context.fillText('Never come out of warp without shields up', x,330);
  context.fillText('12.00 is a good cruise speed', x,390);
  
}

function RenderCredits()
{
  var time = new Date().getTime() - titleStartTime;
  var dt   = modulo2(time, 40000);
  if (dt<1000) 
      fade = dt/1000;
  else if (dt<10000)
      fade = 1;
  else if (dt>10000)
      fade = (11000-dt)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  
  context.fillStyle = 'rgba(255,64,0,'+fade+')';
    
  context.font = '20pt Orbitron';
  context.fillText('original game written by', canvas.width/2, 150);
  context.fillText('Respectfully rejuvenated by', canvas.width/2, 250);
  context.font = '30pt Orbitron';
  context.fillStyle = 'rgba(255,128,0,'+fade+')';
  context.fillText('Doug Neubauer, Atari, 1979', canvas.width/2, 200);
  context.fillText('Andi Smithers, 2014', canvas.width/2,300);

  context.font = '14pt Orbitron';
  context.fillStyle = 'rgba(0,128,0,'+fade+')';
  context.fillText('Version 0.93 beta', canvas.width/2, 360);
  context.fillText('todo: Damage/Destroyed systems', canvas.width/2, 380);
  
  fade = 0;
  if (dt>20000) 
      fade = (21000-dt)/1000;
  else if (dt>11000)
      fade = 1;
  else if (dt>10000)
      fade = (dt-10000)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) + 500;
  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "right";
  context.fillText('Thanks', x, 150);
  context.fillStyle = 'rgba(0,255,0,'+fade+')';
  context.fillText('Brian Dumlao for QA pass in his off hours', x, 180);
  context.fillText('Codepen for making it easy to prototype',x, 240);
  context.fillText('All the Disney folks I work with daily',x, 300);
  context.fillStyle = 'rgba(0,192,0,'+fade+')';
  context.fillText('Chris Chapman for pointing me at some cool webresources', x, 210);
  context.fillText('Parse for a real easy to use datastore',x, 270);
  context.fillText('Sheri Smithers for putting up with my late nights',x, 330);

  
  fade = 0;
  if (dt>30000) 
      fade = (31000-dt)/1000;
  else if (dt>21000)
      fade = 1;
  else if (dt>20000)
      fade = (dt-20000)/1000;
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) - 500;

  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "left";
  context.fillText('Objective of this project', x, 150);
  context.fillStyle = 'rgba(128,255,0,'+fade+')';
  context.fillText('This game is completely procedural.', x, 180);
  context.fillText('This project started out as an exercise', x, 240);
  context.fillText('the need to go into webGL or other extensions', x, 300);
  context.fillText('Taking about 2 weeks for all modules', x,360);
  context.fillText('It was written in about 3 hours per evening over 5 weeks', x,420);
  context.fillStyle = 'rgba(0,192,0,'+fade+')';
  context.fillText('Art, Sound and data are all generated',x, 210);
  context.fillText('into creating HTML5 canvas games without', x,270);
  context.fillText('The project was built with about 8 or so modules',x, 330);
  context.fillText('However it took 3 more weeks to build them into the game', x,390);
  context.fillText('whilst my wife, sheri and son, edward slept - andi.', x,450);
  
  fade = 0;
  if (dt<1000 && time>40000) 
      fade = (1000-dt)/1000;
  else if (dt>31000)
      fade = 1;
  else if (dt>30000)
      fade = (dt-30000)/1000;
  
  fade = Math.min(1, Math.max(0, fade));
  var x = (canvas.width/2) - 500;
  context.fillStyle = 'rgba(255,255,255,'+fade+')';
  context.font = '20pt Orbitron';
  context.textAlign = "left";
  context.fillText('A note from the author- sept 2014', x, 150);
  context.fillStyle = 'rgba(128,255,0,'+fade+')';
  context.fillText('This game is completely procedural.', x, 180);
  context.fillText('This project started out as an exercise', x, 240);
  context.fillText('the need to go into webGL or other extensions', x, 300);
  context.fillText('Taking about 2 weeks for all modules', x,360);
  context.fillText('It was written in about 3 hours per evening over 5 weeks', x,420);
  context.fillStyle = 'rgba(0,192,0,'+fade+')';
  context.fillText('Art, Sound and data are all generated',x, 210);
  context.fillText('into creating HTML5 canvas games without', x,270);
  context.fillText('The project was built with about 8 or so modules',x, 330);
  context.fillText('However it took 3 more weeks to build them into the game', x,390);
  context.fillText('whilst my wife, sheri and son, edward slept - andi.', x,450);
  
}

function RenderStats()
{
  var time = new Date().getTime() - titleStartTime;
  var dt   = modulo2(time, 30000);
  var fade = 0;
  if (dt<1000) 
    fade = dt/1000;
  else
    fade = (16000-dt)/1000;
  fade = Math.min(1, Math.max(0, fade));
  RenderStatistics(statistics, true, fade);

  fade = 0;
  if (dt<1000 && time>30000)
    fade = (1000-dt)/1000;
  else if (dt<15000)
    fade = 0;
  else
    fade = (dt-15000)/1000;
  fade = Math.min(1, Math.max(0, fade));
  RenderStatistics(totals, false, fade);
}


function RenderTitleScreen()
{
  
  renderStarfield();
  RenderAsteroids();
  RenderButtons();
  
  switch (attractMode)
  {
    case 0:
      RenderInstructions();
      break;
    case 1:
      RenderStats();
      break;
    case 2:
      RenderRanks();
      break;
    case 3:
      RenderCredits();
      break;
  }
  
  context.font = '61pt Orbitron';
  context.lineWidth = 8;
  context.textAlign = "center";
  context.strokeStyle = 'rgba(0,128,0,0.5)';
  context.strokeText('STAR RAIDERS - 2014', canvas.width/2,100);
  context.lineWidth = 1;
  context.font = '60pt Orbitron';
  context.fillStyle = 'rgb(255,255,0)';
  context.fillText('STAR RAIDERS - 2014', canvas.width/2,100);
  var titlepixel = context.measureText('STAR RAIDERS - 2014');
  context.font = '20pt Orbitron';
    context.fillStyle = 'rgb(255,255,255)';
  context.fillText('FireFox is kind of running. Performance on OSX sucks bad. Chrome and Safari should be running fine. Please comment with bugs!', canvas.width/2, 24);
  // update the last score percentile
  lastScore.percentile = UpdatePercentile(lastScore.rank);
  
  context.textAlign = "center";
  context.font = '20pt Orbitron';
  context.fillStyle = 'rgb(0,0,255)';
  context.textAlign = "center";
  context.fillText('Last Score: '+ rank(lastScore.rank) +'  -  Ranked in top '+lastScore.percentile.toFixed(1)+'%', canvas.width/2, canvas.height- 40);
  context.font = '12pt Orbitron';
  context.fillText('Date: '+ lastScore.date, canvas.width/2, canvas.height- 20);
}

function UpdatePercentile(rank)
{
  var percentile = 100;
  // update percentiles
  if (gameHitsPerRanks[rank+247]) percentile = 100 - (gameHitsPerRanks[rank+247] / gameTotalPlays * 100);
  return percentile;
}

function ranksort(a, b)
{
   return (b.rank-a.rank);
}

function  AddNewRank(ranking, date)
{  
   var percentile = UpdatePercentile(ranking);
  
   lastScore.date = date;
   lastScore.rank = ranking;
   lastScore.percentile = percentile; // compute using database
   
   // adds a rank making it 11
   bestRanks.push({rank:ranking, date:date, percentile:percentile});
   // sorts rank in high to low
   bestRanks.sort(ranksort);
   // pops the 11th off
   bestRanks.pop();

   // update local db
   SaveRanks();
}

function LoadStats()
{
  var result = LoadCookie("statistics");
  if (result) statistics = result;
  var result = LoadCookie("totals");
  if (result) totals = result;
}

function SaveStats()
{
  SaveCookie("statistics", statistics);
  SaveCookie("totals", totals);
}

function LoadRanks()
{
   var result = LoadCookie("lastScore");
   if (result) 
   {
     lastScore = result;
     lastScore.date = new Date(lastScore.date);
   }
   var result = LoadCookie("bestRanks");
   if (result)
   { 
     bestRanks = result;
     for (var i=0; i<bestRanks.length;i++) bestRanks[i].date = new Date(bestRanks[i].date);
   }
}

function SaveRanks()
{
   SaveCookie("lastScore", lastScore);
   SaveCookie("bestRanks", bestRanks);
}

function SaveCookie(name, value) 
{
  var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
  document.cookie = cookie;
}

function LoadCookie(name) 
{
   var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
   result && (result = JSON.parse(result[1]));
   return result;
}

function DeleteCookie(name) 
{
  document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
}

// setup buttons
function SetupTitleButtons()
{
  // erase old buttons
  buttons = [];
  var w = canvas.width;
  var b = border;
  var ms = mapScale;
  var bx = border.x*0.2;
  var bw = border.x*0.6;
  
  new Button(w-bx-bw, b.y*3.2, bw, ms.y*0.7, "Novice", StartNovice, '0');
  new Button(w-bx-bw, b.y*4.2, bw, ms.y*0.7, "Pilot", StartPilot, '1');
  new Button(w-bx-bw, b.y*5.2, bw, ms.y*0.7, "Warrior", StartWarrior, '2');
  new Button(w-bx-bw, b.y*6.2, bw, ms.y*0.7, "Commander", StartCommander, '3');
  
  new Button(bx, b.y*3.2, bw, ms.y*0.7, "Statistics", ViewStats, '4');
  new Button(bx, b.y*4.2, bw, ms.y*0.7, "Ranks", ViewRanks, '5');
  new Button(bx, b.y*5.2, bw, ms.y*0.7, "Instructions", ViewInstructions, '6');
  new Button(bx, b.y*6.2, bw, ms.y*0.7, "Credits", ViewCredits, '7');
}

function StartNovice()
{
  PlayConfirm();
  StartGame(novice);
}

function StartPilot()
{
  PlayConfirm();
  StartGame(pilot);
}

function StartWarrior()
{
  PlayConfirm();
  StartGame(warrior);
}

function StartCommander()
{
  PlayConfirm();
  StartGame(commander);
}

function ViewInstructions()
{
  PlayConfirm();
  attractMode = 0;
  titleStartTime = new Date().getTime()-11000;
}

function ViewStats()
{
  PlayConfirm();
  attractMode = 1;
  titleStartTime = new Date().getTime();
}

function ViewRanks()
{
  PlayConfirm();
  attractMode = 2;
}

function ViewCredits()
{
  PlayConfirm();
  attractMode = 3;
  titleStartTime = new Date().getTime();
}


function UpdateTitleScreen()
{
   localPosition.z= modulo2(localPosition.z-0.1, localSpaceCubed*0.25);
   setTrackingMouse(false);
   moveStarfield();

   UpdateAsteroids();
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
  document.getElementById("star-raiders").style.background = backgroundColor;  

  context.clearRect(0, 0, canvas.width, canvas.height);
  
  if (titleScreen == true) return RenderTitleScreen();
  
  renderGameScreen();

  if (endGameEvent == playing)
  {
    renderOverlays();
    renderInformation();
  }
  RenderButtons();
  
  if (endGameEvent == playing)
    WeaponCollisions();
  
  DrawRedAlert();

  displayText();
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
   if (pauseGame == true) return;
   if (titleScreen == true) return UpdateTitleScreen();
  
   setTrackingMouse(endGameEvent==playing);
  
   moveStarfield();
  
   UpdateAsteroids();

   if (endGameEvent == playing)
   {
      UpdateBoard();
  
      UpdateShipControls();

      TrackTargets();
   }
  
   UpdateNMEs();
  
   UpdateParticles();
  
  if (endGameEvent == playing)
     energyManagement();
  else  
     EndGameEvent();
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
    if (CheckShortcuts(key)==false)
    {
        // throttle
        if (key>='0' && key<='9')
        {
            var slider = GetControl("throttle");
            slider.value = key - '0';
            SetThrottle(slider);
        }
      
        if (key=='M') trackingTarget++;
        if (trackingTarget>=nmes.length) trackingTarget = 0;
    }
}

// setup buttons
function SetupButtons()
{
  // erase old buttons
  buttons = [];
  var b = border;
  var ms = mapScale;
  var bx = border.x*0.2;
  var bw = border.x*0.6;

  new Button(bx, b.y*2.2, bw, ms.y*0.6, "Long Range", SwitchToLongRange, 'L');
  new Button(bx, b.y*3.2, bw, ms.y*0.6, "Galaxy Chart", SwitchToGalaxyChart, 'G');
  new Button(bx, b.y*4.2, bw, ms.y*0.6, "Hyperspace", ToggleWarp, 'H');
  new Button(bx, b.y*5.2, bw, ms.y*0.6, "Shields", ToggleShields, 'S');
  new Button(bx, b.y*6.2, bw, ms.y*0.6, "Target Comp", ToggleTargetComp, 'C');
  new Button(bx, b.y*7.2, bw, ms.y*0.6, "Tracking", ToggleTrackingComp, 'T');
  new Button(bx, b.y*8.2, bw, ms.y*0.6, "Swap View", ToggleView, 'A');
  new Button(bx, b.y*1.2, bw, ms.y*0.6, "Pause Game", TogglePauseGame, 'P');
  new Button(bx, b.y*0.2, bw, ms.y*0.6, "Abort Mission", AbortMission, 'Q');  

  new Slider(ms.x*20, b.y*2, border.x*0.25, ms.y*6, 10, true, 10, "throttle", SetThrottle);
 
}

function SwitchToLongRange(button)
{
  //console.log("switching to long range");
  if (overlayMode == eLongRange)
  {
    overlayMode = targetComputer?eTargetComputer:eNone;
    GetControl("Target Comp").state = targetComputer;
  }
  else
  {
    overlayMode = eLongRange;
  }
  button.state = overlayMode == eLongRange;
  ClearButtonState("Galaxy Chart");
}

function SwitchToGalaxyChart(button)
{
   //console.log("switching to galatic range");
   if (overlayMode == eGalacticScanner)
   {
     overlayMode = targetComputer?eTargetComputer:eNone;
     GetControl("Target Comp").state = targetComputer;
   }
   else
   {
     overlayMode = eGalacticScanner;
   }
   button.state = overlayMode == eGalacticScanner;
   ClearButtonState("Long Range");
}

function ToggleWarp(button)
{
  // cant cancel now
  if (triggerWarp == inHyperspace) return;
  
  button.state^=1;
  if (button.state == false && triggerWarp!=normalSpace) triggerWarp=cancelHyperspace;
  else
  {
    triggerWarp = enterHyperspace;
    PlayBeginHyperspace();
    warpDeltaDistance = 0;
  }
  
  if (warpLocked && triggerWarp==enterHyperspace)
  {
      startText("jumping to hyperspace", border.x, 150);
  }
  else if (!warpLocked && triggerWarp==enterHyperspace)
  {
      startText("No hyperspace location set.\nYou could end up anywhere", border.x, 150);
  }
  else
  {
      startText("Aborting jump to hyperspace", border.x, 150);                
  }
}

function ToggleShields(button)
{
  button.state^=1;
  
  setShieldUp(button.state);
  setSplutter(30, 60);
  
  
  startText(getShieldUp()?"Shields Activated": "Shields Deactivated", border.x, 150);
  PlayConfirm();
}

function ToggleTargetComp(button)
{
   PlayConfirm();
   if (overlayMode != eTargetComputer)
   {
     overlayMode = eTargetComputer;
     targetComputer = 1;
     button.state=1;
     ClearButtonState("Long Range");
     ClearButtonState("Galaxy Chart");
   }
   else
   {
     overlayMode = eNone;
     button.state = 0;
     targetComputer=0;
   }

}

function ToggleTrackingComp(button)
{
  button.state^=1;
  trackingComputer= button.state;
  startText(trackingComputer?"ship tracking enabled": "ship tracking disabled", border.x, 150);
       PlayConfirm();
}

function ToggleView(button)
{
   button.state^=1;
   swapView();  
}

function TogglePauseGame(button)
{
  PlayConfirm();
  button.state^=1;
  pauseGame = button.state;
  startText(pauseGame ? "Paused Game":"Resume Game", border.x, 150);

}



function AbortMission(button)
{
  if (GetControl("Confirm")==null)
  {
    PlayConfirm();
    startText("Abort Mission (Y/N) ?", border.x, 150);
    var b = border;
    var ms = mapScale;
    var bx = b.x*0.2;
    var bw = b.x*0.6;
    new Button(bx+bw*1.06, b.y*0.2, bw, ms.y*0.6, "Confirm", AbortMissionConfirm, 'Y');
    new Button(bx+bw*2.12, b.y*0.2, bw, ms.y*0.6, "Cancel", AbortMissionCancel, 'N');
  }
}

function AbortMissionConfirm(button)
{
  PlayConfirm();
  startText(" ", border.x, 150);
  startText(" ", border.x, 150);
  startText(" ", border.x, 150);
  
  EndGame(aborted);
}

function AbortMissionCancel(button)
{
  PlayConfirm();
  SetupButtons();
  startText("Cancelled Abort Mission ", border.x, 150);
}

function EndGame(endType)
{
   // not sure how we got back here if we're not playing
   if (endGameEvent != playing) return;
  
   // andi: needs the tickers sequence
   statistics.endgames[endType]++;
  
   if (endType == destroyed)
   {
      DestroyShip();
   }
  
   if (endType == energyLost)
   {
      PowerDownShip();   
   }
  
   // clear all buttons
   buttons = [];
  
   // clear redalert
   redTime = 0;
  
   // update statistics
   UpdateAllTotals();
  
   // calculate the player rank
   var ranking = CalculateScore(endType);
   AddNewRank(ranking, new Date());
  
   // save stats and rank to server
   SaveStatistics();
   
   // save stats to local storage
   SaveStats();
  
   // save new rank
   UpdateRankings(ranking);
  
   // need to go back to title. 
//   TitleScreen();
   endGameTime = new Date().getTime();
   endGameEvent = endType;
   endGameLastMessage=-1;
   endGameRank = rank(ranking);
   SetupMainMenuButton();
}


function  SetupMainMenuButton()
{
   // main menu
   buttons = [];
   new Button(border.x, canvas.height/2, border.x, mapScale.y*0.6, "Return to Main Menu", TitleScreen, ' ');  
}

function EndGameEvent()
{
   if (endGameEvent == playing) return;
  
   var currentTime = new Date().getTime();
   var dx = currentTime - endGameTime;
   var messageNum = Math.floor(dx/2500)%4;
   
   if (endGameLastMessage != messageNum)
   {
       var endMessages = [
      "Star fleet to all units",
      "Star Cruiser 7 aborted mission",                         // aborted
      "Star Cruiser 7 destroyed by zlyon fire",                 // destroyed
      "Star Cruiser 7 depleted energy, mission aborted",        // energylost
      "Star Cruiser 7 all starbases lost, mission aborted",     // basesGone
      "Star Cruiser 7 all enemy units destroyed",               // allDead
      "Posthumous rank: ",
      "Rank: "];
     endGameLastMessage = messageNum;

     if (messageNum == 0)
     {
       startText("",border.x, 150);
       startText(endMessages[0], border.x, 150);
     }
     else if (messageNum == 1)
       startText(endMessages[endGameEvent+1], border.x, 150);
     else if (messageNum == 2)
       startText(endMessages[endGameEvent==destroyed?6:7] + endGameRank,border.x, 150);

   }
}

function DestroyShip()
{
    // explode (Asteroids)
    trackingComputer=false;
    targetComputer = false;
    setShieldUp(false);
  
         // detroy base
   SpawnAsteroidsAt(localPosition);
   setSpawn(localPosition.x, localPosition.y, localPosition.z);
   getExplodeEmitter().create();
   getDustEmitter().create();
   PlayExplosion();
}

function PowerDownShip()
{
    // explode (Asteroids)
    trackingComputer=false;
    targetComputer = false;
    setShieldUp(false);
    setShipVelocity = 0;
}

function CalculateScore(finishType)
{
  var Mtable = 
    [ 80, 60, 40,
      76, 60, 50,
      60, 50, 40,
      111, 100, 90];
  // compute M
  var mindex = gameDifficulty*3;
  if (finishType == destroyed) mindex++;
  if (finishType != allDead) mindex++;
  
  var M = Mtable[mindex];
  M += 6*statistic.kills;
  M -= Math.floor(statistics.energy/100);
  M -= statistics.killTypes[base] * 3;
  M -= statistics.bases * 18;
  M -= Math.floor(statistics.timePlayed);  // time is decimalized
  
  statistics.rank = M;
  totals.rank+=statistics.rank;
  
  return M;
}

function SaveStatistics()
{
  // save 
  var Statistics = Parse.Object.extend("Statistics");

  var rankings = new Statistics();
//  var statsjson = JSON.stringify(statistics);
//  console.log("jsonstring = "+statsjson);
  rankings.set('rank', statistics.rank);
  rankings.set('kills', statistics.kills);
  rankings.set('timePlayed', statistics.timePlayed);
  rankings.set('difficulty', statistics.difficulty);
  rankings.set('played',statistics.played);
  rankings.set('roidsFragmented',statistics.roidsFragmented);
  rankings.set('roidsHit',statistics.roidsHit);
  rankings.set('refuel',statistics.refuel);
  rankings.set('shieldsHit',statistics.shieldsHit);
  rankings.set('bases',statistics.bases);
  rankings.set('shipsHit',statistics.shipsHit);
  rankings.set('killTypes',statistics.killTypes);
  rankings.set('damaged',statistics.damaged);
  rankings.set('shots',statistics.shots);
  rankings.set('deflects',statistics.deflects);
  rankings.set('jumped',statistics.jumped);
  rankings.set('jumpedEnergy',statistics.jumpedEnergy);
  rankings.set('jumpCancelled',statistics.jumpCancelled);
  rankings.set('accuracy',statistics.accuracy);
  rankings.set('energy',statistics.energy);
  rankings.set('distance',statistics.distance);
  rankings.set('endgames',statistics.endgames);

  rankings.save().then(function(object) 
  {
    console.log("uploaded statistics");
  });
}

function UpdateRankings(ranking)
{
  // range to the min/max
  if (ranking < -248) ranking = -248;
  else if (ranking >320) ranking = 320;
  
  var Ranks = Parse.Object.extend("Ranks");

  var query = new Parse.Query(Ranks);
  query.equalTo("rank", ranking);
  query.first(
    {
        success: function(object) 
        {
            if (object)
            {
              object.increment("hits");
              object.save();
            }
            else
            {
              var rankings = new Ranks();
              rankings.set("rank", ranking);
              rankings.set("hits", 0);
              rankings.save();
            }
        },
        error: function(error) 
        {
            console.log("Error: " + error.code + " " + error.message);
        }
    });
  
}

function CacheGlobalRankings()
{
  var Ranks = Parse.Object.extend("Ranks");
  var query = new Parse.Query(Ranks);

  query.greaterThan("rank", -250);
  query.ascending("rank");
  query.limit(570);
  query.find(
  {
    success: function(results) 
    {
       gameTotalPlays = 0;
       for (var i=0; i<results.length; i++)
       {
          var index = results[i].get("rank");
          var count = results[i].get("hits");
         gameTotalPlays+=count;
         gameHitsPerRanks[index+248] = gameTotalPlays;
       }
       console.log("rankdata = " + gameTotalPlays + ", " + results.length);
    },
    error: function(error) 
    {
      console.log("error fetching data : "+error.message);
    }
  });

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

//  UpdateEngineSound(shipVelocity);

 }

var starTheta = 0;
var starPhi = 0;

// continual movement.. 
function TestMoveUnderMouse(mouseX, mouseY)
{
  // calculate the fov angle from the centre to the mouse
  var dx = centreX - mouseX;
  dx = Math.max(Math.min(dx, 512), -512); // clamp rotation spee
  var sx = dx * focalPoint*5 / 1000;
  var dy = centreY - mouseY;
  dy = Math.max(Math.min(dy, 512), -512);
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
  
  shipOrientation.clone(  ry.multiply(rx.multiply(shipOrientation)) );
  if (viewingFront())
  {
    orientation.clone(shipOrientation);
  }
  else
  {
    var rotate180 = new matrix3x3();
    rotate180.rotateY(Math.PI);
    orientation.clone(rotate180.multiply(shipOrientation));
  }
  
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
  localPosition.x += shipOrientation.m[6]*speed;
  localPosition.y += shipOrientation.m[7]*speed;
  localPosition.z += shipOrientation.m[8]*speed;
  // update stats
  statistics.distance+=Math.abs(speed);
  
  // changing
  setInitVelocity(-setShipVelocity*0.05);
  if (viewingAft()) setInitVelocity(getInitVelocity()*-1);
  
  panStarfield(angleX, angleY);
  
  if (triggerWarp == normalSpace)  PlayEngine(shipVelocity);
  
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
    if (slider)
    {
      slider.value+=delta*freqHz*6;
      SetThrottle(slider);
    }
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
  if (getShieldUp()) energy -= 2*freqHz;
  // lifesupport
  energy -= 0.25 * freqHz;
  // tracking computer
  if (trackingComputer) energy -= 0.5 * freqHz;
  
  // check damage
  CheckShields();
  
  // end game
  if (energy < 0 ) EndGame(energyLost);
}

function RenderWarpPoint()
{
    if (triggerWarp==normalSpace) return;
  
    var warp = getWarpCentre();
    
    var x = warp.x;
    var y = warp.y;
    var w = canvas.width/64;
    var h = canvas.height/64;
  
    if (w<h) w = h;
    else h = w;

    context.beginPath();
    context.moveTo(x+w/4, y-h);
    context.lineTo(x+w/4, y-h/4);
    context.lineTo(x+w, y-h/4);

    context.moveTo(x-w/4, y-h);
    context.lineTo(x-w/4, y-h/4);
    context.lineTo(x-w, y-h/4);

    context.moveTo(x+w/4, y+h);
    context.lineTo(x+w/4, y+h/4);
    context.lineTo(x+w, y+h/4);

    context.moveTo(x-w/4, y+h);
    context.lineTo(x-w/4, y+h/4);
    context.lineTo(x-w, y+h/4);

    context.lineWidth = 7;
    context.strokeStyle = 'rgba(128,255,255,0.2)';
    context.stroke();
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(128,255,255,0.8)';
    context.stroke();
}

function EnteringWarp()
{
   if (triggerWarp!=normalSpace)
   {
        var x = centreX;
        var y = centreY;
        setTrackingMouse(false);    
         var warptime = shipVelocity;
        if (gameDifficulty>pilot && shipVelocity>12)
        {
            var warp = getWarpCentre();
            var factor = (gameDifficulty-1)*10*warptime*0.01;
            x = warp.x+Math.random()*factor - (factor*0.5);
            y = warp.y+Math.random()*factor - (factor*0.5);
            setTrackingMouse(true);
        }

        setWarpCentre({x:x, y:y});     
   }
  
   if (triggerWarp==enterHyperspace)
   {
      UpdateHyperspaceSound(shipVelocity);
      setShipVelocity = 99.99;
      if (gameDifficulty>novice)
      {
         var warp = getWarpCentre();
         dx = warp.x - centreX;
         dy = warp.y - centreY;
         warpDeltaDistance += (dx*dx+dy*dy)*shipVelocity*shipVelocity;
      }      
     
      if (!getEnterWarp() && shipVelocity >90)
      {
        triggerWarp = inHyperspace;
        setEnterWarp(true);
        setWarpStartDepth(getCameraDepth());
        setWarpTime(0);
        
        // clear data
        clearAsteroids();
        nmes = []; 
      }
   }
  if (triggerWarp == inHyperspace)
  {
    // waiting destination 
    if (getEnterWarp() == false)
    {
       PlayConfirm();
       PauseHyperspaceSound(2);
       PlayExit(2);
       CancelHyperSound(2);
       triggerWarp = normalSpace;
       var slider = GetControl("throttle");
       SetThrottle(slider);
       GetControl("Hyperspace").state = 0;
      
       // setwarpLocation
       var dif = Math.sqrt(warpDeltaDistance) / (Math.sqrt(centreX*centreX+centreY*centreY)*50*getWarpTime());
       if (gameDifficulty == novice) badDriving = 0;
       else badDriving = dif * (gameDifficulty+7) * 0.1;
       // factor displacement over distance
       badDriving *= Math.round(Math.abs(warpLocation.x-shipLocation.x) + Math.abs(warpLocation.y-shipLocation.y));
       badDriving -= badDriving*0.5;
       //console.log("baddriving = " + badDriving);
       // now randomize in the cone
       var x = warpLocation.x + Math.random()*badDriving;
       var y = warpLocation.y + Math.random()*badDriving;
      
       if (warpLocked==false)
       {
           badDriving = dif*5;
           x = shipLocation.x + Math.random()*badDriving;
           y = shipLocation.y + Math.random()*badDriving;
           warpEnergy = 100;
       }
       
       // update stats - sectors covered, jumped and energy
       statistics.travelled += Math.round(Math.abs(x-shipLocation.x) + Math.abs(y-shipLocation.y));
       statistics.jumpedEnergy+=warpEnergy;
       statistics.jumped++;
       
       SetShipLocation(x, y);
       // Setup NME's
       SetupAsteroids(localSpaceCubed);
       SetupNMEs(GetPieceAtShipLocation());
       if (trackingComputer) trackingTarget = ClosestTarget();
       warpLocked = false;
       energy-=warpEnergy;
       setTrackingMouse(true);

    }
    else
    {
      UpdateHyperspaceSound(shipVelocity+getWarpTime()*0.5);
    }
  }
  if (triggerWarp == cancelHyperspace)
  {
     setTrackingMouse(true);
     triggerWarp = normalSpace;
     var slider = GetControl("throttle");
     SetThrottle(slider);
     energy-=100;
     PlayExit();
     CancelHyperSound();
    
     // statistics 
     statistics.jumpedEnergy-=100;
     statistics.jumpCancelled++;
  }
}

const maxpoints = 1024;
var pointcloud =[];

function InitStarDome()
{
   for (var i=0; i<maxpoints;i++)
   {
       pointcloud.push(RandomNormal());
   }
}

var theta = 0;
var phi = 0;

function RenderStarDome()
{ 
//    theta+=0.01;
  //  phi+=0.01;
    var scale = 1000* canvas.height/500;
    context.beginPath();
    for (var i=0; i<pointcloud.length; i++)
    {
        var point = pointcloud[i];
        var t = orientation.transform(point.x, point.y, point.z);
        var x1=t.x*scale;
        var y1=t.y*scale;
        var z1=t.z*scale+focalDepth;
      
      
        if (z1+focalDepth<0) continue;
        var depth = focalPoint*5 / (z1 + focalDepth );
    
        var x = x1 * depth + centreX;
        var y = y1 * depth + centreY;
        var sz = depth * 0.2;

        // fill a rect
        context.rect(x,y, 4, 4);
    }
  
    context.fillStyle = '#333333';
    context.fill();
}

function ClosestTarget()
{
  var distance = 10000000;
  var select = -1;

  for (var i=0; i<nmes.length; i++)
  {
    if (nmes[i].hitpoints>0)
    {
      var dist2 = nmes[i].targetPoint({x:0, y:0, z:0}).lengthSquared();
      if (dist2<distance) {distance = dist2; select = i;}
    }
  }
  return select;
}

function TrackTargets()
{
  if (!trackingComputer) return;
  
  if (trackingTarget<0 || trackingTarget>=nmes.length || nmes[trackingTarget].hitpoints<=0)
  {
    var t= ClosestTarget();
    if (t>=0) trackingTarget = t;
    else trackingTarget = 0;
  }

}

// entry point
init();
animate();
