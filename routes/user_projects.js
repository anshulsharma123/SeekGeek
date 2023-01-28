const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');
const {
  Project,
  validateProject,
  validateEditProject,
} = require('../models/user_project');
const { User } = require('../models/user');
const { ProjectInRequirement ,validateEdit,validateData }= require('../models/requirementInProject');

// TODO: "CREATE PROJECT API";
router.post('/create_project', auth, async (req, res) => {
  try {
    const { error } = validateProject(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let string=req.body.tags;
    let tagsArray=string.split(',');
    const project = new Project({
      name: req.body.name,
      Author: req.user._id,
      description: req.body.description,
      tags: tagsArray,
      githubUrl: req.body.githubUrl,
    });
    const createProject = await project.save();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send('User not Found.');
    user.projects.push({ id: createProject._id });
    user.save();
    res.status(201).send(createProject);
  } catch (e) {
    res.status(400).send(e);
  }
});

// TODO: GET MY PROJECT
router.get('/my_project', auth, async (req, res) => {
  try {
    const projectData = await Project.find({ Author: req.user._id }).populate(
      'Author'
    );
    res.status(200).send(projectData);
  } catch {
    res.status(400).send('Something went wrong try again later...');
  }
});

// TODO: GET PROJECTS API
router.get('/get_projects', async (req, res) => {
  try {
    const projectData = await Project.find().populate('Author', '-password');
    res.status(200).send(projectData);
  } catch (e) {
    res.status(400).send('project error');
  }
});

//TODO GET SINGLE PROJECT API
router.get('/get_project/:id', async (req, res) => {
  try {
    const _id = req.params.id;
    const projectData = await Project.findById(_id).populate(
      'Author',
      '-password'
    );

    if (!projectData) {
      return res.status(404).send('No project is their for this user.');
    } else {
      res.send(projectData);
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

// TODO UPDATE YOUR PROJECT DETAIL
router.put('/update_project/:id', auth, async (req, res) => {
  try {
    // const { error } = validateEditProject(req.body);
    // if (error) return res.status(402).send(error.details[0].message);
    const project = await Project.findById(req.params.id);
    console.log(project);
    if (!project)
      return res.status(400).send('Project does not exist with the given id');
    if (project.Author!= req.user._id)
      return res
        .status(404)
        .send('You dont have proper rights to update this project');

    const result = await Project.updateOne(
      { _id: req.params.id },
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          tags: req.body.tags,
          githubUrl: req.body.githubUrl,
        },
      }
    );
    if (result.n)
      res.status(200).send('Your project has been successfully updated.');
    else res.status(500).send('Error! please, try again later...');
  } catch (e) {
    console.log(e);
    res.status(401).send('Error!... Please try again later..');
  }
});

// TODO: Delete particular project of a user
router.delete('/delete_project/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(400).send('Project does not exist with the given id');
    if (project.Author != req.user._id)
      return res
        .status(404)
        .send('You dont have proper rights to delete this project');
    const projectData= await ProjectInRequirement.findOne({projectID:req.params.id});
    if(projectData)
    {
        const user = await User.updateOne(
          { _id: req.user._id },
          {
            $pull: {
              projectInrequirement: {
                id: projectData._id,
                contentType: mongoose.Schema.Types.ObjectId,
              },
            },
          }
        );
        await ProjectInRequirement.deleteOne({projectID:req.params.id});    
    }
    const user = await User.updateOne(
      { _id: req.user._id },
      {
        $pull: {
          projects: {
            id: project._id,
            contentType: mongoose.Schema.Types.ObjectId,
          },
        },
      }
    );

    const deleteProject = await Project.findByIdAndDelete(req.params.id);
    res.status(200).send(deleteProject);
  } catch (e) {
    console.log(e);
    res.status(500).send('OPPS... Please try again later');
  }
});

router.put('/like/:id', auth, async (req, res) => {
  const user_id = req.user._id;
  const id = req.params.id;
  const project = await Project.findById(id);
  if (!project) {
    res.status(400).send('Project is not a function..');
    return;
  }
  const user = await User.findById(user_id);
  if (!user) res.status(400).send('Register Yourself to Like the Project...');
  const upvoted = await User.findOne({
    _id: req.user._id,
    upvoted: { id: project._id },
  });
  if (!upvoted) {
    const downvoted = await User.findOne({
      _id: req.user._id,
      downvoted: { id: project._id },
    });

    if (downvoted) {
      const user = await User.updateOne(
        { _id: user_id },
        {
          $pull: {
            downvoted: {
              id: project.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project.dislikes = project.dislikes - 1;
    }

    user.upvoted.push({ id: req.params.id });
    project.likes = project.likes + 1;
    user.save();
    project.save();
    res.status(200).send('Successfully Like...');
  } else {
    const user = await User.updateOne(
      { _id: user_id },
      {
        $pull: {
          upvoted: {
            id: project.id,
            contentType: mongoose.Schema.Types.ObjectId,
          },
        },
      }
    );
    project.likes = project.likes - 1;
    project.save();
    res.status(200).send('Succesfully Unlike..');
  }
});

// TODO: DISLIKE THE PROJECT

router.put('/dislike/:id', auth, async (req, res) => {
  const user_id = req.user._id;
  const id = req.params.id;
  const project = await Project.findById(id);
  if (!project) {
    res.status(400).send('Project is not a function..');
    return;
  }
  const user = await User.findById(user_id);
  if (!user) res.status(400).send('Register Yourself to Like the Project...');
  const downvoted = await User.findOne({
    _id: req.user._id,
    downvoted: { id: project._id },
  });
  if (!downvoted) {
    const upvoted = await User.findOne({
      _id: req.user._id,
      upvoted: { id: project._id },
    });

    if (upvoted) {
      const user = await User.updateOne(
        { _id: user_id },
        {
          $pull: {
            upvoted: {
              id: project.id,
              contentType: mongoose.Schema.Types.ObjectId,
            },
          },
        }
      );
      project.likes = project.likes - 1;
    }

    user.downvoted.push({ id: req.params.id });
    project.dislikes = project.dislikes + 1;
    user.save();
    project.save();
    res.status(200).send('Successfully dislike...');
  } else {
    const user = await User.updateOne(
      { _id: user_id },
      {
        $pull: {
          downvoted: {
            id: project.id,
            contentType: mongoose.Schema.Types.ObjectId,
          },
        },
      }
    );
    project.dislikes = project.dislikes - 1;
    project.save();
    res.status(200).send('Succesfully Undislike..');
  }
});

module.exports = router;
