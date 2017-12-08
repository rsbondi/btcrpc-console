const Application = require('spectron').Application
const assert = require('assert')
const path = require('path')

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')

var cfg = {
  path: electronPath,
  args: [path.join(__dirname, '..', 'src', 'main.js')]
}

var app = new Application(cfg)
async function runTests() {
  try {
    await app.start()
    const isVisible = await app.browserWindow.isVisible()
    assert.equal(isVisible, true, 'Window is visible')
  
    const title = await app.client.getTitle()
    assert.equal(title, 'bitcoin RPC console', 'Verify Title')

    const logs = await app.client.getRenderProcessLogs();
    const errors = logs.filter(log => {
      console.log(log.message);
      console.log(log.source);
      console.log(log.level);
      return log.level == "ERROR"
    });
    assert.equal(errors.length, 0, 'no render logs');
    
    console.log('All tests passed')
    app.stop()

  } catch(error) {
    console.error('Test failed', error.message)
    app.stop()
  }
}
runTests()
