import pb from "./protobuf/index.js"
import {
  Buffer
} from 'buffer'
import crypto from 'crypto'
import {
  gzip as _gzip,
  gunzip as _gunzip
} from 'zlib'
import {
  promisify
} from 'util'

const gzip = promisify(_gzip)
const gunzip = promisify(_gunzip)

const RandomUInt = () => crypto.randomBytes(4).readUInt32BE()

const getKey = (obj) => {
  const keys = Object.keys(obj)
  return keys.length === 1 ? keys[0] : undefined
}

export const Proto = pb

export const replacer = (key, value) => {
  if (typeof value === 'bigint') {
    return Number.isSafeInteger(Number(value)) ? Number(value) : `${value.toString()}L`
  } else if (Buffer.isBuffer(value)) {
    return `hex->${value.toString('hex')}`
  } else if (value?.type === 'Buffer' && Array.isArray(value.data)) {
    return `hex->${Buffer.from(value.data).toString('hex')}`
  } else {
    return value
  }
}

export const encode = (json) => {
  return pb.encode(processJSON(json))
}

export const Send = async (
  e,
  cmd,
  content
) => {
  try {
    const data = pb.encode(typeof content === 'object' ? content : JSON.parse(content))
    const req = await e.bot.sendApi('send_packet', {
      cmd: cmd,
      data: Buffer.from(data).toString("hex")
    })
    return pb.decode(req.data)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`, error)
  }
}

export const SendRaw = async (
  e,
  cmd,
  content
) => {
  try {
    const data = typeof content === 'buffer' ? content.toString("hex") : content
    const req = await e.bot.sendApi('send_packet', {
      cmd: cmd,
      data: content
    })
    return pb.decode(req.data)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`, error)
  }
}

export const Elem = async (
  e,
  content
) => {
  try {
    const packet = {
      "1": {
        [e.isGroup ? "2" : "1"]: {
          "1": e.isGroup ? e.group_id : e.user_id
        }
      },
      "2": {
        "1": 1,
        "2": 0,
        "3": 0
      },
      "3": {
        "1": {
          "2": typeof content === 'object' ? content : JSON.parse(content)
        }
      },
      "4": RandomUInt(),
      "5": RandomUInt()
    }

    return Send(e, 'MessageSvc.PbSendMsg', packet)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`, error)
  }
}

export const Long = async (
  e,
  content
) => {
  try {
    const resid = await sendLong(e, content)
    const elem = {
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
    return Elem(e, elem)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`, error)
  }
}

export const sendLong = async (
  e,
  content
) => {
  const data = {
    "2": {
      "1": "MultiMsg",
      "2": {
        "1": [{
          "3": {
            "1": {
              "2": typeof content === 'object' ? content : JSON.parse(content)
            }
          }
        }]
      }
    }
  }
  const compressedData = await gzip(pb.encode(data))
  const target = e.isGroup ? BigInt(e.group_id) : e.user_id

  const packet = {
    "2": {
      "1": e.isGroup ? 3 : 1,
      "2": {
        "2": target
      },
      "3": `${target}`,
      "4": compressedData
    },
    "15": {
      "1": 4,
      "2": 2,
      "3": 9,
      "4": 0
    }
  }

  const resp = await Send(e, 'trpc.group.long_msg_interface.MsgService.SsoSendLongMsg', packet)
  return resp?.["2"]?.["3"]
}

export const recvLong = async (
  e,
  resid
) => {
  const packet = {
    "1": {
      "2": resid,
      "3": true
    },
    "15": {
      "1": 2,
      "2": 0,
      "3": 0,
      "4": 0
    }
  }

  const resp = await Send(e, 'trpc.group.long_msg_interface.MsgService.SsoRecvLongMsg', packet)
  return pb.decode(await gunzip(resp?.["1"]?.["4"]))
}

export const getMsg = async (
  e,
  message_id,
  isSeq = false
) => {
  const seq = parseInt(isSeq ? message_id : (await e.bot.sendApi('get_msg', {
    message_id: message_id
  }))?.real_seq)
  if (!seq) throw new Error("获取seq失败，请尝试更新napcat")

  const packet = {
    "1": {
      "1": e.group_id,
      "2": seq,
      "3": seq
    },
    "2": true
  }

  return Send(e, 'trpc.msg.register_proxy.RegisterProxy.SsoGetGroupMsg', packet)
}

// 仅用于方便用户手动输入pb时使用，一般不需要使用
export const processJSON = (json) => _processJSON(typeof json === 'string' ? JSON.parse(json) : json)

const funList = {
  "$encode": encode
}

function _processJSON(obj) {
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array || obj === null) return obj

  if (Array.isArray(obj)) return obj.map(_processJSON)

  switch (typeof obj) {
    case "string":
      if (obj.startsWith("hex->") && isHexString(obj.slice(5)))
        return Buffer.from(obj.slice(5), "hex")
      if (/^[0-9]+L$/.test(obj))
        return BigInt(obj.slice(0, -1))
      return obj

    case "object":
      const key = getKey(obj)
      const fun = funList[key]
      if (fun) return fun(obj[key])
      return Object.fromEntries(Object.entries(obj).map(([key, value]) => {
        const numKey = Number(key)
        if (Number.isNaN(numKey) || !Number.isInteger(numKey) || numKey < 0) throw new Error(`Key is not valid: ${key}`)
        return [numKey, _processJSON(value)]
      }))

    default:
      return obj
  }
}

function isHexString(s) {
  return s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s)
}