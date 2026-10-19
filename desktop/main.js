
const { app, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {
  console.log("Creating Electron window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
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

  mainWindow.loadURL("http://localhost:5176/").catch((error) => {
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
