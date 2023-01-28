const express = require('express');
const route = express.Router();
const Fawn = require('fawn');
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { TokenVerification, validateVerification} = require('../models/tokenVerification');

Fawn.init(mongoose);
route.post('/', async(req, res)=>{
    const { error } = validateVerification(req.body);
    if (error) return res.status(400).send(`Invalid request: ${error.details[0].message}`);
   
    const verificationToken = await TokenVerification.findOne({token: req.body.token});
    if(!verificationToken) return res.status(401).send('Invalid/expired token.');

    const user = await User.findByIdAndUpdate(verificationToken.user, {isVerified: true}, {new: true});
    if(!user) return res.status(404).send('Invalid token, the user does not exist.');
    user.save();
    await TokenVerification.deleteOne({token:req.body.token});
    res.status(200).send('User successfully verified! you may now login');
    
    //TODO: Delete the verification token after the user successfully verify and do it by  transactions


    // const token=await TokenVerification.findOne(verificationToken);
    //console.log(token._id);
    // try{
    //     new Fawn.Task()
    //     .save('users',user)
    //     //.remove('verification-tokens',{_id:token._id})
    //     .run();
    //     res.status(200).send('User successfully verified! you may now login');
    // }
    // catch (ex){
    //      res.status(500).send(`Something failed ${ex}`);
    // }
});


module.exports = route;