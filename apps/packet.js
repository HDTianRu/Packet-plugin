import {
  Elem,
  Long,
  Send,
  processJSON,
  replacer
} from '../model/PacketHelper.js'

export class sendPacket extends plugin {
  constructor() {
    super({
      name: "发送packet",
      event: "message",
      priority: 1000,
      rule: [{
        reg: "^#(api|API)[\\s\\S]*{.*",
        fnc: "api",
        permission: "master"
      }, {
        reg: "^#(pb|PB)\\s*{.*",
        fnc: "pb",
        permission: "master"
      }, {
        reg: "^#(pbl|PBL)\\s*{.*",
        fnc: "pbl",
        permission: "master"
      }, {
        reg: "^#(raw|RAW)[\\s\\S]*{.*",
        fnc: "raw",
        permission: "master"
      }]
    })
  }

  async api(e) {
    let index = e.msg.indexOf("\n")
    e.bot.sendApi(
      e.msg.substring(4, index).trim(),
      JSON.parse(e.msg.substring(index).trim())
    )
  }

  async pb(e) {
    Elem(
      e,
      processJSON(e.msg.substring(3).trim())
    )
  }

  async pbl(e) {
    Long(
      e,
      processJSON(e.msg.substring(4).trim())
    )
  }

  async raw(e) {
    let index = e.msg.indexOf("\n")
    const resp = await Send(
      e,
      e.msg.substring(4, index).trim(),
      processJSON(e.msg.substring(index).trim())
    )
    e.reply(JSON.stringify(resp, replacer, 2))
  }
}