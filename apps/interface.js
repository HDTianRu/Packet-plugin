import * as Packet from '../model/PacketHelper.js'

global.Packet = Packet

export class Interface extends plugin {
  constructor() {
    super({
      name: "packet interface",
      dsc: '提供接口',
      priority: -Infinity,
    })
  }

  async accept(e) {
    if (e.bot?.version?.app_name === 'NapCat.Onebot') e.Packet = Packet
  }
}