# data-fs
create read update an delete binary record (database like file system)

## install
    npm i data-fs -S

exemples

    const {DataFs} = require("data-fs")
    var file = new DataFs("database.db")
    file.insert(1,"hello world")
    file.insert(2,"hello world!!!")
    file.loop(function(record ,id){
         console.log(record,id)
    })

    // console.log 
    // {id=1,value:"hello world"}
    // {id=2,value:"hello world!!!"}
[Documentaion](https://github.com/kyranis-studio/data-fs/wiki)

