const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    searchQuery: {
        query: { type: String, required: true },  // The search query string
    },
    documents: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Document'  // Reference to the Document model
    }],  // List of document references
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],  // List of user IDs who are collaborators
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },  // User ID who last modified the search strategy
    lastModifiedAt: { type: Date }  // Timestamp of the last modification
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
