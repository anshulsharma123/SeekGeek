const express = require('express')
const user = require('../routes/users')
const login = require('../routes/login');
const verify = require('../routes/verify')
const project = require('../routes/user_projects');
const requirement= require('../routes/projectInRequirement');

module.exports = function(app)
{
   app.use(express.json());
   app.use(express.static("public"));
   app.use('/api/users',user);
   app.use('/api/login',login);
   app.use('/api/verify',verify);
   app.use('/api/project',project);
   app.use('/api/requirement',requirement);
}