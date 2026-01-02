import {
  Elem,
  Long,
  Send,
  processJSON,
  replacer
} from '../model/PacketHelper.js'
import common from '../../../lib/common/common.js'

export class sendPacket extends plugin {
  constructor() {
    super({
      name: "发送packet",
      event: "message",
      priority: 1000,
      rule: [{
        reg: "^#(api|API)[\\s\\S]*{.*",
        fnc: "api"
      }, {
        reg: "^#(pb|PB)\\s*{.*",
        fnc: "pb"
      }, {
        reg: "^#(pbl|PBL)\\s*{.*",
        fnc: "pbl"
      }, {
        reg: "^#(raw|RAW)[\\s\\S]*{.*",
        fnc: "raw"
      }]
    })
  }

  async api(e) {
    if (!this.e.isMaster) return true
    let index = e.msg.indexOf("\n")
    const resp = await e.bot.sendApi(
      e.msg.substring(4, index).trim().replace("/", ""),
      JSON.parse(e.msg.substring(index).trim())
    )
    const msg = JSON.stringify(resp.data, null, 2)
    if (msg.length >= /*0*/721) e.reply(await common.makeForwardMsg(e, msg))
    else e.reply(msg)
  }

  async pb(e) {
    if (!this.e.isMaster) return true
    Elem(
      e,
      processJSON(e.msg.substring(3).trim())
    )
  }

  async pbl(e) {
    if (!this.e.isMaster) return true
    Long(
      e,
      processJSON(e.msg.substring(4).trim())
    )
  }

  async raw(e) {
    if (!this.e.isMaster) return true
    let index = e.msg.indexOf("\n")
    const resp = await Send(
      e,
      e.msg.substring(4, index).trim(),
      processJSON(e.msg.substring(index).trim())
    )
    const msg = JSON.stringify(resp, replacer, 2)
    if (msg.length >= /*0*/721) e.reply(await common.makeForwardMsg(e, msg))
    else e.reply(msg)
  }
}