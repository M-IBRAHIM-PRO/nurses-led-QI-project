// routes/gptKeyRoutes.js
const express = require('express');
const router = express.Router();
const gptKeyController = require('../controllers/gptController');
const authenticate = require('../middleware/authenticateUser');

// Retrieve the GPT key
router.get('/gpt-key', authenticate, gptKeyController.getGPTKey);

// Update the GPT key
router.put('/gpt-key', authenticate, gptKeyController.updateGPTKey);

// Add a new GPT key
router.post('/gpt-key', authenticate, gptKeyController.addGPTKey);

router.post('/generate-search-query', gptKeyController.generateSearchQuery)

// router.post('/generate-results', authenticate ,gptKeyController.fetchPubmed)

module.exports = router;
