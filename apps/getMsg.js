import {
  getMsg as get,
  replacer
} from '../model/PacketHelper.js'
import common from '../../../lib/common/common.js'

export class getMsg extends plugin {
  constructor() {
    super({
      name: "取消息",
      event: "message",
      priority: 1000,
      rule: [{
        reg: "^#?取$",
        fnc: "get"
      }]
    })
  }

  async get(e) {
    if (!e.reply_id) return e.reply("请回复要取的消息")
    const msg = await e.bot.sendApi('get_msg', {
      message_id: e.reply_id
    })
    const data = await get(
      e,
      e.reply_id,
      !!msg.real_seq
    )
    const msg = [
      "msg array:",
      JSON.stringify(msg.message, null, 2),
      "pb(elem):",
      JSON.stringify(data["3"]["6"]["3"]["1"]["2"][0], replacer, 2),
      "pb(raw):",
      JSON.stringify(data, replacer, 2)
    ]
    e.reply(await common.makeForwardMsg(e, msg))
  }
}