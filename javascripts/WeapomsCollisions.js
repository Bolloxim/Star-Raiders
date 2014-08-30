
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
var shipFireX = 1;
function FirePhotons()
{
   // alternate fire
   spawnX = centreX + shipFireX*canvas.width/32;
   spawnY = centreY + canvas.height/16;
   torpedoEmitter.create();
   if (shipDamage.photons==false) shipFireX*=-1;
   energy-=10;
   PlayPhoton();
}

function CheckShields()
{
  var i = asteriods.length;
  while (i)
  {
      --i;
    if (asteriods[i].shieldsHit) 
    {
      // spawn splash
      var roid = asteriods[i];
      var x = modulo2(localPosition.x - roid.x, localSpaceCubed)-localSpaceCubed*0.5;
      var y = modulo2(localPosition.y - roid.y, localSpaceCubed)-localSpaceCubed*0.5;
      var z = modulo2(localPosition.z - roid.z, localSpaceCubed)-localSpaceCubed*0.5;
        
      var scale =512/canvas.height;
      var t = orientation.transform(x, y, z);
      var depth = focalPoint*5 / ((t.z + 5*scale) +1);
      var depthInv = focalPoint / (t.z + focalDepth);
      if (depth>0)
      {
      spawnX = (t.x*depth)/depthInv;
      spawnY = (t.y*depth)/depthInv;
      }
      else
        {
          spawnX = t.x;
          spawnY = t.y;
        }
      spawmZ = 0;
      dustEmitter.create();

      ShieldHit(spawnX, spawnY, 100/(1<<roid.fragment));
      // delete roid
      asteriods.splice(i,1);
    }
  } 
}

function ShieldHit(x, y, damage)
{
  energy-=damage;
  if (shieldUp==false) // dead
  {
     // gameover
    energy = 0;
    PlayExplosion();
  }
  else
  {
     shieldFlash(x, y);
     PlayShield();
  }
}

function CollideAsteriods(sx, sy, photon)
{
   var sz = photon.z;
   var scale =512/canvas.height;

  for (var j = 0; j<asteriods.length; j++)
  {
      var roid = asteriods[j];
      var x = modulo2(localPosition.x - roid.x, localSpaceCubed)-localSpaceCubed*0.5;
      var y = modulo2(localPosition.y - roid.y, localSpaceCubed)-localSpaceCubed*0.5;
      var z = modulo2(localPosition.z - roid.z, localSpaceCubed)-localSpaceCubed*0.5;

      var t = orientation.transform(x, y, z);
      var depth = focalPoint*5 / ((t.z + 5*scale) +1);
      if (depth<=0) continue;
      var size = depth*gameDifficultyHitBox;

      var x1 = t.x*depth+centreX;
      var y1 = t.y*depth+centreY;
      var dx = sx-x1;
      var dy = sy-y1;
      var dz = sz-500 - t.z;
/*            
      context.beginPath();
      context.arc(x1, y1, size, 0, Math.PI*2);
      context.strokeStyle = 'rgb(255,255,255)';
      context.stroke();
      context.fillText("dist="+Math.floor(dz), x1, y1-12);
*/
      if (dx*dx+dy*dy < size*size && dz*dz < 4000)
      {
          var depthInv = focalPoint / ((t.z + focalDepth) +1);
          spawnX = (t.x*depth)/depthInv;
          spawnY = (t.y*depth)/depthInv;
          spawnZ = t.z*4;
          // create particle

          dustEmitter.create();

          // fragment rock
          if (asteriods[j].fragment==2)
            asteriods[j].init();    // destroy
          else
            FragmentAsteriod(asteriods[j]);
            PlayExplosionThud();
          return true;
      }
  }
  return false;
}

