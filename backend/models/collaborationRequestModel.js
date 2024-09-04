const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);