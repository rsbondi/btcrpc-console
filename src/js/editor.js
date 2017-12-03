// require node modules before loader.js comes in
var path = require('path');
function uriFromPath(_path) {
  var pathName = path.resolve(_path).replace(/\\/g, '/');
  if (pathName.length > 0 && pathName.charAt(0) !== '/') {
    pathName = '/' + pathName;
  }
  return encodeURI('file://' + pathName);
}
amdRequire.config({
  baseUrl: uriFromPath(path.join(__dirname, '../../node_modules/monaco-editor/min'))
});
// workaround monaco-css not understanding the environment
self.module = undefined;
// workaround monaco-typescript not understanding the environment
self.process.browser = true;

const registerTokens = function(helpers) {
  monaco.languages.setMonarchTokensProvider('bitcoin-rpc', {
    tokenizer: {
      root: [
        [/([a-zA-Z_\$][\w\$]*)(\s*)(:?)/, {
          cases: { '$1@keywords': ['keyword', 'white', 'delimiter'] }
        }],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/"/, 'string', '@string."'],
        [/'/, 'string', '@string.\''],
        [/\d+\.\d*(@exponent)?/, 'number.float'],
        [/\.\d+(@exponent)?/, 'number.float'],
        [/\d+@exponent/, 'number.float'],
        [/0[xX][\da-fA-F]+/, 'number.hex'],
        [/0[0-7]+/, 'number.octal'],
        [/\d+/, 'number'],
     ],
     string: [
        [/[^\\"']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/["']/, {
          cases: {
            '$#==$S2': { token: 'string', next: '@pop' },
            '@default': 'string'
          }
        }]
      ],

    },
    keywords: helpers.concat('true', 'false', 'null',),
    exponent: /[eE][\-+]?[0-9]+/,
    escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,

  
  });

}

const init = function(editor) {

  var execCommandId = editor.addCommand(0, function (wtf, line) { // don't knnow what first argument is???
    const pos = editor.getPosition()
    editor.setPosition({lineNumber: line, column: 1})
    editor.getAction('action-execute-command').run()
    editor.setPosition(pos)
  }, '');
  monaco.languages.registerCodeLensProvider('bitcoin-rpc', {
    provideCodeLenses: function (model, token) {
      return model.getLinesContent().reduce((o, c, i) => {
        let word = ''
        const lineNumber = i+1
        const wordAtPos = model.getWordAtPosition({ lineNumber: lineNumber, column: 1 })
        if (wordAtPos) word = wordAtPos.word
        if (word && ~window.helpers.map(h => h.command).indexOf(word)) 
          o.push(
            {
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber+1,
                endColumn: 1
              },
              id: "lens item"+lineNumber,
              command: {
                id: execCommandId,
                title: "Execute",
                arguments: [lineNumber]
              }
            }

          )
          return o
      },[])
    },
    resolveCodeLens: function (model, codeLens, token) {
      return codeLens;
    }
  });  
  monaco.languages.registerCompletionItemProvider('bitcoin-rpc', {
    provideCompletionItems: function (model, position) {
      return window.helpers.reduce((o, c) => {
        o.push({
          label: c.command,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: c.help
        })
        return o
      },[])
    }
  });  

  monaco.languages.registerHoverProvider('bitcoin-rpc', {
    provideHover: function (model, position) {
      let word = ''
      const wordAtPos = model.getWordAtPosition(position)
      if (wordAtPos) word = wordAtPos.word

      if(word && ~window.helpers.map(h => h.command).indexOf(word)) {
        return window.postRPC({ method: 'help', params: [word] }).then(response => {
          return {
            contents: [
              `**${word}**`,
              { language: 'text', value: response.result }
            ]
          }
        })
      }
    }
  });

  monaco.languages.registerSignatureHelpProvider('bitcoin-rpc', {
    provideSignatureHelp: function (model, position) {
      let word = ''
      const wordAtPos = model.getWordAtPosition({ lineNumber: position.lineNumber, column: 1 })
      if(wordAtPos) word = wordAtPos.word
      if(word) return window.postRPC({ method: 'help', params: [word] }).then(response => { 
        let lines = response.result.split("\n")
        let args = false, desc = false
        const obj = lines.reduce((o, c, i) => {
          if (!c && args) {
            args = false
          }
          else if (c.match(/Arguments/)) args = true
          else if (args) {
            let ltokens = c.split(/\s+/)
            if (ltokens[0].match(/[0-9]+\./))
              o.params[ltokens[1].replace(/"/g, '')] = ltokens.slice(2).join(' ')
          }
          else if (i > 1 && !c) desc = true
          else if (i > 0 && !desc) o.desc += c + "\n"
          return o
        }, { params: {}, desc: '' })
        obj.desc = obj.desc.replace(/(^\n|\n$)/, '')
        const index = model.getLinesContent()[position.lineNumber-1].slice(0, position.column-1).split(' ').length - 2
        const params = Object.keys(obj.params).map(k => { return {label: k, documentation: obj.params[k]}})
        if(index >-1 && index < params.length)
          return {
            activeSignature: 0,
            activeParameter: index,
            signatures: [
              {
                label: lines[0],
                parameters: params
              }
            ]
          }
        else return {}
      })
      else return {}

    },
    signatureHelpTriggerCharacters:[' ']
  })

}

module.exports = {
  require: amdRequire,
  registerTokens: registerTokens,
  init: init,
  commandConfig: {
    value: '',
    language: 'bitcoin-rpc',
    folding: true,
    fontSize: '10px',
    glyphMargin: false,
    lineNumbers: false,
    // theme: "vs-dark",
    minimap: { enabled: false },
    scrollbar: { vertical: 'hidden' }
  },
  displayConfig: {
    value: '',
    language: 'javascript',
    readOnly: true,
    folding: true,
    lineNumbers: false,
    fontSize: '10px'
  }
}
