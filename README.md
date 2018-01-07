# data-fs
create read update an delete binary record (database like file system)

## install
    npm i data-fs -S

exemples

    const {DataFs} = require("./index")
    var file = new DataFs("database.db")
    file.insert(1,"hello world")
    file.insert(2,"hello world!!!")
    ile.loop(function(record ,id){
         console.log(record,id)
    })

    // console.log 
    // {id=1,value:"hello world"}
    // {id=1,value:"hello world!!!"}
[Documentaion](https://github.com/kyranis-studio/data-fs/wiki/Documentaion)

