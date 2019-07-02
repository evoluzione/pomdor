const { ipcRenderer } = require("electron");

ipcRenderer.on("play", (_, audio) => {
  var player = new Audio(audio);
  player.play();
});

const progressCurrent = document.querySelectorAll(".js-progress-current");
const drawProgress = () => {
  progressCurrent.forEach(path => {
    // Get the length of the path
    let length = path.getTotalLength();

    // Just need to set this once manually on the .meter element and then can be commented out
    // path.style.strokeDashoffset = length;
    // path.style.strokeDasharray = length;

    // Get the value of the meter
    let value = parseInt(path.parentNode.getAttribute("data-value"));
    // Calculate the percentage of the total length
    let to = length * ((100 - value) / 100);
    // Trigger Layout in Safari hack https://jakearchibald.com/2013/animated-line-drawing-svg/
    path.getBoundingClientRect();
    // Set the Offset
    path.style.strokeDashoffset = Math.max(0, to);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  [].forEach.call(document.querySelectorAll(".js-audio"), function(el) {
    el.addEventListener("click", () => {
      el.classList.toggle("fa-volume-mute");
      el.classList.toggle("fa-volume-up");
      ipcRenderer.send("audioToggled");
      //player.paused ? player.play() : player.pause();
    });
  });

  [].forEach.call(document.querySelectorAll(".js-settings"), function(el) {
    el.addEventListener("click", () => {
      const a = document.getElementById("js-panel");
      a.classList.toggle("is-active");
      el.classList.toggle("fa-times-circle");
      el.classList.toggle("fa-sliders-h");
    });
  });

  drawProgress();
});

const quit = document.getElementById("js-quit");
quit.addEventListener("click", () => {
  ipcRenderer.send("quit");
});

const total = document.getElementById("js-step-total");
const progress = document.getElementById("js-progress");
const progressTime = document.getElementById("js-progress-time");
const stepName = document.getElementById("js-step-name");
ipcRenderer.on("updateTimer", (_, timer) => {
  progressTime.innerHTML = timer.time;
  progress.setAttribute('data-value', timer.progress);
  drawProgress();
  if (timer.type == "pause" || timer.type == "") {
    document.body.classList.add("is-pause");
    stepName.innerHTML = 'Pause';
    total.innerHTML = '';
  } else {
    total.innerHTML = timer.total;
    stepName.innerHTML = timer.name + ' - ';
    document.body.classList.remove("is-pause");
  }
});
