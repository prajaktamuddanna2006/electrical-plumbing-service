const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  console.log("Creating Electron window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,

    icon: path.join(__dirname, "icon.ico"),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.on("closed", () => {
    console.log("Electron window closed.");
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Frontend loaded successfully.");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, url) => {
      console.error(
        "Frontend load failed:",
        errorCode,
        errorDescription,
        url
      );
    }
  );

  const frontendPath = app.isPackaged
  ? path.join(process.resourcesPath, "frontend-dist", "index.html")
  : path.join(__dirname, "..", "frontend", "dist", "index.html");

mainWindow.loadFile(frontendPath).catch((error) => {
  console.error("Unable to load frontend:", error.message);
});
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  console.log("All Electron windows closed.");

  if (process.platform !== "darwin") {
    app.quit();
  }
});
