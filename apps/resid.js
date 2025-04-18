import {
  sendLong,
  recvLong,
  replacer
} from '../model/PacketHelper.js'
import common from '../../../lib/common/common.js'

export class resid extends plugin {
  constructor() {
    super({
      name: "resid互转",
      event: "message",
      priority: 1000,
      rule: [{
        reg: "^#转id\\s*{.*",
        fnc: "send",
        permission: "master"
      }, {
        reg: "^#取id\\s*\\S*",
        fnc: "recv",
        permission: "master"
      }]
    })
  }

  async send(e) {
    const resid = await sendLong(
      e,
      e.msg.substring(4).trim()
    )
    const packet = {
      "37": {
        "6": 1,
        "7": resid,
        "17": 0,
        "19": {
          "15": 0,
          "31": 0,
          "41": 0
        }
      }
    }
    const msg = await common.makeForwardMsg(e, [resid, JSON.stringify(packet, replacer, '  ')])
    e.reply(msg)
  }

  async recv(e) {
    const resp = await recvLong(
      e,
      e.msg.substring(4).trim()
    )
    const data = resp?.["2"]?.["2"]?.["1"]?.[0]?.["3"]?.["1"]?.["2"] ?? resp?.["2"]?.["2"]?.["1"]?.["3"]?.["1"]?.["2"] ?? resp
    const msg = await common.makeForwardMsg(e, JSON.stringify(data, replacer, '  '))
    e.reply(msg)
  }
}