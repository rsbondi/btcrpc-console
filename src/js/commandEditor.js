class CommandEditor {
  constructor(editor, result) {
    this.editor = editor
    this.resultEditor = result
    this.addExecuteAction()
  }

  appendToEditor (editor, text) {
    const lineCount = editor.getModel().getLineCount();
    const lastLineLength = editor.getModel().getLineMaxColumn(lineCount);

    const range = new monaco.Range(lineCount, lastLineLength, lineCount, lastLineLength);

    editor.updateOptions({ readOnly: false })
    editor.executeEdits('', [
      { range: range, text: text }
    ])
    editor.updateOptions({ readOnly: true })
    editor.setSelection(new monaco.Range(1, 1, 1, 1))
    editor.revealPosition({ lineNumber: editor.getModel().getLineCount(), column: 0 })

  }
  addExecuteAction() {
    const self = this
    this.editor.addAction({
      id: 'action-execute-command',
      label: 'Execute RPC command',
      keybindings: [
        monaco.KeyCode.F5
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.1,
      run: function (ed) {
        let multival = ''
        for (let i = ed.getPosition().lineNumber; i<ed.getModel().getLineCount()+1; i++) {
          let tmpline = ed.getModel().getLineContent(i)
          const tokens = monaco.editor.tokenize(tmpline, 'bitcoin-rpc')
          console.log('line tokens', tokens)
          if (i == ed.getPosition().lineNumber) {
            multival += tmpline
          } else {
            tmpline = tmpline.replace(/^\s+/,'')
            if(!tmpline) break;
            const words = tmpline.split(/\s+/)
            if(~window.helpers.map(w => w.command).indexOf(words[0])) break
            multival += tmpline
          }
        }
        const val = multival //ed.getModel().getLineContent(ed.getPosition().lineNumber).replace(/[\n\r]+/, '')
        let chunks = val.split(' ') // TODO: better parsing to account for varying json format
        const method = chunks[0]
        let params = []
        if (chunks.length > 1) {
          try {
            params = chunks.slice(1).map(c => JSON.parse(c))
          } catch (err) {
            self.appendToEditor(self.resultEditor, `Parse error: ${val} - ${err}\n\n`)
            return
          }
        }
        consoleBuffer.unshift(val)
        post({ method: method, params: params }).then(response => {
          let content = val + '\n'
          content += JSON.stringify(response, null, 2) + '\n\n'
          self.appendToEditor(self.resultEditor, content)
        }).catch(err => console.log)
        return null;
      
      }
    });

  }
}

module.exports = {
  CommandEditor: CommandEditor
}