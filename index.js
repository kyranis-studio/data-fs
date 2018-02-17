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
    this.defragMethod=1
    this.onErrorcallback
    if (fsMan.exist(this.fileName)) {
      this.index = fsMan.getIndex(this.fileName)
    } else {
      this.index = new Map
    }
  }
  insert(id, value) {
    if (id == 0) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:1,msg:"not allowed to insert",id:0})
        return
    }
    if (this.index.has(id) && this.index.get(id)[0]) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:2,msg:"already exist",id})
        return
    }
    if (fsMan.exist(this.fileName)) {
      var freeSpace
      if (freeSpace = this.index.get(0)) {
        var freePos = binary.getFreeSpace(freeSpace, binary.length(value))
        if (freePos) {
          fsMan.write(this.fileName, binary.convert(value), freePos[0])
          this.index.set(id, [freePos[0], binary.length(value)])
          freePos[0]=freePos[0]+binary.length(value)
          freePos[1]=freePos[1]-binary.length(value)
          fsMan.truncate(this.fileName,this.index.get(0))
        }
      }
      if (!this.index.has(id)) {
        fsMan.truncate(this.fileName,this.index.get(0))
        var from = fsMan.fileSize(this.fileName)
        fsMan.append(this.fileName, binary.convert(value))
        var dataLength = fsMan.fileSize(this.fileName)
        fsMan.write(this.fileName, binary.int32(dataLength), 0)
        this.index.set(id, [from, binary.length(value)])
      }
    } else {
      var dataLength = binary.length(value) + 4
      var dataPointer = Buffer.alloc(4, 0)
      dataPointer.writeUIntBE(dataLength, 0, 4)
      fsMan.append(this.fileName, dataPointer)
      fsMan.append(this.fileName, binary.convert(value))
      this.index.set(id, [4, binary.length(value)])
    }
    if(this.defragMethod==1){
      var map=this.dataMap()
      fsMan.defrag(this.index,map,this.fileName)
    }else if(this.defragMethod==2){
      this.defrag()
    }
    fsMan.append(this.fileName, binary.convert(this.index))
  }
  delete(id) {
    if (id == 0) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:3,msg:"not allowed to delete",id:0})
        return
    }
    if (!this.index.has(id)) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:4,msg:"id dont exist",id})
        return
    }
    var freeSpace
    var recordIndex = this.index.get(id)
    if (freeSpace = this.index.get(0)) {
      freeSpace.push([recordIndex[0], recordIndex[1]])
      freeSpace.sort((a,b)=>{return a[0]-b[0]})
      freeSpace = binary.margeSpace(freeSpace)
      if(freeSpace){
        this.index.set(0,freeSpace)
      }
    } else {
      this.index.set(0, [
        [recordIndex[0], recordIndex[1]]
      ])
    }
    this.index.delete(id)
    if (this.override) fsMan.write(this.fileName, Buffer.alloc(recordIndex[1], 0), recordIndex[0])
    fsMan.truncate(this.fileName,this.index.get(0))
    if(this.defragMethod==1){
      var map=this.dataMap()
      fsMan.defrag(this.index,map,this.fileName)
    }else if(this.defragMethod==2){
      this.defrag()
    }
    fsMan.append(this.fileName, binary.convert(this.index))
  }
  update(id, value) {
    if (id == 0) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:5,msg:"not allowed to update",id:0})
    }
    if (!this.index.has(id)) {
      if(this.onErrorcallback)
        this.onErrorcallback({errCode:4,msg:"id dont exist",id})
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
    if (options && options.from){
      var { from } = options
    }else{ 
      from = 0
    }
    if (options && options.to){
      var { to } = options
      if(to<0){
        to = this.getLenght()+to
      }
    }else{
      to = this.getLenght()
    } 
    var index = 0
    var keys = this.index.keys()
    for (var key of keys) {
      if (key) {
        if (index >= from && index < to) {
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

  dataMap(){
    var map = []
    this.index.forEach((record,key)=>{
      if(key!=0){
        map.push(new Array(record[0],record[1],key))
        map.sort((a,b)=>{return a[0]-b[0]})
      }else{
        record.forEach(space=>{
          space.push(0)
          map.push(new Array(space[0],space[1],0))
          map.sort((a,b)=>{return a[0]-b[0]})
        })
      }
    })
    return map
  }

  fragIndex(){
    var fileSize = fsMan.fileSize(this.fileName)
    if(this.index.get(0)){
      if(this.index.get(0).length>1){
        var freeSpace=this.index.get(0).reduce((sp1,sp2)=>sp1[1]+sp2[1])
        var fragmentation = (freeSpace/fileSize)*100
      }else if(this.index.get(0).length==1){
        var fragmentation = (this.index.get(0)[0][1]/fileSize)*100
      }else{
        var fragmentation = 0
      }
    }
    return fragmentation.toFixed(2)
  }

  defrag(count){
    var {map}=this.dataMap()
    while (fsMan.defrag(this.index,map,this.fileName)) {
      var {map}=this.dataMap()
      fsMan.append(this.fileName, binary.convert(this.index))
    }
  }

  onError(callback){
    this.onErrorcallback=callback
  }
}
exports.defrag={
  none:0,
  lazy:1,
  full:2
}