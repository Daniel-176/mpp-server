const ColorEncoder = require("./ColorEncoder.js");
const { promisify } = require('util');
const { randomUUID } = require("crypto");
let userdb;
class User {
    constructor(cl) {
        this.cl = cl;
        this.server = this.cl.server;
        this.userdb = userdb;
        this.default_db = {};
    }
    async getUserData(sendToken, token) {
        if (!userdb || (userdb instanceof Map && [...userdb.entries()] == [])) {
            await this.setUpDb();
        }
        let _id = createKeccakHash('keccak256').update((this.cl.server._id_Private_Key + this.cl.ip)).digest('hex').substr(0, 24);
        let _token = _id+"."+randomUUID()

        let usertofind = userdb.get(_token);

        if(token) {
            usertofind = userdb.get(token);
            if(!usertofind) usertofind = userdb.get(_token);
        } else {
            for (let [token2, user] of userdb.entries()) {
                if (user.ip === this.cl.ip) {
                    token = token2;
                }
            }
            
            usertofind = userdb.get(token);
            if(!usertofind) usertofind = userdb.get(_token);
        }

        if (!usertofind) {
            if (typeof usertofind == 'object' && (usertofind.hasOwnProperty('name') && usertofind.name != this.server.defaultUsername)) return;
            userdb.set(_token, {
                "color": `#${ColorEncoder.intToRGB(ColorEncoder.hashCode(_id)).toLowerCase()}`,
                "name": this.server.defaultUsername,
                "_id": _id,
                "token":_token,
                "perks": {
                    "antiNodeBypass": false
                },
                "rank": undefined,
                "tag": undefined, //not defined by default
                "ip": this.cl.ip
            });
            this.updatedb();
            token = _token;
        }

        let user = userdb.get(token);
        return {
            "color": user.color,
            "name": user.name,
            "_id": user._id,
            "rank": sendToken ? user.rank : null,
            "token": sendToken ? user.token : null,
            "perks": sendToken ? user.perks : null,
            "tag": user.tag,
        }
    }
    async updatedb() {
        const writeFile = promisify(fs.writeFile);
        await writeFile('src/db/users.json', JSON.stringify(User.strMapToObj(userdb), null, 2));
    }
    async setUpDb() {
        const writeFile = promisify(fs.writeFile);
        const readdir = promisify(fs.readdir);
        let files = await readdir("src/db/");
        if (!files.includes("users.json")) {
            await writeFile('src/db/users.json', JSON.stringify(this.default_db, null, 2))
            userdb = new Map(Object.entries(require("./db/users.json")));
        } else {
            userdb = new Map(Object.entries(require("./db/users.json")));
        }
    }
    static strMapToObj(strMap) {
        return [...strMap.entries()].reduce((obj, [key, value]) => (obj[key] = value, obj), {});
    }
}
module.exports = User;
