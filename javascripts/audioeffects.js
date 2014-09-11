
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
var audioContext;
var freqSelect = 1;  // triple octave settings .. use 1 for regular
var waveform = 0;
var noiseOn = false;
var whiteNoiseBuffer;
var pinkNoiseBuffer;
var brownNoiseBuffer;
var noiseSelect = 0;
var compressor;

var hyperSound;

var finTable = [1789790.0, 63921.0, 15699.9];

// starts high C
var pokeyFrequencyDivsors = [ 
 29, 31, 33, 35, 37, 40, 42, 45, 47, 50, 53, 57, // C,A,B descends 12 notes per range
 60, 64, 68, 72, 76, 81, 85, 91, 96,102,108,114, // C,A,B etc
121,128,136,144,153,162,173,182,193,204,217,230, // middle C
243]; // lowest c

var waveTable = [  "sine", "square", "sawtooth","triangle", "noise"];

function Envelope(at,dt,dv,st,rt)
{
  this.init(dv, at,dt,st,rt);
}

Envelope.prototype.init = function(dv,at,dt,st,rt)
{
    this.decay2 = dv; // decay %
    this.attack = at;
    this.decay = dt;
    this.sustain = st;
    this.release = rt;  
    this.gain = audioContext.createGain();
}

Envelope.prototype.node = function(time)
{
   this.time = time || audioContext.currentTime;
   this.gain.gain.linearRampToValueAtTime(0.0, time);
   this.gain.gain.linearRampToValueAtTime(1.0, time+this.attack);
   this.gain.gain.linearRampToValueAtTime(this.decay2, time+this.decay);
   this.gain.gain.setValueAtTime(this.decay2, time+this.sustain);
   this.gain.gain.linearRampToValueAtTime(0.0, time+this.release);
  
   return this.gain;
}

function FMSynth(noise)
{
  if (noise == null) noise =false;
  this.init(noise);
}

FMSynth.prototype.init = function(noise)
{
    if (waveform<4)
    {
        this.oscilator = audioContext.createOscillator();
        this.oscilator.type = waveTable[waveform];
        this.oscilator.frequency.value = 0; // Default frequency in hertz
        this.node = this.oscilator;
    }
    else
    {
          this.node = audioContext.createBufferSource();
          switch (noiseSelect)
          { 
            case 0: this.node.buffer = whiteNoiseBuffer;
              break;
            case 1: this.node.buffer = pinkNoiseBuffer;
              break;
            case 2: this.node.buffer = brownNoiseBuffer;
              break;
          }
          this.node.loop = true;
    }
  
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 1;
  
    if (waveform<4)
    {
        this.gainNode.gain.value = 0.25;
        this.node.connect(this.gainNode);
    }
    else
    {
        this.filter = audioContext.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = 300;
        this.filter.gain.value = 0;
        this.filter.Q.value = 10;
      
        this.node.connect(this.filter);
        this.filter.connect( this.gainNode);
    }
    
  this.gainNode.connect(compressor);

}

FMSynth.prototype.play = function(note, delay, duration)
{
   var N = pokeyFrequencyDivsors[note]+1;
   var Fin = finTable[freqSelect];
   var M = 6;
   var Fout = Fin;
   if  (freqSelect!=0) Fout/= (2*N);
   else Fout /= (2 * (N+M));

   if (waveform<4)
     this.node.frequency.value = Fout; // Default frequency in hertz
   else
     this.filter.frequency.value = Fout;
  
   var playNode = this.node;
   playNode.start(delay);
   if (duration>0)
   {
     playNode.stop(delay+duration);
   }
}

FMSynth.prototype.stop = function(delay)
{
  var playNode = this.node;
  playNode.stop(audioContext.currentTime+delay);
}
// initialization

function init()
{
  // setup canvas and context
  canvas = document.getElementById('audio');
  context = canvas.getContext('2d');
  
  // set canvas to be window dimensions
  resize();

  // create event listeners
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('click', mouseClick);
  window.addEventListener('resize', resize);

  // initialze variables  
  window.AudioContext = window.AudioContext||window.webkitAudioContext;
  audioContext = new AudioContext();
  
  initAudio();
}

