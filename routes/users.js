const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const route = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const randomString = require('randomstring');
const { TokenVerification } = require('../models/tokenVerification');
const {
  User,
  validateUser,
  validateEditUser,
  pickUserData,
  validatePassReset,
} = require('../models/user');

route.get('/verifyToken', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send('Access denied. No token provided. ');
  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    res.status(200).send(decoded);
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
});

route.get('/me', auth, async (req, res) => {
  try {
    const user = await User.find({ _id: req.user._id })
      .populate('projects.id')
      .populate('projectInRequirement.id', '-description')
      .select([
        'name',
        'about',
        'email',
        'sex',
        'githubUrl',
        'projects',
        'porjectInRequirement',
      ]);
    res.status(200).send(user);
  } catch (ex) {
    console.log(ex);
    res.status(500).send('Something failed');
  }
});

route.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('projects')
      .populate('projectInRequirement')
      .select([
        'name',
        'email',
        'sex',
        'githubUrl',
        'projects',
        'projectInRequirement',
      ]);
    if (!user) {
      res.status(400).send("User with given id doesn't exist");
    }
    res.status(200).send(user);
  } catch (ex) {
    res.status(500).send('Something failed');
  }
});

route.post('/add',async(req,res)=>{
  try{
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(pickUserData(req.body));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const usertoken = {
      token: randomString.generate({ length: 128 }),
      user: user._id,
    };
    const verificationToken = new TokenVerification(usertoken);
    await verificationToken.save();
    // const msg = {
    //   to: user.email, 
    //   from: 'anshulmudgil38@gmail.com',
    //   subject: 'Sending with SendGrid is Fun',
    //   text: 'and easy to do anywhere, even with Node.js',
    //   html:  `<p>Hi ${user.name},<br/>enter the following token on the link provided to verify your email address with us:</p>
    //   <br/><br/>
    //   <center><a href = "http://localhost:3000/#/verify/${usertoken.token}" target="_blank" rel="noopener noreferrer"><button>Click here to verify your account</button></a></center>
    //   <br/><br/>
    //   <strong>Your verification token:</strong>
    //   <br/>
    //   <center>${usertoken.token}</center>
    //   `,
    // }
    await user.save();
    // sgMail
    // .send(msg)
    // .then(() => {
    //   console.log('Email sent')
    // })
    // .catch((error) => {
    //   console.error(error)
    // })
    res.status(200).send(_.pick(user, ["_id", "name", "email"]));
  }
  catch(ex)
  {
     res.status(500).send('Something fialed');
  }
});

route.put('/edit', auth, async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      githubUrl: req.body.githubUrl,
      sex: req.body.sex,
      about: req.body.about,
    };
    const { error } = validateEditUser(data);
    if (error) return res.status(402).send(error.details[0].message);

    console.log(req.user._id);
    const result = await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          name: req.body.name,
          about: req.body.about,
          githubUrl: req.body.githubUrl,
          sex: req.body.sex,
        },
      }
    );
    if (result.n)
      res.status(200).send('Your profile has been successfully updated.');
    else res.status(500).send('Error! please, try again later...');
  } catch (ex) {
    res.status(500).send('Something Failed');
  }
});

route.put('/resetPassword', auth, async (req, res) => {
  try {
    const { error } = validatePassReset(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findById(req.user._id);
    const validPassword = await bcrypt.compare(
      req.body.old_password,
      user.password
    );

    if (!validPassword)
      return res.status(400).send('Old password is incorrect. Try again');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.new_password, salt);
    await user.save();
    res.status(200).send(_.pick(user, ['_id', 'name', 'email']));
  } catch (ex) {
    res.status(500).send('Something failed');
  }
});

module.exports = route;
