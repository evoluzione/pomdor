const {
  app,
  Tray,
  BrowserWindow,
  ipcMain,
  Notification
} = require("electron");
const path = require("path");
const moment = require("moment");
moment.locale("it");

let window = undefined;
const timers = require("./timers.json");
let tray = undefined;
let colorActive = "\u001b[31;1m";
let colorPause = "\u001b[32;1m";
let icon;

if (process.platform === "darwin") {
  icon = path.resolve(__dirname, "images/pomdor-mac.png");
} else {
  icon = path.resolve(__dirname, "images/pomdor-win-black.png");
}

const updateTimers = () => {
  timers.forEach(t => {
    t.startMoment = moment(t.start, "LTS");
    t.endMoment = moment(t.end, "LTS");
  });
};
updateTimers();

const createTray = () => {
  tray = new Tray(icon);
  tray.setToolTip("Pomdor");
  tray.on("click", function(event) {
    toggleWindow();
  });
};

const setNull = () => {
  tray.setTitle("🕹️");
  if (process.platform !== "darwin") {
    tray.setToolTip("🕹️");
    tray.setImage(path.resolve(__dirname, "images/pomdor-win-black.png"));
  }
};

const setWork = (name, time) => {
  tray.setTitle("🍅 " + colorActive + time);

  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + time);
    tray.setImage(path.resolve(__dirname, "images/pomdor-win-red.png"));
  }
};

const setPause = (name, time) => {
  tray.setTitle("🍌 " + colorPause + time);
  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + time);
    tray.setImage(path.resolve(__dirname, "images/pomdor-win-green.png"));
  }
};

const notify = (time, pause) => {
  if (time === "00:01") {
    var notification = new Notification({
      title: "pomdör",
      body: pause ? "🍅 Pomodor" : "🍌 Pause",
      silent: true,
      icon: icon
    });
    notification.show();
    let audio = path.join(__dirname, "audio", "work.wav");
    if (pause) audio = path.join(__dirname, "audio", "pause.wav");
    window.webContents.send("play", audio);
  }
};

function update() {
  let date = moment();
  let timer = null;

  if (timers[0].startMoment.date() != date.date()) updateTimers();

  timers.forEach(t => {
    if (date.isBetween(t.startMoment, t.endMoment)) timer = t;
  });

  let time = timer
    ? moment(timer.endMoment.diff(date)).format("mm:ss")
    : "00:00";
  let type = timer ? timer.type : "";
  let name = timer ? timer.name : "";
  let progress = 0;
  if (timer)
    progress = Math.round(
      (moment(timer.endMoment.diff(date)) * 100) /
        moment(timer.endMoment.diff(timer.startMoment))
    );

  let typeTimers = timers.filter(t => t.type == type);

  window.webContents.send("updateTimer", {
    time: time,
    type: type,
    name: name,
    total: `${typeTimers.indexOf(timer) + 1}/${typeTimers.length}`,
    progress: progress
  });

  if (timer === null) {
    setNull();
  } else if (type === "work") {
    setWork(name, time);
    notify(time, false);
  } else if (type === "pause") {
    setPause(name, time);
    notify(time, true);
  }
}

if (process.platform === "darwin") app.dock.hide();

app.on("ready", () => {
  createTray();
  createWindow();
  setInterval(update, 1000);
});

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();
  if (process.platform === "darwin")
    return {
      x: Math.round(trayBounds.x - windowBounds.width / 2),
      y: Math.round(trayBounds.y + trayBounds.height + 4)
    };

  return {
    x: Math.round(trayBounds.x - windowBounds.width / 2),
    y: Math.round(trayBounds.y - windowBounds.height)
  };
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 320,
    height: 450,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });
  window.loadURL(`file://${path.join(__dirname, "index.html")}`);
};

const toggleWindow = () => {
  window.isVisible() ? window.hide() : showWindow();
};

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y);
  window.show();
};

ipcMain.on("show-window", () => {
  showWindow();
});

ipcMain.on("quit", () => {
  app.quit();
});
