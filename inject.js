let script = document.head.querySelector('script:not(:empty)');
let match = script.textContent.match(/(var title[\s\S]+)(var params)/);
eval(match[1]);
let curInfo = JSON.parse(decodeURIComponent(flashvars.currVideoStr));

let loadVideoPlayer = (url, elem) => {
  let flvPlayer = flvjs.createPlayer({ type: 'flv', url });
  flvPlayer.attachMediaElement(elem);
  flvPlayer.load();
  flvPlayer.play();
  return flvPlayer;
};

let video = document.createElement('video');
video.style.cssText = 'width: 100%;';
video.style.height = document.querySelector('.positionFill').style.height;
video.controls = true;

fetch('https://unpkg.com/flv.js@1.1.0/dist/flv.min.js')
.then(r => r.text())
.then(t => eval(t))
.then(() => {
  fetch(curInfo.getVideoUrl)
  .then(r => r.json())
  .then(json => {
    let playerDOM = document.querySelector('.playMove .playWindow');
    playerDOM.parentNode.appendChild(video);
    playerDOM.parentNode.removeChild(playerDOM);
      
    let url = json.videoUrls[0];
    loadVideoPlayer(url, video);
  });
});
