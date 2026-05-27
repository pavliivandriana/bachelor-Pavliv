const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar:   String,
  bio:      String,
  preferences: {
    favoriteColors: { type: [String], default: [] },
    interests:      { type: [String], default: [] },
    brands:         { type: [String], default: [] },
  },
  sizes: {
    clothing: String,
    shoe:     String,
    ring:     String,
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  searchVisible:     { type: Boolean, default: true },
  emailVerified:          { type: Boolean, default: false },
  premium:      { type: Boolean, default: false },
  achievements: { type: [String], default: [] },
  wishLimit:    { type: Number,  default: 5 },
  verificationToken:      String,
  verificationTokenExpiry: Date,
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.followers = (ret.followers || []).map(id => id.toString());
    ret.following = (ret.following || []).map(id => id.toString());
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiry;
  },
});

module.exports = mongoose.model('User', userSchema);
