const { app, Menu, Tray, BrowserWindow, ipcMain, Notification } = require("electron");
const notifier = require("node-notifier");
const path = require("path");
let options = {};
let window = undefined
if (process.platform !== "darwin") {
  options = {
    player: path.join(__dirname, "../lib/mplayer.exe")
  };
}
var player = require("play-sound")(options);
const moment = require("moment");
moment.locale("it");

const timers = require("./timers.json");

const fs = require("fs");
const audioPath = path.join(__dirname, "../audio");

let audios = fs.readdirSync(audioPath);
audios = audios.map(x => `${audioPath}/${x}`);

let tray = undefined;
let colorActive = "\u001b[31m";
let backgroundActive = "\u001b[41;1m";
let colorPause = "\u001b[32m";
let backgroundPause = "\u001b[42;1m";
let icon;

if (process.platform === "darwin") {
  icon = path.resolve(__dirname, "pomdor-mac.png");
} else {
  icon = path.resolve(__dirname, "pomdor-win-black.png");
}

const updateTimers = () => {
  timers.forEach(t => {
    t.startMoment = moment(t.start, "LTS");
    t.endMoment = moment(t.end, "LTS");
  });
};
updateTimers();

const createTray = () => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "About",
      click() {
        require("electron").shell.openExternalSync(
          "https://www.evoluzionetelematica.it"
        );
      }
    },
    {
      type: 'separator'
    },
    {
      label: "Quit Pomdor",
      click() {
        app.quit();
      }
    }
  ]);
  tray = new Tray(icon);
  tray.setToolTip("Pomdor");
  //tray.setContextMenu(contextMenu);
  tray.on('click', function (event) {
    toggleWindow()
  });
};

const setNull = () => {
  tray.setTitle("🕹️");
  if (process.platform !== "darwin") {
    tray.setToolTip("🕹️");
    tray.setImage(path.resolve(__dirname, "pomdor-win-black.png"));
  }
};

const setWork = (name, minute, second) => {
  tray.setTitle("🍅 " + colorActive + name + " - " + minute + ":" + second);

  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + minute + ":" + second);
    tray.setImage(path.resolve(__dirname, "pomdor-win-red.png"));
  }
};

const setPause = (name, minute, second) => {
  tray.setTitle("🍌 " + colorPause + name + " - " + minute + ":" + second);
  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + minute + ":" + second);
    tray.setImage(path.resolve(__dirname, "pomdor-win-green.png"));
  }
};

const setBoh = () => {
  tray.setTitle("😴 Boh");
  if (process.platform !== "darwin") {
    tray.setToolTip("😴 Boh");
    tray.setImage(path.resolve(__dirname, "pomdor-win-black.png"));
  }
};

const notify = (minute, second, pause) => {
  if (minute === "00" && second === "01") {
    notifier.notify({
      title: "Pomdor",
      message: pause ? "🍅 Pomodoro" : "🍌 Pausa"
    });
    playSound();
  }
};

const playSound = () => {
  let audio = audios[Math.floor(Math.random() * audios.length)];
  player.play(audio, function(err) {
    if (err) throw err;
  });
};

function update() {

  let date = moment();
  let timer = null;

  if (timers[0].startMoment.date() != date.date()) updateTimers();

  timers.forEach(t => {
    if (date.isBetween(t.startMoment, t.endMoment)) timer = t;
  });

  let minute =
    timer != null
      ? timer.length + timer.startMoment.diff(date, "minutes") - 1
      : 0;

  let second =
    timer != null ? 60 - (date.second() - timer.startMoment.second()) : 0;

  minute = minute < 10 ? `0${minute}` : minute;
  second = second < 10 ? `0${second}` : second;
  type = timer != null ? timer.type : "";
  name = timer != null ? timer.name : "";

  if (timer === null) {
    setNull();
  } else if (type === "work") {
    setWork(name, minute, second);
    notify(minute, second, false);
  } else if (type === "pause") {
    setPause(name, minute, second);
    notify(minute, second, true);
  } else {
    setBoh();
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
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y + trayBounds.height + 4);
  return {x: x, y: y};
}

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
    webPreferences: {
      nodeIntegration: true,
      //backgroundThrottling: false
    }
  })
  window.loadURL(`file://${path.join(__dirname, 'index.html')}`)

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })
}

const toggleWindow = () => {
  window.isVisible() ? window.hide() : showWindow();
}

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);
  window.show();
}

ipcMain.on('show-window', () => {
  showWindow()
})