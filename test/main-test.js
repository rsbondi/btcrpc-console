var Application = require('spectron').Application
var assert = require('assert')

var electronPath = `${__dirname}/../node_modules/.bin/electron`

var cfg = {
  path: electronPath,
  args: [__dirname + '/../src/main.js']
}

var app = new Application(cfg)
async function runTests() {
  try {
    await app.start()
    const isVisible = await app.browserWindow.isVisible()
    assert.equal(isVisible, false, 'Window is visible')
  
    const title = await app.client.getTitle()
    assert.equal(title, 'bitcoin RPC console', 'Verify Title')
  
    console.log('All tests passed')
    app.stop()

  } catch(error) {
    console.error('Test failed', error.message)
    app.stop()
  }
}
runTests()
