const VIDEO_FPS = 25;
const VIDEO_SEGMENT_DURATION = 7; // seconds
const VIDEO_SEGMENT_SAFETY_OFFSET = 1 / VIDEO_FPS; // seconds
const BOREDOM_TIMEOUT = 20; // seconds
const TOTAL_STATES = 32;
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const cursor = document.getElementById('cursor');
const footer = document.querySelector('footer');
const score = document.getElementById('score');
const states = [
  { //  0 |  19 | A | idle
    duration: 6,
    hotspots: [
      [ 0.25, 0.43, 0.37, 0.54, 3 ], // right fingers
      [ 0.33, 0.32, 0.41, 0.43, 5 ], // right arm
      [ 0.43, 0.24, 0.51, 0.32, [ 2, 17 ] ], // face
      [ 0.52, 0.32, 0.60, 0.43, 16 ], // left arm
      [ 0.57, 0.43, 0.69, 0.54, 1 ], // left fingers
      [ 0.41, 0.32, 0.52, 0.43, [ 18, 11, 7 ] ], // chest
      [ 0.40, 0.43, 0.54, 0.48, [ 9, 11, 7 ] ], // belly
      [ 0.40, 0.48, 0.55, 0.53, [ 14, 10 ] ], // hips
      [ 0.42, 0.53, 0.56, 0.60, [ 13, 7 ] ], // upper legs
      [ 0.43, 0.60, 0.53, 0.83, [ 15, 12 ] ], // lower legs
    ],
    bored: [ 4, 8 ]
  },
  { //  1 | 126 | A | left fingers wiggle
    duration: 1.24,
    then: 0
  },
  { //  2 | 128 | A | itch face
    duration: 1.68,
    then: 0
  },
  { //  3 | 130 | A | right fingers wiggle
    duration: 1.24,
    then: 0
  },
  { //  4 | 619 | A | whistle
    duration: 6.76,
    then: 0
  },
  { //  5 | 134 | A | itch right arm
    duration: 1.96,
    then: 0
  },
  { //  6 | 136 | A | (looped repeat?) idle [DUPE]
    duration: 3.80
  },
  { //  7 | 138 | A | giggle, switch to position B
    duration: 2.76,
    then: 33
  },
  { //  8 | 141 | A | yawn
    duration: 3.44,
    then: 0
  },
  { //  9 | 145 | A | flash belly
    duration: 2.24,
    then: 0
  },
  { // 10 | 147 | A | tease panties
    duration: 5.80,
    then: 0
  },
  { // 11 | 149 | A | squirm
    duration: 3.32,
    then: 0
  },
  { // 12 | 151 | A | wiggle legs
    duration: 2.16,
    then: 0
  },
  { // 13 | 153 | A | rub right thigh
    duration: 2.28,
    then: 0
  },
  { // 14 | 155 | A | rub left thigh (twice, once reversed)
    duration: 3.88,
    then: 0
  },
  { // 15 | 157 | A | rub left shin
    duration: 2.72,
    then: 0
  },
  { // 16 | 159 | A | itch left arm
    duration: 2.04,
    then: 0
  },
  { // 17 | 161 | A | sneeze
    duration: 3.84,
    then: 0
  },
  { // 18 | 163 | A | scrunch neck, "ooh"
    duration: 1.84,
    then: 0
  },
  { // 19 | 183 | B | ball up, grab feet
    duration: 3.00,
    then: 33
  },
  { // 20 | 185 | B | grab boobs, grunt
    duration: 2.12,
    then: 33
  },
  { // 21 | 188 | B | blow nails (right hand)
    duration: 4.88,
    then: 33
  },
  { // 22 | 191 | B | blow kiss
    duration: 2.52,
    then: 33
  },
  { // 23 | 194 | B | stroke belly inside top
    duration: 6.52,
    then: 33
  },
  { // 24 | 197 | B | squirm sensually
    duration: 2.76,
    then: 33
  },
  { // 25 | 200 | B | hide boobs behind hands
    duration: 2.72,
    then: 33
  },
  { // 26 | 203 | B | cross legs, shake finger, "ah-ah-ah"
    duration: 2.72,
    then: 33
  },
  { // 27 | 206 | B | curl up and sleep
    duration: 6,
    then: 28
  },
  { // 28 | 210 | B | wake up and uncurl
    duration: 3.64,
    then: 33
  },
  { // 29 | 212 | B | giggle, switch to position A
    duration: 2.68,
    then: 0
  },
  { // 30 | 216 | B | [DUPE] of 197
    duration: 2.76
  },
  { // 31 | 218 | B | blow away from face
    duration: 2.86,
    then: 33
  },
  { // 32 | 331 | B | "no more" hands, scream
    duration: 3.12,
    then: 33
  },
  { // 33 | 224 | B | idle
    duration: 6,
    hotspots: [
      [ 0.31, 0.24, 0.44, 0.35, 21 ], // right arm
      [ 0.46, 0.24, 0.54, 0.32, [ 22, 31 ] ], // face
      [ 0.55, 0.18, 0.66, 0.36, [ 32, 29 ] ], // left arm
      [ 0.43, 0.32, 0.56, 0.42, [ 25, 20 ] ], // chest
      [ 0.44, 0.42, 0.57, 0.48, [ 23, 24 ] ], // belly
      [ 0.43, 0.48, 0.59, 0.54, [ 26, 24, 29 ] ], // hips
      [ 0.45, 0.52, 0.68, 0.61, 29 ], // upper legs
      [ 0.47, 0.61, 0.54, 0.79, 19 ], // lower legs
    ],
    bored: 27
  },
];
let state = 0, stateHistory = [], bored = false, cursorX = 0, cursorY = 0;
let footerRect = footer.getBoundingClientRect();

