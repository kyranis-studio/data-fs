"strict mode";

const v8 = require("v8")

exports.binary = {
  convert(value) {
    var ser = new v8.Serializer()
    ser.writeHeader()
    ser.writeValue(value)
    return ser.releaseBuffer()
  },
  restore(buffer) {
    var des = new v8.Deserializer(buffer)
    des.readHeader()
    return des.readValue()
  },
  length(value) {
    return v8.serialize(value).length
  },
  int32(number) {
    var buffer = Buffer.alloc(4)
    buffer.writeUIntBE(number, 0, 4)
    return buffer
  },
  getFreeSpace(spaceArray, size) {
    var i = 0
    for (space of spaceArray) {
      if (space[1] == size) {
        spaceArray.splice(i,1)
        return space
      }
      i++
    }
    return undefined
  }
}