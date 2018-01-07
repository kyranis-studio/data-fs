const {DataFs} = require("./index")
var file = new DataFs("database.db")
file.override=true
// file.insert(1,"hello world")
// file.insert(2,"hello wael!")
// file.insert(3,"hello wajdi!")
// file.insert(4,"hello rahma!")
// file.insert(5,"hello fethi!")
// file.loop(function(record ,id){
//     console.log(record,id)
// },{from:1,to:5})
result=file.find(function(record){
    return record=="hello world"
})
 console.log(result)