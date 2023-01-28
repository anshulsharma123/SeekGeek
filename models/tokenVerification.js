const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({
  token: {
    type: String,
    length: 128,
    required: true,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const TokenVerification = mongoose.model("verification-token",verificationSchema);

function validateVerification(req) {
  const schema = Joi.object({
    token: Joi.string().length(128).required(),
  });
  return schema.validate(req);
}

exports.TokenVerification = TokenVerification;
exports.validateVerification = validateVerification;
