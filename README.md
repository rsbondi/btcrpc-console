# btcrpc-console

## Description
A console for use in testing a bitcoin node via the rpc interface.  Can be used instead of the bitcoin-cli or bitcoin-qt console.

## Motivation
I wanted to be able to learn the protocol, following the examples seemed difficult using the
bitcoin-cli and setting environment variables or copy pasting the results into the next command.
I found it challenging to keep track of everything.  

Also I like to work from my laptop out on the back porch, but find it impractical to run
a full node on the laptop and keeping in sync when laptop is not always in use.

This allows me to connect to my node remotely.  Also I can enter the commands in
a more friendly visible way, with everything in one place, the completion, argument help, and 
complete help on command available on hover.  Additionally, the history is visible in the 
command editor, and re-running is easy


## Features
### Command Input
* A multi line code editor for entering commands rather than a single line console input
* Code completion for all RPC commands
* Full help text when hovering a command
* Argument hints based on command entered
* Execute via keyboard, menu, command pallet or codelens
* File load and save

### Result Display
* Folding of results for better focus on results of interest
* Mini Map for easy navigation
* Insert from results to the command editor
* File load and save

## Getting started
### Installation
clone repo

`npm install`

### Usage
The bitcoin RPC server requires a username and password for access, this is set up in the 
`bitcoin.conf` file, see [bitcoin core documentation](https://en.bitcoin.it/wiki/Running_Bitcoin#Bitcoin.conf_Configuration_File) for further details

The default location for this app is `HOME/.bitcoin/bitcoin.conf`

This can be overridden from the command line with the -config flag ex. `-config=/DIRECTORY/FILE.conf` with the file containing the values of `rpcuser` and `rpcpassword` in the format of the standard `bitcoin.conf` file.

### Command line options
| Command | Description                         |
| ------- | -----------                         |
| -config | path to config file described above |
| -host   | default 127.0.0.1                   |
| -port   | default 8332(Main Net)              |

The `-port` option lets you run on test net by setting to 18332

The `-host` and `-config` options allow for remote connection

## Running

`npm start [-- [-config -port -host]]` 

Also, launch configurations are provided for vscode users

### Keyboard Shortcuts
| Command | Description                         |
| ------- | -----------                         |
| F5      | execute command at command editor cursor postion |
| CtrlCmd+i | Insert from result cursor position to command editior selection, this allows easy reuse of results as command arguments

### Entering Commands

A single command may be multi line.  Leaving a single space at the end of a line indicates an argument separation

example:
```
createmultisig 2
[
    "key1",
    "key2"
]
```
Currently argument help does not trigger on tab, see [issue](https://github.com/Microsoft/monaco-editor/issues/658)

### Packaging
install [electron-packager](https://www.npmjs.com/package/electron-packager)

and run `electron-packager .`

this will create an executable for your operating system

## Screenshot

![screenshot.png](https://github.com/rsbondi/btcrpc-console/blob/master/screenshot.png "What it looks like")
