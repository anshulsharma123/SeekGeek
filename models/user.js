const Joi = require('joi');
const _ = require('lodash');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 255,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024,
  },
  projects: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
      },
    },
  ],
  projectInRequirement: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
      },
    },
  ],
  upvoted: [
    {
      _id: false,
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
      },
    },
  ],
  downvoted: [
    {
      _id: false,
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
      },
    },
  ],
  isVerified: {
    type: Boolean,
    default: true,
    required: false,
  },
  githubUrl: {
    type: String,
  },
  sex: {
    type: String,
  },
  about: {
    type: String,
    maxlength: 500,
  },
});

const User = mongoose.model('User', userSchema);

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_PRIVATE_KEY
  );
};

function validateLogin(req) {
  const schema = Joi.object({
    email: Joi.required(),
    password: Joi.string().min(4).max(1024).required(),
  });

  return schema.validate(req);
}

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.required(),
    email: Joi.required(),
    password: Joi.required(),
  });

  return schema.validate(user);
}

function pickData(userData) {
  return _.pick(userData, ['name', 'email', 'password']);
}

function validateEditUser(userData) {
  const schema = Joi.object({
    name: Joi.string().required(),
    about: Joi.string().allow(''),
    githubUrl: Joi.string().allow(''),
    sex: Joi.string().allow(''),
  });

  return schema.validate(userData);
}

function validatePassReset(req) {
  const schema = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().required(),
  });
  return schema.validate(req);
}

exports.User = User;
exports.validatePassReset = validatePassReset;
exports.validateEditUser = validateEditUser;
exports.validateUser = validateUser;
exports.pickUserData = pickData;
exports.validateLogin = validateLogin;