function initAudio()
{
  createWhiteNoiseBuffer();
  createPinkNoiseBuffer();
  createBrownNoiseBuffer();
  
  compressor = audioContext.createDynamicsCompressor();
  compressor.connect(audioContext.destination);
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
   buttonpressed = CheckButtons(mouseX, mouseY, false);

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
  
  RenderInfo();
  RenderButtons();
  
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  context.fillText('Atari Pokey Chip Audio Emulation', canvas.width/2, 100);
  context.fillText('using web audio api', canvas.width/2, 130);

}

// movement functions

function update()
{ 
  CheckButtons();
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

function SetupButtons()
{
  // erase old buttons
  buttons = [];
  var bx = canvas.width/2 -400;
  var by = 100;
  var mx = canvas.width/2 +260;
  new Button(bx, by+100, 140, 40, "Waveform", SwitchWaveform, '0');
  new Button(bx, by+50, 140, 40, "Frequency", SwitchFrequency, '0');
  new Button(bx, by, 140, 40, "Play Scale Down", PlayScaleDown, '1');
  new Button(bx, by-50, 140, 40, "Play Scale Up", PlayScaleUp, '2');
  new Button(bx, by+150, 140, 40, "Noise Type", PlayNoise, '2'); 
//  new Button(bx, by+200, 140, 40, "Noise Off", PlayNoiseCancel, '2');

  new Button(mx, by-50, 140, 40, "Play Confirm", PlayConfirm, '2');
  new Button(mx, by, 140, 40, "Play Red Alert", PlayRedAlert, '2');
  new Button(mx, by+50, 140, 40, "Play Photon", PlayPhoton, '3');
  new Button(mx, by+100, 140, 40, "Play Disrubtor", PlayDisruptor, '3');
  new Button(mx, by+150, 140, 40, "Play Explosion", PlayExplosion, '3');
  new Button(mx-150, by+150, 140, 40, "Play Explosion Thud", PlayExplosionThud, '3');
  new Button(mx+150, by+150, 140, 40, "Play Shield", PlayShield, '3');
  new Button(mx, by+200, 140, 40, "Hyperspace", PlayHyperspace, '3');
  new Button(mx+150, by+200, 140, 40, "Hyperspace Exit", PlayExit, '3');
}

function RenderInfo()
{
  context.globalAlpha = 1.0;
  context.font = '20pt Calibri';
  context.fillStyle = 'rgb(255,255,255)';
  context.textAlign = "center";
  if (freqSelect)
    context.fillText(finTable[freqSelect]/1000+' Khz', canvas.width/2, 180);
  else
    context.fillText(finTable[freqSelect]/1000000+' Mhz', canvas.width/2, 180);
  context.fillText(waveTable[waveform] +' waveform', canvas.width/2, 230);
  noiseNames = ['white', 'pink', 'brown'];
  context.fillText(noiseNames[noiseSelect]+'-noise', canvas.width/2, 280);
  
}

function SwitchWaveform(button)
{
  waveform = (waveform+1)%5;  
}

function SwitchFrequency(button)
{
  freqSelect = (freqSelect+1) %3;
}

function PlayScaleDown(button)
{
  for (var note=0; note<37; note++)
  {
    time = note * 0.2;
    (new FMSynth()).play(note, audioContext.currentTime+time, 0.2);
  }
}

function PlayScaleUp(button)
{
  for (var note=0; note<37; note++)
  {
    time = note * 0.2;
    (new FMSynth()).play(37-note, audioContext.currentTime+time, 0.2);
  }
}

function PlayConfirm(count)
{
    var chirps = count || 3;
    time = 0
    inc = 1/8;
    dur = inc/2;
    freqSelect = 0;
    waveform = 3;
     note = 36;
    for (var i=0; i<chirps; i++)
    {
        (new FMSynth()).play(note, audioContext.currentTime+time, dur);
        time += inc;
    }
}

function PlayRedAlert(time)
{
    var time = time || 0;
    time += audioContext.currentTime;
    inc = 1/3;
    dur = inc;
    freqSelect = 1;
    waveform = 1;
    note1 = 14;
    note2 = 26;
    for (var i=0; i<4; i++)
    {
      waveform = 1;freqSelect=1;
      (new FMSynth()).play(note1, time, dur);
            waveform = 0;freqSelect=2;
      (new FMSynth()).play(note1, time, dur);
      time += inc;
                  waveform = 1;freqSelect=1;
      (new FMSynth()).play(note2, time, dur);
                  waveform = 0;freqSelect=2;
      (new FMSynth()).play(note2, time, dur);
        time += inc;
    }
}

function PlayDisruptor()
{
    waveform = 0;
    freqSelect = 1;
    photonTone= new FMSynth();
    photonTone.play(0, audioContext.currentTime, 0.4);
    photonTone.oscilator.frequency.linearRampToValueAtTime(30,audioContext.currentTime);
    photonTone.oscilator.frequency.linearRampToValueAtTime(300,audioContext.currentTime+1);


    waveform = 4;
    freqSelect = 1;
    photonSound = new FMSynth();
    photonSound.play(0, audioContext.currentTime, 2);
    photonSound.filter.frequency.linearRampToValueAtTime(600, audioContext.currentTime);
    photonSound.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime+2);
    photonSound.filter.Q.linearRampToValueAtTime(25, audioContext.currentTime);
    photonSound.filter.Q.linearRampToValueAtTime(8, audioContext.currentTime+1);
    photonSound.filter.Q.linearRampToValueAtTime(3, audioContext.currentTime+1.1);
   
}

