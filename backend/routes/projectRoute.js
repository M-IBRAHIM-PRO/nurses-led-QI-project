const express = require("express");
const router = express.Router();
const projectController = require("./../controllers/projectController");
const authenticate = require('../middleware/authenticateUser');

router.post("/create-project", authenticate ,projectController.createProject);
router.get("/projects", authenticate ,projectController.fetchAllProjectsByRole);

router.post("/add-collaborator", projectController.addCollaborator);
router.get("/project:id", projectController.projectDetails);
router.post('/projects/:projectId/request-collaboration', authenticate,projectController.collaborationRequest)


module.exports = router ;
