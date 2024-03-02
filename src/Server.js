const Client = require("./Client.js");
const banned = require('../banned.json');
const JavaScriptObfuscator = require('javascript-obfuscator');
const http = require("http")
const fs = require('fs')
var path = require("path")
const express = require('express')
const app = express()

app.use(express.static(path.join(__dirname, '..', 'client')));
obfuscated = fs.readdirSync(path.join(__dirname, '..', 'client', 'obfuscatedscripts'))
// console.log(obfuscated)
obfuscated.forEach(o => {
    app.get("/"+o, (req, res) => {
        var src = (fs.readFileSync(__dirname+'/../client/obfuscatedscripts/'+o, 'utf8'))
        // console.log(src)
        res.send(JavaScriptObfuscator.obfuscate(src).getObfuscatedCode())
    })
});

class Server extends EventEmitter {
    constructor(config) {
        super();
        EventEmitter.call(this);
        this.server = http.createServer(
          // options,
        app).listen(config.port)
        this.eapp = app;
        
        this.eapp.get('/getUserData', async (req, res) => {
            var search = req._parsedUrl.search
                .replaceAll("?", "-")
                .replaceAll('&', '-')
                .split(/[-=]+/)
                .slice(1);
            var id = search.includes("id") ? search[search.indexOf("id") + 1] : null;
            if(id) {
                const User = require('./User.js')
                const U = new User({server: this})
                res.setHeader('Content-Type', "application/json")
                var sentJSON =  (await U.getUserDataById(id))
                let _temp = sentJSON;
                if(!search.includes("bp") && typeof _temp == 'object') {
                    _temp = {
                        color: sentJSON.color,
                        name: sentJSON.name,
                        _id: sentJSON._id,
                        tag: sentJSON.tag || false,
                    }
                }
                res.send(JSON.stringify(_temp, undefined, 2))
            }
        })

        this.wss = new WebSocket.Server({
            server: this.server,
            backlog: 100,
            verifyClient: (info) => {
                if (banned.includes((info.req.connection.remoteAddress).replace("::ffff:", ""))) return false;
                return true;
            }
        });
        this.connectionid = 0;
        this.connections = new Map();
        this.roomlisteners = new Map();
        this.rooms = new Map();
        this.wss.on('connection', (ws, req) => {
            this.connections.set(++this.connectionid, new Client(ws, req, this));
        });
        this.legit_m = ["a", "bye", "hi", "ch", "+ls", "-ls", "m", "n", "devices", "t", "chset", "userset", "chown", "kickban", "admin message", "color"]
        this.welcome_motd = config.motd || "You agree to read this message.";   
        this._id_Private_Key = config._id_PrivateKey || "boppity";
        this.defaultUsername = config.defaultUsername || "Anonymous";
        this.defaultRoomColor = config.defaultRoomColor || "#3b5054";
        this.defaultLobbyColor = config.defaultLobbyColor || "#19b4b9";
        this.defaultLobbyColor2 = config.defaultLobbyColor2 || "#801014";
        this.adminpass = config.adminpass || "Bop It";
    };
    updateRoom(data) {
        if (!data.ch.settings.visible) return;
        for (let cl of Array.from(this.roomlisteners.values())) {
            cl.sendArray([{
                "m": "ls",
                "c": false,
                "u": [data.ch]
            }])
        }
    }
}

module.exports = Server;