function CollideNMEs(sx, sy, photon)
{
    var sz = photon.z;
    var scale =512/canvas.height;
    var zylonHitBox = gameDifficultyHitBox+0.5;
  
    for (var j = 0; j<nmes.length; j++)
    {
      var nme = nmes[j];
      if (nme.hitpoints>0)
      {
          var x = modulo2(localPosition.x - nme.pos.x, localSpaceCubed)-localSpaceCubed*0.5;
          var y = modulo2(localPosition.y - nme.pos.y, localSpaceCubed)-localSpaceCubed*0.5;
          var z = modulo2(localPosition.z - nme.pos.z, localSpaceCubed)-localSpaceCubed*0.5;

          var t = orientation.transform(x, y, z);
          var depth = focalPoint*5 / ((t.z + 5*scale) +1);
          if (depth<=0) continue;
          var size = depth*zylonHitBox;

          var x1 = t.x*depth+centreX;
          var y1 = t.y*depth+centreY;
          var dx = sx-x1;
          var dy = sy-y1;
          var dz = sz-500 - t.z;
/*
          context.beginPath();
          context.arc(x1, y1, size, 0, Math.PI*2);
          context.strokeStyle = 'rgb(255,255,255)';
          context.stroke();
          context.fillText("dist="+Math.floor(dz), x1, y1-12);
*/
          if (dx*dx+dy*dy < size*size && dz*dz < 4000)
          {
              if (nme.type == base || nme.type == basestar)
              {
                 if (t.z < 160) nme.hitpoints--;   
              }
              else
              {
                // fighter/cruisers any range
                nme.hitpoints--;
              }
              // create particle
              var depthInv = focalPoint / ((t.z + focalDepth) +1);
              spawnX = (t.x*depth)/depthInv;
              spawnY = (t.y*depth)/depthInv;
              spawnZ=t.z;

              if (nme.hitpoints != 0)
              {
                 spawnZ*=8.0;
                 dustEmitter.create();
                 PlayExplosionThud();
              }
              else
              {
                 explodeEmitter.create();
                 dustEmitter.create();
                 KillNmeType(nme.type);
                 PlayExplosion();
              }

              return true;
          }
      }
   }
   return false;
}

function CollidePlasma(sx, sy, photon)
{
    var plasmaHitBox = (gameDifficultyHitBox+0.5)*2;
  
    for (var i = 0; i< spawnList.length; i++) 
    {
        if (spawnList[i].emitter instanceof PlasmaEmitter)
        {
            var pos = spawnList[i].particles[63].pos;

            var depth = focalPoint / (pos.z + focalDepth );
            if (depth<=0) continue;

            var x1 = pos.x * depth + spawnList[i].particles[63].sx;// + cX-centreX;
            var y1 = pos.y * depth + spawnList[i].particles[63].sy;// + cY-centreY;
            var z1 = spawnList[i].particles[63].size * depth;
            var size = depth*plasmaHitBox;
            var dx = sx-x1;
            var dy = sy-y1;

            if (dx*dx+dy*dy<size*size)
            {
               spawnList[i].life = 0;
               spawnX = pos.x;
               spawnY = pos.y;
               spawnZ = pos.z*2;

               dustEmitter.create();                
               PlayExplosionThud();
               return true;      
            }
        }
    }
}

function CollideShip(sx, sy, plasma)
{
   if (Math.abs(plasma.z)<3)
   {
       ShieldHit(sx, sy, 100);
   }
}

function WeaponCollisions()
{

  for (var i = 0; i< spawnList.length; i++)
  {
      // ignore dead particles
      if (spawnList[i].life<=0) continue;
    
      if (spawnList[i].emitter instanceof PhotonTorpedoEmitter)
      {
          var pos = spawnList[i].particles[63].pos;

          var depth = focalPoint / (pos.z + focalDepth );
          if (depth<=0) continue;
    
          var sx = pos.x * depth + spawnList[i].particles[63].sx + cX-centreX;
          var sy = pos.y * depth + spawnList[i].particles[63].sy + cY-centreY;
          var sz = spawnList[i].particles[63].size * depth;
 /* debug collision    
          context.beginPath();
          context.arc(sx, sy, sz, 0, Math.PI*2);
          context.strokeStyle = 'rgb(255,255,255)';
          context.stroke();
 */     
          if (CollideAsteriods(sx, sy, pos))
          {
            // destroy photon
            spawnList[i].life = 0;

          }
          else if (CollideNMEs(sx, sy, pos))
          {
            // destroy photon
            spawnList[i].life = 0; 
          }
          else if (CollidePlasma(sx, sy, pos))
          {
            spawnList[i].life = 0;
          }
      }
      else if (spawnList[i].emitter instanceof PlasmaEmitter)
      {
          var pos = spawnList[i].particles[63].pos;

          var depth = focalPoint / (pos.z + focalDepth );
          if (depth<=0) continue;
    
          var sx = pos.x * depth + spawnList[i].particles[63].sx;// + cX-centreX;
          var sy = pos.y * depth + spawnList[i].particles[63].sy;// + cY-centreY;
          var sz = spawnList[i].particles[63].size * depth;
/* debug collision volumes
          context.beginPath();
          context.lineWidth =8;
          context.arc(sx, sy, sz, 0, Math.PI*2);
          context.strokeStyle = 'rgb(255,255,255)';
          context.stroke();
*/      
          if (CollideAsteriods(sx, sy, pos))
          {
            // destroy plasma
            spawnList[i].life = 0;
          }
          else if (CollideShip(sx, sy, pos))
          {
            // destroy plasma
            spawnList[i].life = 0; 
          }
      }
   }
}
