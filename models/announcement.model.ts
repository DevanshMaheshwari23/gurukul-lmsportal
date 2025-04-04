import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  subject: string;
  message: string;
  recipientType: 'all' | 'students' | 'admins' | 'instructors';
  sentBy: mongoose.Types.ObjectId;
  recipientCount: number;
  sentAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  subject: {
    type: String,
    required: [true, 'Announcement subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Announcement message is required'],
    trim: true,
  },
  recipientType: {
    type: String,
    enum: ['all', 'students', 'admins', 'instructors'],
    default: 'all'
  },
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create model or use existing model to prevent model overwrite error in development
const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement; 