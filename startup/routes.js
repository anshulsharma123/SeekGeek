const express = require('express')
const user = require('../routes/user')


module.exports = function(app)
{
   app.use(express.json());
   app.use(express.static("public"));
   app.use('./api/user',user);
}