//call new Server
const {spawn} = require("child_process")

const cf = spawn("cloudflared", ["tunnel", "--url", "http://localhost:8443"])

cf.stderr.on('data', data => {
    let output = data.toString().match(/https:\/\/.*\.trycloudflare\.com/)
    if(output) {
        console.log(`new tunnel at ${output}`)
    }
})

global.WebSocket = require('ws');
global.EventEmitter = require('events').EventEmitter;
global.fs = require('fs');
global.createKeccakHash = require('keccak');
const AsyncConsole = require('asyncconsole')

global.isString = function(a){
	return typeof a === 'string';
}
global.isBool = function(a){
	return typeof a === 'boolean';
}
global.isObj = function(a){
	return typeof a === "object" && !Array.isArray(a) && a !== null;
}

let Server = require("./src/Server.js");
let config = require('./config');
global.SERVER = new Server(config);
let console = process.platform == 'win32' ? new AsyncConsole("", input => {
    try {
        console.log(JSON.stringify(eval(input)));
    } catch(e) {
        console.log(e.toString());
    }
}) : {};
