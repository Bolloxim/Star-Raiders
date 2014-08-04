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
var spawnList = [];
var explodeEmitter;
var torpedoEmiiter;

function ParticleEmitter()
{
	this.series();
}

ParticleEmitter.prototype.create = function()
{
  spawnList.push(new ParticleGroup(this));
  spawnList.push(new ParticleGroup(this));  
}

// define series constants here
ParticleEmitter.prototype.series = function()
{
  this.plane = RandomNormal();

  this.iteration = 0;
  this.particleCount = 256;
  this.sx = spawnX;
  this.sy = spawnY;
  this.size = 6.0;
  this.time = 0;
  this.life = 5;
}

// each iteration will change a property
ParticleEmitter.prototype.generate = function()
{

  this.pos = {x:0, y:0, z:0};
  this.vel = new RandomNormal();
  this.velsize = Math.random()*-1.0;
  this.life = Math.random()*5.0;
  this.color = 'rgb('+this.iteration/4+','+this.iteration/16+','+this.iteration/32+')';
  this.iteration++;
}

function PhotonTorpedoEmitter()
{
	this.series();
}

PhotonTorpedoEmitter.prototype.create = function()
{
    spawnList.push(new ParticleGroup(this));
   // spawnList.push(new ParticleGroup(this));
   // spawnList.push(new ParticleGroup(this));
    //spawnList.push(new ParticleGroup(this));
}

// define series constants here
PhotonTorpedoEmitter.prototype.series = function()
{
  this.plane = {x:1,y:1,z:1};
  this.iteration = 0;
  this.particleCount = 64;
  this.sx = centreX;
  this.sy = centreY;
  this.time = 0;
   this.life = 2;
  this.plane = RandomNormal();
}

// each iteration will change a property
PhotonTorpedoEmitter.prototype.generate = function()
{
  
  this.pos = {x:(spawnX-centreX)/4, y:(spawnY-centreY)/4, z:10};
 // this.vel = new RandomNormal();
  this.vel = {x:0, y:0, z:-5-(this.iteration*this.iteration*0.001)}
  this.velsize = -0.01 - (Math.random()*-this.vel.z*0.1);
  this.size = 3.0 + Math.random()*3;
  this.life = 2;
  this.color = 'rgb(10, 10, 255)';
  this.iteration++;
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

// prototype classes

// particle group container
function ParticleGroup(emitter)
{
  this.create(emitter);
}

ParticleGroup.prototype.create = function(emitter)
{
  this.emitter = emitter;
  this.emitter.series();

  this.time = 0;
  this.life = emitter.life;
  this.particles = [];
  this.plane = this.emitter.plane;
  
  this.spawn();
}

ParticleGroup.prototype.spawn = function()
{
  // initiate an emitter series
  for (var i=0; i<this.emitter.particleCount; i++)
  {
     // generate next in series
     this.emitter.generate();
     this.particles[i] = new Particle(this.emitter);
  }
}

ParticleGroup.prototype.update = function()
{
  for (var i=0; i<this.particles.length; i++)
  {
    this.particles[i].move(this.plane);
  }
  this.time+=0.016;
  return this.time<this.life;
}

ParticleGroup.prototype.draw = function()
{
  for (var i=0; i<this.particles.length; i++)
  {
    this.particles[i].draw();
  }
}

// particle item
function Particle(time)
{
    this.create(time); 
}

Particle.prototype.create = function(emitter)
{
  this.sx = emitter.sx;
  this.sy = emitter.sy;
  this.pos = emitter.pos;
  this.vel = emitter.vel;
  this.size = emitter.size;
  this.velsize = emitter.velsize;
  this.time = emitter.time;
  this.life = emitter.life;
  this.color = emitter.color;
}

Particle.prototype.move = function(plane)
{
  this.pos.x += this.vel.x* plane.x*3;
  this.pos.y += this.vel.y* plane.y;
  this.pos.z += this.vel.z* plane.z*1.5;
  this.size += this.velsize;
  this.time+=0.016;
  if (this.size<=0) this.size=0.001;
}

Particle.prototype.draw = function() 
{
  if (this.pos.z + focalDepth > 0 && this.time < this.life)
  {
    var depth = focalPoint / (this.pos.z + focalDepth);
		
    var x = this.pos.x * depth + this.sx;
    var y = this.pos.y * depth + this.sy;
    var sz = this.size * depth;

    // fill a rect
    context.globalAlpha = 1.0 - this.time/this.life;
    context.beginPath();
    context.arc(x, y, sz, 0, 2*Math.PI);
    context.fillStyle = this.color;
    context.fill();
  }
};


// initialization

function init()
{
  // setup canvas and context
	canvas = document.getElementById('explode');
	context = canvas.getContext('2d');
  
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  window.addEventListener('resize', resize);

  // initialze variables
  spawnX = centreX;
  spawnY = centreY;
 
  explodeEmitter = new ParticleEmitter();
  torpedoEmitter = new PhotonTorpedoEmitter();
 
  explodeEmitter.create();
 // torpedoEmitter.create();
  
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
	spawnX = mouseX;
	spawnY = mouseY;
   spawn();
}

function spawn()
{
  explodeEmitter.create();
  torpedoEmitter.create();
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

function render()
{
 
  context.fillStyle = 'black';
  context.clearRect(0, 0, canvas.width, canvas.height);    
  context.globalCompositeOperation = 'lighter';

  for (var i = 0; i< spawnList.length; i++) spawnList[i].draw();
  
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('First step in particle explosions', canvas.width/2, 100);
  context.fillText('Second step particle groups and basic emitter', canvas.width/2, 130);   context.fillText('(clicking spawns more explosions)', canvas.width/2, 160);

}

// movement functions

function update()
{ 
  var i = spawnList.length;
  while (i)
  {
      --i;
    if (spawnList[i].update()==false) spawnList.splice(i,1);
  }
  
  if ((frameCount&255)==0) spawn();
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
