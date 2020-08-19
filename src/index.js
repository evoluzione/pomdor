const { ipcRenderer } = require("electron");
const storage = require("electron-json-storage");
const package = require("../package.json");
const version = document.getElementById("js-version");
version.innerHTML = package.version;

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
};

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

const save = document.getElementById("js-save");
const luxaforId = document.getElementById("luxaforId");
const disabled = document.getElementById("disabled");
const icon = document.getElementById("icon");

storage.get("settings", function(error, data) {
  if (error) throw error;
  luxaforId.value = data.luxaforId;
  disabled.checked = data.disabled;
});

save.addEventListener("click", () => {
  const panel = document.getElementById("js-panel");
  storage.set(
    "settings",
    {
      luxaforId: luxaforId.value,
      disabled: disabled.checked
    },
    error => {
      if (error) throw error;
      ipcRenderer.send("settingsSaved");
      panel.classList.toggle("is-active");
      icon.classList.toggle("is-active");
      icon.classList.toggle("fa-times-circle");
      icon.classList.toggle("fa-sliders-h");
    }
  );
});

const total = document.getElementById("js-step-total");
const progress = document.getElementById("js-progress");
const progressTime = document.getElementById("js-progress-time");
const stepName = document.getElementById("js-step-name");
ipcRenderer.on("updateTimer", (_, timer) => {
  progressTime.innerHTML = timer.time;
  progress.setAttribute("data-value", timer.progress);
  drawProgress();
  if (timer.type === "pause") {
    document.body.classList.add("is-pause");
    document.body.classList.remove("is-long-pause");
    document.body.classList.remove("is-null");
    stepName.innerHTML = "Pause";
    total.innerHTML = "";
  } else if (timer.type === "longpause") {
    document.body.classList.remove("is-pause");
    document.body.classList.add("is-long-pause");
    document.body.classList.remove("is-null");
    stepName.innerHTML = "Long Pause";
    total.innerHTML = "";
  } else if (timer.type === "") {
    document.body.classList.remove("is-pause");
    document.body.classList.remove("is-long-pause");
    document.body.classList.add("is-null");
    stepName.innerHTML = "";
    total.innerHTML = "";
  } else {
    total.innerHTML = timer.total;
    stepName.innerHTML = timer.name + " - ";
    document.body.classList.remove("is-pause");
    document.body.classList.remove("is-long-pause");
    document.body.classList.remove("is-null");
  }
});

const flash = document.getElementById("js-message");
ipcRenderer.on("message", (_, text) => {
  flash.innerHTML = text;
});
