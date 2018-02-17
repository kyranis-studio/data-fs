"strict mode";
const {
  binary
} = require("./binary");
const v8 = require("v8")
const fs = require("fs")
var _ = require('lodash')
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
      if(freeSpace[last][0]+freeSpace[last][1]==dataSize){
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
  },
  moveData(from,to,by,fileName){
    var fd = fs.openSync(fileName, 'r');
    var buffer = Buffer.alloc(by);
    fs.readSync(fd, buffer, 0, by, from)
    fs.closeSync(fd)
    this.write(fileName,buffer,to)
  },
  defrag(index,map,fileName){
    try{
      var freeSpaceArray = index.get(0)
      if(freeSpaceArray){
        if(freeSpaceArray.length == 0) return 0
        var freeSpaceIndex=map.findIndex(space =>{
          return _.isEqual(space,freeSpaceArray[0]) 
        })
        var freeSpace = map[freeSpaceIndex]
        var block = map[freeSpaceIndex+1]
        var blockPointer = block[0]
        var blockId=block[2]
        var blockSize = block[1]
        var freeSpacePointer = freeSpace[0]
        var freeSpaceSize = freeSpace[1]
        index.set(blockId,[freeSpacePointer,blockSize])
        index.get(0)[0]=[freeSpacePointer+blockSize,freeSpaceSize]
        this.moveData(blockPointer,freeSpacePointer,blockSize,fileName)
        return freeSpaceArray.length
      }
    }catch(e){
      
    }
  }
}