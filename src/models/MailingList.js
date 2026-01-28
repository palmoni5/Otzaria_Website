import mongoose from 'mongoose';

const MailingListSchema = new mongoose.Schema({
  listName: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  emails: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.MailingList || mongoose.model('MailingList', MailingListSchema);
