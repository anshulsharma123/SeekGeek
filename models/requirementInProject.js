const mongoose = require('mongoose');
const Joi = require('joi')
Joi.objectId = require("joi-objectid")(Joi);
const projectInRequirement = new mongoose.Schema({
    authorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true,
    },
    projectID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:true,
    },
   description:{
        type: String,
        required: true,
        trim:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    },
    like:
    {
        type:Number,
        default:0,
        min:0.
    },
    dislike:
    {
        type:Number,
        default:0,
        min:0,
    },
})
function validateData(data)
{
    const schema = Joi.object({
        projectId:Joi.objectId().required(),
        description:Joi.string().required(),
    });
    return schema.validate(data);
}
function validateEdit(data)
{
    const schema = Joi.object({
        _id: Joi.objectId().required(),
        description:Joi.string().required(),
    });
    return schema.validate(data);
}

const ProjectInRequirement =  mongoose.model('ProjectInRequirement',projectInRequirement);

exports.ProjectInRequirement = ProjectInRequirement;
exports.validateData = validateData;
exports.validateEdit= validateEdit;