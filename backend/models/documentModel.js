const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    link: { 
        type: String, 
        required: true,  // Document link is required
        trim: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now  // Default to current date and time
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Users', 
        required: true  // Reference to the user who created the document
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
