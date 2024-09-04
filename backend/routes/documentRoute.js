const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticate = require('../middleware/authenticateUser');


router.post('/generate-document', authenticate, documentController.createDocument);

module.exports = router;
