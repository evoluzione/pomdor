const {
	app,
	Tray,
	BrowserWindow,
	ipcMain,
	Notification,
	Menu
} = require("electron");

const path = require("path");
const request = require("superagent");
const moment = require("moment");
moment.locale("it");

const storage = require("electron-json-storage");
const { autoUpdater } = require("electron-updater");

const package = require("../package.json");

let window = undefined;
const timers = require("./timers.json");
let status = null;
let tray = undefined;
let colorActive = "\u001b[31;1m";
let colorPause = "\u001b[32;1m";
let icon;

let playSound = true;
let luxaforId = null;

storage.get("luxaforId", function (error, data) {
	if (error) throw error;
	luxaforId = data.id;
});

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
	if (process.platform !== "darwin") {
		const contextMenu = Menu.buildFromTemplate([
			{
				label: "Version: " + package.version
			},
			{
				label: "Quit",
				click: () => {
					app.quit();
				}
			}
		]);
		tray.setContextMenu(contextMenu);
	}

	tray.on("click", function (event) {
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

const notify = (time, type) => {
	if (time === "00:01") {
		var notification = new Notification({
			title: "Pomdor",
			body:
				type == "pause" || type == "longpause"
					? "🍅 Pomodor"
					: "🍌 Pause",
			silent: true,
			icon: icon
		});
		notification.show();
		let audio = path.join(__dirname, "audio", "pause-vic.mpeg");
		if (type == "pause") audio = path.join(__dirname, "audio", "work-ale.wav");
		if (type == "longpause")
			audio = path.join(__dirname, "audio", "longpause.m4a");
		if (playSound) window.webContents.send("play", audio);
	}
};

function update() {
	let date = moment();
	let timer = null;

	if (date.day === 0 || date.day === 6)
		setNull();

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

	if (luxaforId && type !== status) {
		status = type;

		let actionFields = {
			color: "custom",
			custom_color: "000000"
		};

		if (type === "work")
			actionFields = {
				color: "red"
			};
		if (type === "pause")
			actionFields = {
				color: "green"
			};
		if (type === "longpause")
			actionFields = {
				color: "yellow"
			};

		const data = {
			userId: luxaforId,
			actionFields
		};

		request
			.post("https://api.luxafor.com/webhook/v1/actions/solid_color")
			.set("Content-Type", "application/json")
			.send(data)
			.then(res => console.log(res.body))
			.catch(err => console.log(err));
	}

	if (timer === null) setNull();
	else if (type === "work") setWork(name, time);
	else if (type === "pause" || type === "longpause") setPause(name, time);
	notify(time, type);
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

ipcMain.on("audioToggled", () => {
	playSound = !playSound;
});

ipcMain.on("settingsSaved", () => {
	storage.get("luxaforId", function (error, data) {
		if (error) throw error;
		luxaforId = data.id;
	});
});

autoUpdater.on("checking-for-update", () => {
	window.webContents.send(
		"message",
		"verifica presenza nuovi aggiornamenti..."
	);
});

autoUpdater.on("update-available", info => {
	window.webContents.send("message", "aggiornamento disponibile.");
});

autoUpdater.on("update-not-available", info => {
	window.webContents.send("message", "la tua versione è aggiornata.");
});

autoUpdater.on("error", err => {
	window.webContents.send("message", "errore aggiornamento. " + err);
});

autoUpdater.on("download-progress", progressObj => {
	window.webContents.send(
		"message",
		"scaricamento in corso " + progressObj.percent + "%"
	);
});

autoUpdater.on("update-downloaded", info => {
	autoUpdater.quitAndInstall();
});

app.on("ready", function () {
	autoUpdater.checkForUpdates();
});

app.on("before-quit", event => {
	if (luxaforId) {
		request
			.post("https://api.luxafor.com/webhook/v1/actions/solid_color")
			.set("Content-Type", "application/json")
			.send({
				userId: luxaforId,
				actionFields: {
					color: "custom",
					custom_color: "000000"
				}
			})
			.then(res => console.log(res.body))
			.catch(err => console.log(err));
	}
});
