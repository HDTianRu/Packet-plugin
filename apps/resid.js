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
        fnc: "send"
      }, {
        reg: "^#取id[\\s\\S]*",
        fnc: "recv"
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
    const msg = await common.makeForwardMsg(e, [resid, JSON.stringify(packet, replacer, 2)])
    e.reply(msg)
  }

  async recv(e) {
    let resid = e.msg.substring(4).trim()
    try {
      const packet = JSON.parse(e.msg)
      resid = packet?.["37"]?.["7"] ?? resid
    } catch (e) {
      /*do nth*/
    }
    const resp = await recvLong(
      e,
      resid
    )
    const data = resp?.["2"]?.["2"]?.["1"]?.[0]?.["3"]?.["1"]?.["2"] ?? resp?.["2"]?.["2"]?.["1"]?.["3"]?.["1"]?.["2"] ?? resp
    const msg = await common.makeForwardMsg(e, JSON.stringify(data, replacer, 2))
    e.reply(msg)
  }
}