const express = require('express');
const route = express.Router();
const {
  ProjectInRequirement,
  validateData,
  validateEdit,
} = require('../models/requirementInProject');
const { User } = require('../models/user');
const { Project } = require('../models/user_project');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');

route.post('/add', auth, async (req, res) => {
  try {
    const data = {
      projectId: req.body._id,
      description: req.body.description,
    };
    console.log(data.projectId);
    const { error } = validateData(data);
    if (error) return res.status(400).send(error.details[0].message);
    const project = await ProjectInRequirement.findOne({
      projectID: data.projectId,
    });
    if (project)
      return res
        .status(400)
        .send('This project is already in the requirement section');
    const projectData = await Project.findById(data.projectId);
    console.log(projectData);
    if (projectData.Author != req.user._id)
      return res
        .send(400)
        .send(
          `you don't have proper rights to add this project in requirement section`
        );
    const projectInRequirement = new ProjectInRequirement({
      authorID: req.user._id,
      projectID: data.projectId,
      description: data.description,
    });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send('User not Found.');
    console.log(user);
    user.projectInRequirement.push({
      id: data.projectId,
      reqDescription: data.description,
    });
    user.save();
    projectInRequirement.save();
    res.status(200).send('Project Successfully added in requirement seciton');
  } catch (ex) {
    console.log(ex);
    res.status(500).send('Something failed');
  }
});

route.get('/projects', async (req, res) => {
  try {
    const projectInRequirement = await ProjectInRequirement.find()
      .populate('authorID')
      .populate('projectID');
    if (!projectInRequirement)
      return res.status(400).send('NO project exist in this section.');
    res.status(200).send(projectInRequirement);
  } catch (ex) {
    res.status(500).send('Something failed');
  }
});

route.get('/me', auth, async (req, res) => {
  try {
    const projectInRequirement = await ProjectInRequirement.find({
      authorID: req.user._id,
    }).populate('projectID');
    if (!projectInRequirement)
      return res.status(400).send('NO project exist for this user.');
    let projects = [];
    for (let i = 0; i < projectInRequirement.length; i++) {
      const data = {
        _id: projectInRequirement[i]._id,
        authorID: projectInRequirement[i].authorID,
        tags: projectInRequirement[i].projectID.tags,
        name: projectInRequirement[i].projectID.name,
        description: projectInRequirement[i].description,
        githubUrl: projectInRequirement[i].projectID.githubUrl,
      };
      projects.push(data);
      // console.log(projectInRequirement[i]);
    }
    res.status(200).send(projects);
  } catch (ex) {
    res.status(500).send(ex.message);
  }
});

route.put('/update', auth, async (req, res) => {
  try {
    const data = {
      _id: req.body._id,
      description: req.body.description,
    };
    const { error } = validateEdit(data);
    if (error) return res.status(400).send(error.details[0].message);
    const project = await ProjectInRequirement.findById(req.body._id);
    if (!project)
      return res.status(400).send('Project does not exist with the given id');
    if (project.authorID != req.user._id)
      return res
        .status(404)
        .send('You dont have proper rights to update this project');
    project.description = req.body.description;
    project.save();
    res.status(200).send('Project updated successfully');
  } catch (ex) {
    res.send(500).send('Something failed');
  }
});

route.delete('/delete/:id', auth, async (req, res) => {
  //TODO: Refactor this route using transactions
  try {
    const project = await ProjectInRequirement.findById(req.params.id);
    if (!project) return res.status(200).send('Project does not exist.');
    if (project.authorID != req.user._id)
      return res
        .status(404)
        .send('You dont have proper rights to delete this project');
    // const user = await User.updateOne(
    //   { _id: req.user._id },
    //   {
    //     $pull: {
    //       projectInRequirement: {
    //         id: project.projectID,
    //         contentType: mongoose.Schema.Types.ObjectId,
    //       },
    //     },
    //   }
    // );
    const del = await ProjectInRequirement.findByIdAndDelete(req.params.id);
    res.status(200).send(del);
  } catch (ex) {
    res.status(500).send('Something failed');
  }
});

route.put('/upvote', auth, async (req, res) => {
  //TODO: Refactor this route using transactions
  try {
    const upvoted = await User.findOne({
      _id: req.user._id,
      upvoted: { id: req.body.id },
    });
    const downvoted = await User.findOne({
      _id: req.user._id,
      downvoted: { id: req.body.id },
    });
    let user, project;
    if (downvoted) {
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $pull: {
            downvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
          $push: {
            upvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { dislike: -1, like: 1 },
        }
      );
    } else if (upvoted) {
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $pull: {
            upvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { like: -1 },
        }
      );
      console.log(project);
    } else {
      console.log('else');
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $push: {
            upvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { like: 1 },
        }
      );
    }
    if (user.n || project.n) {
      res.status(500).send('upvote successfull');
    } else {
      res.status(200).send('upvote failed');
    }
  } catch (ex) {
    console.log(ex);
    res.status(500).send('Something Failed.');
  }
});

route.put('/downvote', auth, async (req, res) => {
  //TODO: Refactor this route using transactions
  try {
    const upvoted = await User.findOne({
      _id: req.user._id,
      upvoted: { id: req.body.id },
    });
    const downvoted = await User.findOne({
      _id: req.user._id,
      downvoted: { id: req.body.id },
    });
    let user, project;
    if (upvoted) {
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $pull: {
            upvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
          $push: {
            downvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { like: -1, dislike: 1 },
        }
      );
    } else if (downvoted) {
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $pull: {
            downvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { dislike: -1 },
        }
      );
    } else {
      user = await User.updateOne(
        { _id: req.user._id },
        {
          $push: {
            downvoted: {
              id: req.body.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project = await ProjectInRequirement.updateOne(
        { _id: req.body.id },
        {
          $inc: { dislike: 1 },
        }
      );
    }
    if (user.n || project.n) {
      res.status(500).send('downvote successfull');
    } else {
      res.status(200).send('downvote failed');
    }
  } catch (ex) {
    console.log(ex);
    res.status(500).send('Something Failed.');
  }
});

module.exports = route;
