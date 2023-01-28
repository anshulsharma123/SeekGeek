const express = require('express')
const app = express()
require('express-async-errors');
require('dotenv').config()

//db connection
require('./startup/db')();

//routes 
require("./startup/routes")(app);

const port=process.env.PORT||7000;
app.listen(port, ()=>{
    console.log(`listening on port ${port}`)
});

if(process.env.NODE_ENV==='production')
{
    app.use(express.static('client/build'));
}

if ( process.env.NODE_ENV == "production")
{ 
     app.use(express.static("client/build")); 
     const path = require("path"); 
     app.get("*", (req, res) => { 
         res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html')); 
        })
}