import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'נא לספק מפתח (key)'],
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'נא לספק ערך (value)']
  },
  label: {
    type: String,
    required: false
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

const SystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);

export default SystemConfig;