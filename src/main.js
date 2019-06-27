const {
  app,
  Menu,
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
      type: "separator"
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
  tray.on("click", function(event) {
    toggleWindow();
  });
};

const setNull = () => {
  tray.setTitle("🕹️");
  if (process.platform !== "darwin") {
    tray.setToolTip("🕹️");
    tray.setImage(path.resolve(__dirname, "pomdor-win-black.png"));
  }
};

const setWork = (name, time) => {
  tray.setTitle("🍅 " + colorActive + name + " - " + time);

  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + time);
    tray.setImage(path.resolve(__dirname, "pomdor-win-red.png"));
  }
};

const setPause = (name, time) => {
  tray.setTitle("🍌 " + colorPause + name + " - " + time);
  if (process.platform !== "darwin") {
    tray.setToolTip(name + " - " + time);
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

const notify = (time, pause) => {
  if (time === "00:01") {
    var notification = new Notification({
      title: "pomdör",
      body: pause ? "🍅 Pomodoro" : "🍌 Pausa",
      icon: icon
    });
    notification.show();
    let audio = path.join(__dirname, "../audio", "work.wav");
    if (pause) audio = path.join(__dirname, "../audio", "pause.wav");
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

  let a = moment(timer.endMoment.diff(date));
  let b = moment(timer.endMoment.diff(timer.startMoment));

  let time = moment(timer.endMoment.diff(date)).format("mm:ss");
  let type = timer != null ? timer.type : "";
  let name = timer != null ? timer.name : "";

  let typeTimers = timers.filter(t => t.type == type);

  window.webContents.send("updateTimer", {
    time: time,
    type: type,
    name: name,
    total: `${typeTimers.indexOf(timer) + 1}/${typeTimers.length}`,
    progress: Math.round((a * 100) / b)
  });

  if (timer === null) {
    setNull();
  } else if (type === "work") {
    setWork(name, time);
    notify(time, false);
  } else if (type === "pause") {
    setPause(name, time);
    notify(time, true);
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

  // Hide the window when it loses focus
  // window.on('blur', () => {
  //   if (!window.webContents.isDevToolsOpened()) {
  //     window.hide()
  //   }
  // })
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
