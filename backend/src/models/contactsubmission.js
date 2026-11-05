const mongoose = require('mongoose')

const contactSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['new', 'contacted', 'completed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema)