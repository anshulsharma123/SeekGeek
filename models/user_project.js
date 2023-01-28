const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const validator = require('validator');
const { User } = require('../models/user');

const projectModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
    trim: true,
  },
  Author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  tags: {
    type: Array,
    required: true,
  },
  dateuploadedAt: {
    type: Date,
    default: Date.now(),
  },
  likes: {
    type: Number,
    default: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  githubUrl: {
    type: String,
    required: true,
  },
});

function validateProject(project) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(50),
    // Author: Joi.objectId().required(),
    // tags: Joi.array().items(Joi.string()),
    tags: Joi.string().required(),
    description: Joi.string().required().min(10).max(200),
    githubUrl: Joi.string().required(),
  });
  return schema.validate(project);
}

function validateEditProject(projectData) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(50),
    tags: Joi.array().items(Joi.string()),
    description: Joi.string().required().min(10).max(200),
    githubUrl: Joi.string().required(),
  });

  return schema.validate(projectData);
}

const Project = mongoose.model('Project', projectModel);

exports.Project = Project;
exports.validateProject = validateProject;
exports.validateEditProject = validateEditProject;
