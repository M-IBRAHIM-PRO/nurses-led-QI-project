const express = require("express");
const router = express.Router();
const userController = require("./../controllers/userController");
const authenticate = require('../middleware/authenticateUser');

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Retrieve the PubMed key
router.get('/pubmed-key', authenticate, userController.getPubMedKey);

// Update the PubMed key
router.put('/pubmed-key', authenticate, userController.updatePubMedKey);

// // Add a new PubMed key
// router.post('/pubmed-key', authenticate, userController.addPubMedKey);


module.exports = router ;
