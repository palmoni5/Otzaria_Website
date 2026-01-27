import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  points: { type: Number, default: 0 },
  acceptReminders: { type: Boolean, default: false },
  
  savedSearches: [{
    id: { type: String },
    findText: { type: String },
    replaceText: { type: String },
    label: { type: String },
    isRemoveDigits: { type: Boolean, default: false }
  }],
  hiddenInstructionsBooks: { type: [String], default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);


export default User;