function PlayExplosion()
{
    freqSelect = 2;
    waveform = 0;
    noiseSelect = 0;
    (new FMSynth()).play(24, audioContext.currentTime, 0.5);
  
    waveform = 4;
    noiseSelect = 0;
    explode1 = new FMSynth();
    explode1.play(0, audioContext.currentTime, 2);
    explode1.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime);
    explode1.filter.frequency.linearRampToValueAtTime(1000, audioContext.currentTime+1);
    explode1.filter.frequency.linearRampToValueAtTime(8200, audioContext.currentTime+2);
  
    explode1.filter.Q.linearRampToValueAtTime(0.1, audioContext.currentTime);
    explode1.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime+1);
    explode1.filter.Q.linearRampToValueAtTime(2.5, audioContext.currentTime+1.7);
  
    envelope = new Envelope(0, 0.9, 0.5, 1.2, 1.4);
    explode1.filter.disconnect(explode1.gainNode);
    explode1.gainNode = envelope.node(audioContext.currentTime);
    explode1.filter.connect(explode1.gainNode);
    explode1.gainNode.connect(compressor);
  
    noiseSelect = 1;
    explode2 = new FMSynth();
    explode2.play(0, audioContext.currentTime, 2);
    explode2.filter.frequency.linearRampToValueAtTime(1600, audioContext.currentTime);
    explode2.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime+1);
    explode2.filter.frequency.linearRampToValueAtTime(18000, audioContext.currentTime+2);
    explode2.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime);
    explode2.filter.Q.linearRampToValueAtTime(10.3, audioContext.currentTime+1);
    explode2.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime+2);
 
    envelope = new Envelope(0.0, 0.9, 0.4, 1.0, 2);
    explode2.filter.disconnect(explode2.gainNode);
    explode2.gainNode = envelope.node(audioContext.currentTime);
    explode2.filter.connect(explode2.gainNode);
    explode2.gainNode.connect(compressor);
    
}

