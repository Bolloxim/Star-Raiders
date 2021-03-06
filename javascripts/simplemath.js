
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

// uniform distribution of a normal 
function RandomNormal()
{
  var theta = Math.random() * Math.PI * 2;
  var nz = 1 - 2*Math.random();
  var phi = Math.acos(nz);
  var nx = Math.sin(theta)*Math.sin(phi);
  var ny = Math.cos(theta)*Math.sin(phi);
  
  return {x:nx, y:ny,z:nz};
}

function vector3(cx, cy, cz)
{
  this.x = cx;
  this.y = cy;
  this.z = cz;
}

vector3.prototype.copy = function(vector)
{
  this.x = vector.x;
  this.y = vector.y;
  this.z = vector.z;
}

vector3.prototype.lengthSquared = function()
{
  return (this.x*this.x+this.y*this.y+this.z*this.z); 
}

vector3.prototype.magnitude = function()
{
  return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z); 
}

vector3.prototype.dot = function(vector)
{
  return this.x*vector.x+this.y*vector.y+this.z*vector.z;
}

vector3.prototype.normalize = function()
{
  var mag = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);
  if (mag==0)
  {
    this.z=1.0;
  }
  else
  {
    mag=1.0/mag;
    this.x*=mag;
    this.y*=mag;
    this.z*=mag;
  }
}

vector3.prototype.normal = function()
{
  var mag = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);
  if (mag==0) return new vector3(0,0,1);
  mag=1.0/mag;
  return new vector3(this.x*mag, this.y*mag, this.z*mag);
}

vector3.prototype.add = function(vector)
{
  return new vector3(this.x+vector.x, this.y+vector.y, this.z+vector.z);
}

vector3.prototype.sub = function(vector)
{
  return new vector3(this.x-vector.x, this.y-vector.y, this.z-vector.z);
}

vector3.prototype.mul = function(scalar)
{
  return new vector3(this.x*scalar, this.y*scalar, this.z*scalar);
}

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
   this.m = [c,0,s,0,1,0,-s, 0, c];
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

matrix3x3.prototype.invtransform = function(tx, ty, tz)
{
  return {x:tx*this.m[0]+ty*this.m[3]+tz*this.m[6], 
          y:tx*this.m[1]+ty*this.m[4]+tz*this.m[7],
          z:tx*this.m[2]+ty*this.m[5]+tz*this.m[8]};
}
