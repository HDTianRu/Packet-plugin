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
    const reply = await e.bot.sendApi('get_msg', {
      message_id: e.reply_id
    })
    const data = await get(
      e,
      reply.real_seq ?? e.reply_id,
      !!reply.real_seq
    )
    const msg = [
      ["msg array:",
      JSON.stringify(reply.message, null, 2)],
      ["msg raw:",
      JSON.stringify(reply, null, 2)],
      ["pb elem:",
      JSON.stringify(data["3"]["6"]["3"]["1"]["2"][0], replacer, 2)],
      ["pb raw:",
      JSON.stringify(data, replacer, 2)]
    ].map(i => common.makeForwardMsg(e, i))
    await Promise.all(msg)
    e.reply(await common.makeForwardMsg(e, msg))
  }
}