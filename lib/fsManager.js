"strict mode";
const {
  binary
} = require("./binary");
const v8 = require("v8")
const fs = require("fs")
exports.fsMan = {
  exist(path) {
    try {
      fs.statSync(path)
      return true
    } catch (err) {
      return false
    }
  },
  fileSize(path) {
    if (this.exist(path)) {
      var stats = fs.statSync(path)
      return stats["size"]
    } else {
      return 0
    }
  },
  append(fileName, buffer) {
    fs.appendFileSync(fileName, buffer)
  },
  truncate(fileName,freeSpace){
    var fd = fs.openSync(fileName, 'r');
    var dataSize = Buffer.alloc(4);
    fs.readSync(fd, dataSize, 0, 4, 0)
    dataSize = dataSize.readUInt32BE(0)
    if(freeSpace && freeSpace.length>0){
      var last = freeSpace.length-1
      if(freeSpace[last][0]+freeSpace[last][1]){
        dataSize=freeSpace[last][0]
        freeSpace.splice(-1,1)
        this.write(fileName,binary.int32(dataSize),0)
      }
    }
    fs.closeSync(fd)
    fs.truncateSync(fileName,dataSize)
  },
  write(fileName, buffer, position) {
    var fd = fs.openSync(fileName, "rs+")
    var length = buffer.length
    fs.writeSync(fd, buffer, 0, length, position)
    fs.closeSync(fd)
  },
  getRecord(fileName, begin, length) {
    var fd = fs.openSync(fileName, 'r');
    var buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, begin)
    fs.closeSync(fd)
    return binary.restore(buffer)
  },
  getIndex(fileName) {
    var db = fs.readFileSync(fileName)
    var fd = fs.openSync(fileName, 'r+');
    var dataSize = Buffer.alloc(4);
    fs.readSync(fd, dataSize, 0, 4, 0)
    dataSize = dataSize.readUInt32BE(0)
    var indexSize= this.fileSize(fileName) - dataSize
    var index = Buffer.alloc(indexSize)
    fs.readSync(fd,index,0,indexSize,dataSize)
    fs.closeSync(fd)
    return binary.restore(index)
  }
}