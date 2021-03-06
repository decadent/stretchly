const {ipcRenderer} = require('electron')
const Utils = require('./utils/utils')

document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())

document.getElementById('close').addEventListener('click', function (e) {
  ipcRenderer.send('finish-break', false)
})

ipcRenderer.on('breakIdea', (event, message, strictMode) => {
  if (!strictMode) {
    document.getElementById('close').style.visibility = 'visible'
  }
  if (message) {
    let breakIdea = document.getElementsByClassName('break-idea')[0]
    breakIdea.innerHTML = message[0]
    let breakText = document.getElementsByClassName('break-text')[0]
    breakText.innerHTML = message[1]
  }
})

ipcRenderer.on('progress', (event, started, duration) => {
  let progress = document.getElementById('progress')
  let progressTime = document.getElementById('progress-time')
  window.setInterval(Utils.updateProgress.bind(null, started, duration, progress, progressTime), 10)
})
