import {
  ulid
} from 'ulid'
import crypto from 'crypto'
import {
  Elem,
  encode
} from '../model/PacketHelper.js'

const sizeToBytes = size => {
  //Powered by Gemini
  const MAX_VALUE = (2n ** 63n) - 1n
  const UNIT_POWERS = {
    '': 1n,
    'b': 1n,
    'k': 1024n ** 1n,
    'm': 1024n ** 2n,
    'g': 1024n ** 3n,
    't': 1024n ** 4n,
    'p': 1024n ** 5n,
    'e': 1024n ** 6n,
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)([bkmgtpe]{0,1})b?$/)
  if (!match) {
    return MAX_VALUE
  }
  const [, numericPart, unitPart] = match
  let num
  try {
    num = BigInt(Math.floor(Number(numericPart)))
  } catch (error) {
    return MAX_VALUE
  }
  const unitKey = unitPart.charAt(0)
  if (!(unitKey in UNIT_POWERS)) {
    return MAX_VALUE
  }
  const result = num * UNIT_POWERS[unitKey]
  if (result > MAX_VALUE) {
    return MAX_VALUE
  }
  return result
}

export class fakeFile extends plugin {
  constructor() {
    super({
      name: "fakeFile",
      dsc: "生成神奇文件",
      event: "message",
      priority: 0,
      rule: [{
        reg: "^#文件.*",
        fnc: "make"
      }]
    })
  }


  async make(e) {
    const match = e.msg.match(/^#文件\s*(.+)\s+(\d+[bkmgtpe]{0,2})/i)
    if (!match) {
      await e.reply('格式错误，请使用 "#文件 文件名 文件大小"')
      return
    }
    const [_, name, _size] = match
    const size = sizeToBytes(_size)
    const _packet = {
      "1": 6,
      "7": {
        "2": {
          "1": 102,
          "2": ulid(),
          "3": size,
          "4": name,
          "7": "{\"info\": \"HDTianRu\"}",
          "8": crypto.createHash('md5').update(ulid()).digest('hex').toUpperCase()
        }
      }
    }
    const data = encode(_packet)
    const lengthBytes = new Uint8Array(2)
    lengthBytes[0] = (data.length >> 8) & 0xff
    lengthBytes[1] = data.length & 0xff
    const result = new Uint8Array(1 + 2 + data.length)
    result[0] = 1
    result.set(lengthBytes, 1)
    result.set(data, 3)
    const packet = {
      "5": {
        "1": 24,
        "2": result
      }
    }
    Packet.Elem(e, packet)
  }
}