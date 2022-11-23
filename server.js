const express = require('express')
const app = express()

//db connection
require('./startup/db')

//routes 
require("./startup/routes")(app);

const port=process.env.port||3000;
app.listen(port, ()=>{
    console.log(`listening on port ${port}`)
});