function getHotspot(xpc, ypc){
  return (states[state].hotspots || []).find((hotspot)=>
    hotspot[0] <= xpc && hotspot[2] >= xpc && hotspot[1] <= ypc && hotspot[3] >= ypc
  );
}

function tickleHotspot(target){
  bored = false;
  if(Array.isArray(target)){
    // if there are multiple candidate targets, select the least-recently-seen one
    let candidateTargets = target.slice(); // clone
    stateHistory.slice().reverse().forEach(function(historyState){
      candidateTargets = candidateTargets.filter(t=>t!=historyState);
      if(0 == candidateTargets.length) candidateTargets = target.slice(); // reclone
    });
    if(0 == candidateTargets.length) candidateTargets = target.slice(); // reclone again
    target = candidateTargets[0];
  }
  state = target;
  stateHistory.push(state);
  playState();
}

function playState(){
  video.currentTime = state * VIDEO_SEGMENT_DURATION + VIDEO_SEGMENT_SAFETY_OFFSET;
  video.muted = false;
  if(video.paused) video.play();
  score.innerText = pcStatesSeen();
}

function animationFrame(){
  window.requestAnimationFrame(animationFrame);
  // Move the "cursor" to the real cursor position
  if(cursorY < footerRect.top){ // don't custom-cursor over the footer
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
  } 
  // Check if the video needs to move on or loop
  if(video.paused) return;
  if(video.currentTime < ((state * 7) + states[state].duration)) return;
  console.log('x');
  if('undefined' != typeof states[state].then) return tickleHotspot(states[state].then); // video leads to another
  playState(); // video loops

}
animationFrame();

function showHotspotOverlay(){
  const videoRect = video.getBoundingClientRect();
  canvas.top = videoRect.top;
  canvas.left = videoRect.left;
  canvas.width = videoRect.width;
  canvas.height = videoRect.height;
  const context = canvas.getContext('2d');
  (states[state].hotspots || []).forEach(function(hotspot){
    context.beginPath();
    context.rect(
      hotspot[0] * canvas.width,
      hotspot[1] * canvas.height,
      (hotspot[2] - hotspot[0]) * canvas.width,
      (hotspot[3] - hotspot[1]) * canvas.height
    );
    context.lineWidth = Math.min(canvas.width, canvas.height) / 200;
    context.strokeStyle = 'yellow';
    context.stroke();
  });
  canvas.classList.add('show');
}

// Returns a copy of stateHistory with unique copies of each state ID
function distinctStates(){
  return stateHistory.filter((v,i)=>stateHistory.indexOf(v)==i);
}

function pcStatesSeen(){
  return Math.round((distinctStates().length / TOTAL_STATES) * 100);
}

// Check for an extended period of no-activity
setInterval(function(){
  if(video.paused) return;
  if(!bored) { bored = true; return; }
  if(!states[state].bored) return;
  tickleHotspot(states[state].bored);
}, BOREDOM_TIMEOUT * 1000);

window.addEventListener('mousemove', function(e){
  cursorX = e.clientX; cursorY = e.clientY;
});

window.addEventListener('click', function(e){
  const videoRect = video.getBoundingClientRect();
  const videoXpc = (e.clientX - videoRect.left) / videoRect.width; // %age "across" video
  const videoYpc = (e.clientY - videoRect.top) / videoRect.height; // %age "down" video
  // Try to find a matching hotspot
  const hotspot = getHotspot(videoXpc, videoYpc);
  if(!hotspot) return;
  // Click the hotspot
  e.preventDefault();
  tickleHotspot(hotspot[4]);
  cursor.classList.add('active');
  setTimeout(function(){ cursor.classList.remove('active') }, states[state].duration * 1000);
});

document.addEventListener('visibilitychange', function(){
  if(document.hidden) { video.pause(); } else {
    if(video.paused) video.play();
  }
}, false);

window.addEventListener('keydown', function(e){
  if(32 == e.keyCode) { // space
    e.preventDefault();
    showHotspotOverlay();
  }
});

window.addEventListener('keyup', function(e){
  if(32 == e.keyCode) { // space
    e.preventDefault();
    canvas.classList.remove('show');
  }
});

function windowResized(){
  // Resize video
  const widescreen = (window.innerHeight * 0.791 < window.innerWidth);
  if(widescreen) {
    video.height = window.innerHeight;
    video.width = window.innerHeight * 0.791;
  } else {
    video.width = window.innerWidth;
    video.height = window.innerWidth / 0.791;
  }
  // Recalculate footer coverage
  footerRect = footer.getBoundingClientRect();
}
window.addEventListener('resize', windowResized);
setTimeout(windowResized, 100);
setTimeout(windowResized, 1000);
// USEFUL FOR DEBUGGING: setTimeout(showHotspotOverlay, 120);
