const typeBase = 0;
const typePatrol = 1;
const typeGroup = 2;
const typeFleet = 3;

const dead = -1;
const base = 0;
const fighter = 1;
const cruiser = 2;
const basestar = 3;

const novice = 0;
const pilot = 1;
const warrior = 2;
const commander = 3;

var gameDifficulty;

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
  this.targets = [];
  this.targets[0] = type; // ensures a base star 
  // ship layout
  for (var i=1; i<this.numTargets; i++)
  {
    this.targets[i] = Math.min(Math.floor(Math.random()*gameDifficulty*0.2+Math.random()*i)+1, basestar);
  }
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
      // check if we have the player ship here
      if (shipLocation.x == this.location.x && shipLocation.y == this.location.y) return;

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
  return {x:x*mapScale.x+mapScale.x*0.5+border.x+mapCentreX, y:y*mapScale.y+mapScale.y*0.5+border.y+mapCentreY};
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


function BoardSetup(difficulty)
{
  // set board layout on diffuculty
  var numPieces = 3+difficulty;
  gameDifficulty = difficulty;

  // clear board
  targetBase = 0;
  boardPieces = [];
  
  var x, y;
  var edge = 1;
  for (var i =0; i<4; i++)  // types
  {
    for (var j=0; j<numPieces; j++)  // counts
    {

      do
      {
        x = Math.floor(Math.random() * (galaxyMapSize.x-edge*2))+edge;
        y = Math.floor(Math.random() * (galaxyMapSize.y-edge*2))+edge;
        
        var p = GetBoardPiece(x, y);
      } while(p>=0);

      boardPieces.push(new BoardPiece(x, y, i));
    }
    edge = 0;
  }
}


// board pieces 
function GetBoardPiece(x, y, useKnown)
{
  xi = Math.floor(x);
  yi = Math.floor(y);

  if (useKnown)
  {
      for (var i=0; i<boardPieces.length; i++)
      {
        if (boardPieces[i].lastknown.x == xi && boardPieces[i].lastknown.y==yi) return i;
      }      
  }
  else
  {
      for (var i=0; i<boardPieces.length; i++)
      {
        if (boardPieces[i].location.x == xi && boardPieces[i].location.y==yi) return i;
      }      
  }
  return -1;
}

function GetBoardPieceScreen(sx, sy, lastKnown)
{
  x = Math.min(Math.max(sx-border.x, 0), mapScale.x*16) / mapScale.x;
  y = Math.min(Math.max(sy-border.y, 0), mapScale.y*16) / mapScale.y;
  
  return GetBoardPiece(x, y, lastKnown);
}

function SetShipLocation(x, y)
{
  shipLocation.x = Math.floor(x);
  shipLocation.y = Math.floor(y);
  shipPosition.x = x;
  shipPosition.y = y;
}

function GetPieceAtShipLocation()
{
  var index = GetBoardPiece(shipLocation.x, shipLocation.y, false);

  return index<0 ? null : boardPieces[index];
}

function SetWarpPoint(x, y, lock)
{
  if (warpLocked == true && lock == false) return;
  warpLocked = lock;
  
  // convert mouse to board
  warpLocation.x = Math.min(Math.max(x-border.x, 0), mapScale.x*16) / mapScale.x;
  warpLocation.y = Math.min(Math.max(y-border.y, 0), mapScale.y*16) / mapScale.y;
  
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
  var x = Math.min(Math.max(sx-border.x, 0), mapScale.x*16) / mapScale.x;
  var y = Math.min(Math.max(sy-border.y, 0), mapScale.y*16) / mapScale.y;
    
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



function UpdateBoard()
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
      BoardSetup(gameDifficulty);
   }
 } 
