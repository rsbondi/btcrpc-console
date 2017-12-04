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
        let val = require('../js/editor').getCommandBlock(ed.getModel(), ed.getPosition()).map(b => b.text).join(' ')
        const tokens = monaco.editor.tokenize(val, 'bitcoin-rpc')[0]
        let chunks = val.split(' ')
        const method = chunks[0]
        let params = [], brackets = []
        if (chunks.length > 1) {
          try {
            tokens.forEach((t, ti) => {
                if(ti===0) return
                const prevToken =  tokens[ti-1] 
                const tokenVal = val.slice(t.offset, ti == tokens.length-1 ? val.length : tokens[ti+1].offset)
                if(brackets.length && t.type != "white.bitcoin-rpc") {
                     brackets[0]+= tokenVal
                     if(t.type=="bracket.square.close.bitcoin-rpc") {
                         params.push(JSON.parse(brackets[0]))
                         brackets.shift()
                     }
                     return
                }
                if(prevToken.type =="white.bitcoin-rpc") {
                    if(t.type=="bracket.square.open.bitcoin-rpc") {
                        brackets.unshift('[')
                    } else params.push(JSON.parse(tokenVal))                    
                }
            });
    
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