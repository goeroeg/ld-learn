const { app, BrowserWindow } = require('electron')

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    icon: 'favicon.png',
//    fullscreen: true,
    webPreferences: {
      nodeIntegration: false
    }
  })

  // remove menu bar
  // win.removeMenu();
//  win.setMenuBarVisibility(false) // with this the shortcuts still work

  win.on('leave-full-screen', function() {
    // disable menu after being fullscreen
//    win.setMenuBarVisibility(false)
  })

  // and load the index.html of the app.
  win.loadFile('ld-robot.html')

  // Open all links in external browser
  var handleRedirect = (e, url) => {
    if(url != win.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }
  
  win.webContents.on('will-navigate', handleRedirect)
  win.webContents.on('new-window', handleRedirect)

  // Open the DevTools.
  //win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.