function PlayExplosionThud()
{
    freqSelect = 2;
    waveform = 0;
    noiseSelect = 0;
    (new FMSynth()).play(24, audioContext.currentTime, 0.5);
  
    waveform = 4;
    noiseSelect = 0;
    explode1 = new FMSynth();
    explode1.play(0, audioContext.currentTime, 0.6);
    explode1.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime);
    explode1.filter.frequency.linearRampToValueAtTime(1000, audioContext.currentTime+1);

  
    explode1.filter.Q.linearRampToValueAtTime(0.1, audioContext.currentTime);
    explode1.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime+1);
    explode1.filter.Q.linearRampToValueAtTime(2.5, audioContext.currentTime+1.7);
  
    envelope = new Envelope(0, 0.9, 0.5, 1.2, 1.4);
    explode1.filter.disconnect(explode1.gainNode);
    explode1.gainNode = envelope.node(audioContext.currentTime);
    explode1.filter.connect(explode1.gainNode);
    explode1.gainNode.connect(compressor);
  
    noiseSelect = 1;
    explode2 = new FMSynth();
    explode2.play(0, audioContext.currentTime, 0.6);
    explode2.filter.frequency.linearRampToValueAtTime(1600, audioContext.currentTime);
    explode2.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime+1);
    explode2.filter.frequency.linearRampToValueAtTime(18000, audioContext.currentTime+2);
    explode2.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime);
    explode2.filter.Q.linearRampToValueAtTime(10.3, audioContext.currentTime+1);
    explode2.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime+2);
 
    envelope = new Envelope(0.0, 0.9, 0.4, 1.0, 2);
    explode2.filter.disconnect(explode2.gainNode);
    explode2.gainNode = envelope.node(audioContext.currentTime);
    explode2.filter.connect(explode2.gainNode);
    explode2.gainNode.connect(compressor);
    
}



function PlayHyperspace()
{
    waveform = 4;
    noiseSelect = 2;
    photonSound = new FMSynth();
    photonSound.play(0, audioContext.currentTime, 8);
    photonSound.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime);
    photonSound.filter.frequency.linearRampToValueAtTime(1000, audioContext.currentTime+2);     photonSound.filter.frequency.linearRampToValueAtTime(2500, audioContext.currentTime+8);
    photonSound.filter.Q.linearRampToValueAtTime(25, audioContext.currentTime);
    photonSound.filter.Q.linearRampToValueAtTime(8, audioContext.currentTime+1);
    photonSound.filter.Q.linearRampToValueAtTime(5, audioContext.currentTime+1.1);
    photonSound.filter.Q.linearRampToValueAtTime(19, audioContext.currentTime+5.1);
}

function PlayExit(time)
{
    time+=audioContext.currentTime;
    waveform = 4;
    noiseSelect = 2;
    photonSound = new FMSynth();
    photonSound.play(0, time, 2);
    photonSound.filter.frequency.linearRampToValueAtTime(2500, time);
    photonSound.filter.frequency.linearRampToValueAtTime(100, time+2);     
    photonSound.filter.Q.linearRampToValueAtTime(21, time);
    photonSound.filter.Q.linearRampToValueAtTime(8, time+2);


}


function PlayPhoton(button)
{
    waveform = 3;
    freqSelect = 1;
    photonTone= new FMSynth();
    photonTone.gainNode.gain.value = 0.25;
    photonTone.play(0, audioContext.currentTime, 2);
    photonTone.oscilator.frequency.linearRampToValueAtTime(600,audioContext.currentTime);
    photonTone.oscilator.frequency.linearRampToValueAtTime(155,audioContext.currentTime+0.2);
    photonTone.oscilator.frequency.linearRampToValueAtTime(0,audioContext.currentTime+1.4);
    photonTone.gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime);     photonTone.gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime+1.5);
    photonTone.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime+2);

    waveform = 4;
    freqSelect = 1;
    noiseSelect = 0;
  
    photonSound = new FMSynth();
    photonSound.gainNode.gain.value = 0.25;
    photonSound.play(0, audioContext.currentTime, 1.5);
    photonSound.filter.frequency.linearRampToValueAtTime(1000, audioContext.currentTime);
    photonSound.filter.frequency.linearRampToValueAtTime(38000, audioContext.currentTime+2);
    photonSound.filter.Q.linearRampToValueAtTime(5, audioContext.currentTime);
    photonSound.filter.Q.linearRampToValueAtTime(2, audioContext.currentTime+0.5);
    photonSound.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime+1.2);

    photonSound.gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime);    photonSound.gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime+1.5);
    photonSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime+2);
}

