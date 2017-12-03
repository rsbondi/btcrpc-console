class ResultEditor {
  constructor(editor, command) {
    this.editor = editor
    this.commandEditor = command

    this.editor.addAction({
      id: 'action-result-clear-command',
      label: 'Clear Console',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_L
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.1,
      run: function (ed) {
        ed.setValue('')
        return null;
      }
    })

    this.addInsertAction()
  }

  addInsertAction() {
    const self = this
    this.editor.addAction({
      id: 'action-id-insert-command',
      label: 'Add to command',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.1,
      run: function (ed) {
        const word = ed.getModel().getWordAtPosition(ed.getPosition())
        if (word) {
          const cmd = self.commandEditor.getPosition()
          self.commandEditor.executeEdits('', [
            { range: commandEditor.getSelection().cloneRange(), text: word.word }
          ])
          const col = cmd.column + word.word.length
          self.commandEditor.setSelection(new monaco.Range(cmd.lineNumber, col, cmd.lineNumber, col))
          self.commandEditor.focus()
        }
        return null;
      }
    });
  }
  
}

module.exports = {
  ResultEditor: ResultEditor
}