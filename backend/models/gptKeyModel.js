// models/GPTKey.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const GPTKeySchema = new Schema({
  key: { 
    type: String, 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('GPTKey', GPTKeySchema);