function PlayShield()
{
    freqSelect = 0;
    waveform = 4;
    noiseSelect = 1;
    var shield = new FMSynth();
    shield.play(24, audioContext.currentTime, 0.25);
    shield.filter.type = 'highpass';
    shield.filter.frequency.linearRampToValueAtTime(13000, audioContext.currentTime);
    shield.filter.frequency.linearRampToValueAtTime(5000, audioContext.currentTime+0.25);
  
    shield.filter.Q.linearRampToValueAtTime(1, audioContext.currentTime);
    shield.filter.Q.linearRampToValueAtTime(12, audioContext.currentTime+0.25);
  
    PlayExplosionThud();
}

function InitEngine()
{
    waveform = 4;
    noiseSelect = 2;
    hyperSound = new FMSynth();
    hyperSound.play(0, audioContext.currentTime,-1);
    hyperSound.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime);
    hyperSound.filter.Q.linearRampToValueAtTime(8, audioContext.currentTime);
    hyperSound.gainNode.gain.value = 0.3;
}

function PlayEngine(velocity)
{
    hyperSound.filter.frequency.linearRampToValueAtTime(100+velocity*25, audioContext.currentTime);
    hyperSound.filter.Q.linearRampToValueAtTime(8, audioContext.currentTime+freqHz);
//    hyperSound.gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime+1);
}

function StopEngine()
{
    if (hyperSound)
    {
        hyperSound.stop();
        hyperSound = null;
    }
}

function PlayBeginHyperspace()
{
    hyperSound.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime);
    hyperSound.filter.Q.linearRampToValueAtTime(25, audioContext.currentTime);
    hyperSound.gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime+2);
}

function UpdateHyperspaceSound(velocity)
{
    hyperSound.filter.frequency.linearRampToValueAtTime(100+velocity*25, audioContext.currentTime+freqHz);
    hyperSound.filter.Q.linearRampToValueAtTime(Math.abs(velocity-50)*0.4, audioContext.currentTime+freqHz);
}

function PauseHyperspaceSound(time)
{
    hyperSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime);
    hyperSound.gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime+time);
}

function CancelHyperSound(time)
{
   hyperSound.filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime+time);
   hyperSound.filter.Q.linearRampToValueAtTime(8, audioContext.currentTime+time);
   hyperSound.gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime+time+2);
}


function PlayNoise(button)
{
   noiseSelect = (noiseSelect+1)%3;
}

createWhiteNoiseBuffer = function(bufferSize)
{
  var bufSize = bufferSize || 131072;
  whiteNoiseBuffer = audioContext.createBuffer(1, bufSize, audioContext.sampleRate);
  var dataChannel = whiteNoiseBuffer.getChannelData(0);
  
  console.log(dataChannel.length);
  for (var i=0; i<dataChannel.length; i++)
  {
     dataChannel[i] = Math.random()*2-1;
  }
  
}


createPinkNoiseBuffer = function(bufferSize) 
{
    var bufSize = bufferSize || 131072;
    pinkNoiseBuffer = audioContext.createBuffer(1, bufSize, audioContext.sampleRate);
    var output = pinkNoiseBuffer.getChannelData(0);

  var b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (var i = 0; i < output.length; i++) 
     {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }

};

createBrownNoiseBuffer = function(bufferSize) 
{
   var bufSize = bufSize || 131072;
   var lastOut = 0.0;
    brownNoiseBuffer = audioContext.createBuffer(1, bufSize, audioContext.sampleRate);
    var output = brownNoiseBuffer.getChannelData(0);

    for (var i = 0; i < output.length; i++)
     {
      var white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // (roughly) compensate for gain
    }
};

// entry point
//init();
//SetupButtons();
//animate();

// export
window.PlayConfirm = PlayConfirm;
window.PlayExit = PlayExit;
window.PlayShield = PlayShield;
window.PlayEngine = PlayEngine;
window.PlayPhoton = PlayPhoton;
window.InitEngine = InitEngine;
window.PlayRedAlert = PlayRedAlert;
window.PlayBeginHyperspace = PlayBeginHyperspace;
window.PlayDisruptor = PlayDisruptor;
window.PlayExplosion = PlayExplosion;
window.PlayExplosionThud = PlayExplosionThud;
window.UpdateHyperspaceSound = UpdateHyperspaceSound;


})();
