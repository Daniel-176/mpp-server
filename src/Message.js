const Quota = require('./Quota');
const User = require("./User.js");
const Room = require("./Room.js");
const JavaScriptObfuscator = require('javascript-obfuscator');


module.exports = (cl) => {
    function userset(type, set) {
        cl.user[type] = set;
        let user = new User(cl);
        if(cl.user.token == undefined) {
            for (let [token2, a] of user.userdb.entries()) {
                if (a.ip === cl.ip) {
                    cl.user.token = token2;
                }
            }
        }
        user.getUserData(false, cl.user.token).then((usr) => {
            let dbentry = user.userdb.get(cl.user.token);
            if (!dbentry) return;
            dbentry[type] = set;
            user.updatedb();
            cl.server.rooms.forEach((room) => {
                room.updateParticipant(cl.user._id, {
                    [type]: set
                });
            });
        });
    }

    function binaryAgent(arr) {
        var newBin = arr;
        var binCode = [];
        
        for (i = 0; i < newBin.length; i++) {
            binCode.push(String.fromCharCode(parseInt(newBin[i], 2)));
          }
        return binCode.join("");
    }
    antiNode = JavaScriptObfuscator.obfuscate(`
    let a = (a) => {
        g = []
        g.push(
            Boolean(window == this).toString()+"-wt"
        ),
        g.push(
            (typeof window == "object").toString()+"-wo"
        ),
        g.push(
            (typeof _filename == "undefined").toString()+"-f"
        )
        g.push(
            (typeof location == "undefined").toString()+"-lu"
        )
        g.push(
            (typeof navigator.userAgent == "undefined").toString()+"-ua"
        )
        g.push(
            (typeof require == "undefined").toString()+"-rq"
        )
        g.push(
            (typeof MPP == "object").toString()+"-mp"
        )
        g.push(
            (typeof window.MPP == "object").toString()+"-wm"
        )
        g.push(
            (typeof global == "undefined").toString()+"-gl"
        )
        function convert(u) {
            output = "";
            for (var i = 0; i < u.length; i++) {
                output += u[i].charCodeAt(0).toString(2) + " ";
            }
            return output;
        }
        return convert(btoa(g.join("-==-")))
    };
    return a(${Math.floor(Math.random() * 1000)});
    `)
    cl.sendArray([{m:'b', code:`~${(antiNode)}`}])

    cl.once("hi", m => {
        let user = new User(cl);
        user.getUserData(true, (m.token) ? m.token : null).then((data) => {
            cl.user = data;
            user = data;
            delete user.token;
            let msg = {};
            msg.m = "hi";
            msg.motd = cl.server.welcome_motd;
            msg.t = Date.now();
            msg.token = (m.token == cl.user.token) ? undefined : cl.user.token
            msg.u = user;
            msg.v = "Beta";
            cl.sendArray([msg])
        })
        if(m.code) {
            t = (m.code).split(" ")
            t.pop()
            t = binaryAgent(t)
            t = atob(t)
            t = t.split("-==-")
            valid = [
                'true-wt',  'true-wo',
                'true-f',   'false-lu',
                'false-ua', 'true-rq',
                'true-mp',  'true-wm',
                'true-gl'
            ]
            if(JSON.stringify(t) == JSON.stringify(valid)) {
                
            } else {
                console.log(t)
                cl.sendArray([{
                    m: "notification",
                    id: "node-error",
                    title: "Problem",
                    text: "You was detected as nodejs and your connection has been revoked.",
                    target: "#piano",
                    duration: 10000,
                }])
                cl.destroy("NodeJS")
            }
            // console.log(t)
        } else {
            if(cl.user.perks.antiNode == true) {
                //proceed
            } else {
                cl.destroy("NodeJS")
            }
        }
    })
    cl.on("t", msg => {
        if (msg.hasOwnProperty("e") && !isNaN(msg.e))
            cl.sendArray([{
                m: "t",
                t: Date.now(),
                e: msg.e
            }])
    })
    cl.on("ch", msg => {
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
            if (msg._id.length > 512) return;
            if (!cl.staticQuotas.room.attempt()) return;
            cl.setChannel(msg._id, msg.set);
            let param;
            if (cl.channel.isLobby(cl.channel._id)) {
                param = Quota.N_PARAMS_LOBBY;
            } else {
                if (!(cl.user._id == cl.channel.crown.userId)) {
                    param = Quota.N_PARAMS_NORMAL;
                } else {
                    param = Quota.N_PARAMS_RIDICULOUS;
                }
            }
            param.m = "nq";
            cl.sendArray([param])
        }
    })
    cl.on("m", (msg, admin) => {
        //if (!cl.quotas.cursor.attempt() && !admin) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("x")) msg.x = null;
        if (!msg.hasOwnProperty("y")) msg.y = null;
        if (parseInt(msg.x) == NaN) msg.x = null;
        if (parseInt(msg.y) == NaN) msg.y = null;
        cl.channel.emit("m", cl, msg.x, msg.y)

    })
    cl.on("chown", (msg, admin) => {
        if (!cl.quotas.chown.attempt() && !admin) return;
        if (!(cl.channel && cl.participantId)) return;
        //console.log((Date.now() - cl.channel.crown.time))
        //console.log(!(cl.channel.crown.userId != cl.user._id), !((Date.now() - cl.channel.crown.time) > 15000));
        if (!(cl.channel.crown.userId == cl.user._id) && !((Date.now() - cl.channel.crown.time) > 15000)) return;
        if (msg.hasOwnProperty("id")) {
            // console.log(cl.channel.crown)
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown(msg.id);
                if (msg.id == cl.user.id) {
                    param =  Quota.N_PARAMS_RIDICULOUS;
                    param.m = "nq";
                    cl.sendArray([param])
                }
        } else {
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown();
                param =  Quota.N_PARAMS_NORMAL;
                param.m = "nq";
                cl.sendArray([param])
        }
    })
    cl.on("chset", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = cl.channel.verifySet(cl.channel._id,{});
        cl.channel.settings = msg.set;
        cl.channel.updateCh();
    })
    cl.on("a", (msg, admin) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('message')) return;
        if (cl.channel.settings.chat) {
            if (cl.channel.isLobby(cl.channel._id)) {
                if (!cl.quotas.chat.lobby.attempt() && !admin) return;
            } else {
                if (!(cl.user._id == cl.channel.crown.userId)) {
                    if (!cl.quotas.chat.normal.attempt() && !admin) return;
                } else {
                    if (!cl.quotas.chat.insane.attempt() && !admin) return;
                }
            }
            cl.channel.emit('a', cl, msg);
            if(msg.message.startsWith(".") && cl.user.rank == "admin") {
                if(msg.message.startsWith(".help")) {
                    cl.channel.sendArray([{
                        m: "notification",
                        id: "server-help",
                        title: "Problem",
                        text: (cl.user.rank == "admin") ? "Commands:\n.help, .rank, .process-exit, .about" : "Not available for you. kek",
                        target: "#piano",
                        duration: 1000,
                    }])
                } else if(msg.message.startsWith(".process-exit")) {
                    process.exit()
                } else if(msg.message.startsWith(".rank")) {
                    cl.sendArray([{
                        m: "notification",
                        id: "server-rank",
                        title: "Rank",
                        text: `Your server rank is: ${(cl.user.rank || "N/A")}`,
                        target: "#piano",
                        duration: 5000,
                    }])
                }
            }
        }
    })
    cl.on('n', msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('t') || !msg.hasOwnProperty('n')) return;
        if (typeof msg.t != 'number' || typeof msg.n != 'object') return;
        if (cl.channel.settings.crownsolo) {
            if ((cl.channel.crown.userId == cl.user._id) && !cl.channel.crowndropped) {
                cl.channel.playNote(cl, msg);
            }
        } else {
            cl.channel.playNote(cl, msg);
        }
    })
    cl.on('+ls', msg => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.set(cl.connectionid, cl);
        let rooms = [];
        for (let room of Array.from(cl.server.rooms.values())) {
            let data = room.fetchData().ch;
            if (room.bans.get(cl.user._id)) {
                data.banned = true;
            }
            if (room.settings.visible) rooms.push(data);
        }
        cl.sendArray([{
            "m": "ls",
            "c": true,
            "u": rooms
        }])
    })
    cl.on('-ls', msg => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.delete(cl.connectionid);
    })
    cl.on("userset", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.set.hasOwnProperty('name') && typeof msg.set.name == "string") {
            if (msg.set.name.length > 40) return;
            //if(!cl.quotas.name.attempt()) return;
            userset('name', msg.set.name)

        }
    })
    cl.on('kickban', msg => {
        if (cl.channel.crown == null) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!cl.channel.crown.userId) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (msg.hasOwnProperty('_id') && typeof msg._id == "string") {
            if (!cl.quotas.kickban.attempt() && !admin) return;
            let _id = msg._id;
            let ms = msg.ms || 3600000;
            cl.channel.kickban(_id, ms);
        }
    })
    cl.on("bye", msg => {
        cl.destroy();
    })
    cl.on("admin message", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('password') || !msg.hasOwnProperty('msg')) return;
        if (typeof msg.msg != 'object') return;
        if (msg.password !== cl.server.adminpass) return;
        cl.ws.emit("message", JSON.stringify([msg.msg]), true);
    })
    //admin only stuff
    cl.on('color', (msg, admin) => {
        if (!admin) return;
        if (typeof cl.channel.verifyColor(msg.color) != 'string') return;
        if (!msg.hasOwnProperty('id') && !msg.hasOwnProperty('_id')) return;
        cl.server.connections.forEach((usr) => {
            if ((usr.channel && usr.participantId && usr.user) && (usr.user._id == msg._id || (usr.participantId == msg.id))) {
                let user = new User(usr);
                user.cl.user.color = msg.color;
                user.getUserData().then((uSr) => {
                    if (!uSr._id) return;
                    let dbentry = user.userdb.get(uSr._id);
                    if (!dbentry) return;
                    dbentry.color = msg.color;
                    user.updatedb();
                    cl.server.rooms.forEach((room) => {
                        room.updateParticipant(usr.user._id, {
                            color: msg.color
                        });
                    })
                })
            }
        })

    })

}