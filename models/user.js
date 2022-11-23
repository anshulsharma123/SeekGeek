const Joi = require('joi')
const mongoose = require('mongoose')

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
    upvoted: [
      {
        _id: false,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref:'Project',
          required: true,
        },
      },
    ],
    downvoted: [
      {
        _id: false,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref:'Project',
          required: true,

        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
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

  const User = mongoose.model("User", userSchema);

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
  
    if (schema.validate(req).error) return schema.validate(req);
    return validateData(_.omit(req, ["password"]));
  }

  function validateUser(user) {
    const schema = Joi.object({
      name: Joi.required(),
      email: Joi.required(),
      password: Joi.required(),
    });
  
    if (schema.validate(user).error) return schema.validate(user);
    return validateData(user);
  }

  exports.User = User;
  exports.validateUser= validateUser;
  exports.validateLogin= validateLogin;