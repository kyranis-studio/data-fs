"strict mode";

const {
  fsMan
} = require("./lib/fsManager")
const {
  binary
} = require("./lib/binary")
exports.DataFs = class DataFs {
  constructor(fineName) {
    this.fileName = fineName
    this.override = false
    if (fsMan.exist(this.fileName)) {
      this.index = fsMan.getIndex(this.fileName)
    } else {
      this.index = new Map
    }
  }
  insert(id, value) {
    if (id == 0) {
      console.log(`your not allowed to insert this id [ 0 ]`)
    }
    if (this.index.has(id) && this.index.get(id)[0]) {
      console.log(`this id [ ${id} ] already exist`)
      return
    }
    if (fsMan.exist(this.fileName)) {
      var freeSpace
      if (freeSpace = this.index.get(0)) {
        var freePos = binary.getFreeSpace(freeSpace, binary.length(value))
        if (freePos) {
          fsMan.write(this.fileName, binary.convert(value), freePos[0])
          this.index.set(id, [freePos[0], freePos[1]])
          fsMan.truncate(this.fileName)
          fsMan.append(this.fileName, binary.convert(this.index))
        }
      }
      if (!this.index.has(id)) {
        fsMan.truncate(this.fileName)
        var from = fsMan.fileSize(this.fileName)
        fsMan.append(this.fileName, binary.convert(value))
        var dataLength = fsMan.fileSize(this.fileName)
        fsMan.write(this.fileName, binary.int32(dataLength), 0)
        this.index.set(id, [from, binary.length(value)])
        fsMan.append(this.fileName, binary.convert(this.index))
      }
    } else {
      var dataLength = binary.length(value) + 4
      var dataPointer = Buffer.alloc(4, 0)
      dataPointer.writeUIntBE(dataLength, 0, 4)
      fsMan.append(this.fileName, dataPointer)
      fsMan.append(this.fileName, binary.convert(value))
      this.index.set(id, [4, binary.length(value)])
      fsMan.append(this.fileName, binary.convert(this.index))
    }
  }
  delete(id) {
    if (id == 0) {
      console.log(`your not allowed to remove this id  [ 0 ]`)
      return
    }
    if (!this.index.has(id)) {
      console.log(`this id [ ${id} ] don't exist`)
      return
    }
    var freeSpace
    fsMan.truncate(this.fileName)
    var recordIndex = this.index.get(id)
    if (freeSpace = this.index.get(0)) {
      freeSpace.push([recordIndex[0], recordIndex[1]])
    } else {
      this.index.set(0, [
        [recordIndex[0], recordIndex[1]]
      ])
    }
    this.index.delete(id)
    if (this.override) fsMan.write(this.fileName, Buffer.alloc(recordIndex[1], 0), recordIndex[0])
    fsMan.append(this.fileName, binary.convert(this.index))
  }
  update(id, value) {
    if (id == 0) {
      console.log(`your not allowed to update this id  [ 0 ]`)
      return
    }
    if (!this.index.has(id)) {
      console.log(`this id [ ${id} ] don't exist`)
      return
    } else {
      var recordIndex = this.index.get(id)
      if (recordIndex[1] == binary.length(value)) {
        fsMan.write(this.fileName, binary.convert(value), recordIndex[0])
      } else {
        this.delete(id)
        this.insert(id, value)
      }
    }
  }
  getLenght() {
    if (this.index.get(0)) {
      return this.index.size - 1
    } else {
      return this.index.size
    }
  }
  getRecord(id) {
    var recordIndex
    if (recordIndex = this.index.get(id)) {
      if (recordIndex[0]) {
        return fsMan.getRecord(this.fileName, recordIndex[0], recordIndex[1])
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }
  loop(callback, options) {
    if (options && options.from)
      var { from } = options
    else from = 1
    if (options && options.to)
      var { to } = options
    else to = this.getLenght()
    var index = 1
    var keys = this.index.keys()
    for (var key of keys) {
      if (key) {
        if (index >= from && index <= to) {
          callback(this.getRecord(key),key)
        }
        index++
      }
    }
  }
  find(callback){
    var result=[]
    var keys = this.index.keys()
    for (var key of keys) {
      if (key) {
        if(callback(this.getRecord(key))){
          result.push({id:key,value:this.getRecord(key)})
        }
      }
    }
    return result;
  }
}