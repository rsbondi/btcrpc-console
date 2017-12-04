const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = require('fs')

const menu = new Menu()

function saveEditor(editor) {
  var savePath = dialog.showSaveDialog({});
  if (savePath) {
    fs.writeFile(savePath, editor.getValue(), function (err) {
      console.log('savePath', err)
    });
  }
}

function loadEditor(editor) {
  dialog.showOpenDialog(function (fileNames) {
    if (fileNames === undefined) return;
    var fileName = fileNames[0];
    fs.readFile(fileName, 'utf-8', function (err, data) {
      editor.setValue(data)
    });

  });

}

menu.append(new MenuItem({
  label: 'Command',
  submenu: [
    { label: 'Execute at Cursor', click() { window.commandEditor.getAction('action-execute-command').run() } },
    { label: 'Save', click() { saveEditor(window.commandEditor) } },
    { label: 'Load', click() { loadEditor(window.commandEditor) } },
  ]
}))
menu.append(new MenuItem({
  label: 'Console',
  submenu: [
    { label: 'Clear', click() { window.resultEditor.getAction('action-result-clear-command').run() } },
    { label: 'Save', click() { saveEditor(window.resultEditor) } },
    { label: 'Load', click() { loadEditor(window.resultEditor) } },
  ]
}))
Menu.setApplicationMenu(menu)

const argv = require('electron').remote.process.argv
const consoleCommand = document.querySelector('#console-command')
const consoleDisplay = document.querySelector('.console')
let helpers = []
const os = require('os')
let user, password, host, port
const editorModule = require('./js/editor')

const args = argv.reduce((o, c) => {
  const a = c.match(/^-([^=]+)=(.+)$/)
  if(a) o[a[1]] = a[2]
  return o
},{})

port = args.port || '8332'
host = args.host || '127.0.0.1'

const config = fs.readFileSync(args.config || `${os.homedir()}/.bitcoin/bitcoin.conf`, 'utf8');
config.split('\n').forEach(line => {
  let rpcuser = line.match(/^\s?rpcuser\s?=\s?([^#]+)$/)
  if (rpcuser) user = rpcuser[1]
  let rpcpass = line.match(/^\s?rpcpassword\s?=\s?([^#]+)$/)
  if (rpcpass) password = rpcpass[1]
})

// document.querySelector('#clear-console').addEventListener('click', () => resultEditor.setValue(''))

const getHelp = function() {
  if(!window.helpers)
    post({method: 'help'}).then(response => {
      window.helpers = response.result.split('\n').reduce((o, c, i) => {
        if(c && !c.indexOf('==')==0) {
          const pieces = c.split(' ')
          o.push({command: pieces[0], help: pieces.length>1 ? pieces.slice(1).join(' ') : ''})
        }
        return o
      }, [])
      editorModule.registerTokens(window.helpers.map(h => h.command))
    })
  resultEditor.layout()
  commandEditor.layout()
  commandEditor.focus()

}

let consoleBuffer = []
let consoleBufferIndex = 0

function post(payload) {
  payload.jsonrpc = "1.0"
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    /* Subresource requests whose URLs contain embedded credentials (e.g. `https://user:pass@host/`) are deprecated, and will be blocked in M59, around June 2017. 
       See https://www.chromestatus.com/feature/5669008342777856 for more details. */
    xhr.open("POST", `http://${user}:${encodeURIComponent(password)}@${host}:${port}`, true); 
    // xhr.open("POST", 'http://127.0.0.1:8332', true); // this with auth header does not work

    xhr.setRequestHeader("Content-type", "text/plain");
    // xhr.setRequestHeader("Authorization", "Basic " + window.btoa("bitcoinrpc:password")); // does not work

    xhr.onload = function () {
      // if (xhr.status >= 200 && xhr.status < 400) {
        let resp = xhr.responseText;
        let js = JSON.parse(resp)
        resolve(js)

      // } else {
      //   reject(xhr.status)
      // }
    };

    xhr.onerror = function () {
      reject(xhr.status)
    };

    xhr.send(JSON.stringify(payload))
  })
 
}
window.postRPC = post
let helpContent = {} // cache help content
window.getHelpContent = function(key) {
  if(!~window.helpers.map(h => h.command).indexOf(key)) {
      return new Promise(resolve => resolve({results:[]}))
  }
  if(helpContent[key]) {
      let promise = new Promise((resolve, reject) => {
          resolve(helpContent[key])
      })
      return promise
  } else return window.postRPC({ method: 'help', params: [key] }).then(resp => {
      helpContent[key] = resp
      return resp
    })
}

editorModule.require(['vs/editor/editor.main'], function () {
  const resultModule = require('./js/resultEditor')
  const commandModule = require('./js/commandEditor')
  monaco.languages.register({ id: 'bitcoin-rpc' });
  window.resultEditor = monaco.editor.create(consoleDisplay, editorModule.displayConfig);
  window.commandEditor = monaco.editor.create(consoleCommand, editorModule.commandConfig);
  window.addEventListener('resize', () => { resultEditor.layout(); commandEditor.layout();})
  editorModule.init(window.commandEditor)

  const editorResult = new resultModule.ResultEditor(window.resultEditor, window.commandEditor)
  const editorCommand = new commandModule.CommandEditor(window.commandEditor, window.resultEditor)

  getHelp()
});
