const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const wishSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:              { type: String, required: true },
  image:              { type: String, default: '' },
  price:              { type: Number, default: 0 },
  currency:           { type: String, default: 'USD' },
  link:               String,
  priority:           { type: Number, min: 1, max: 5, default: 3 },
  confidence:         { type: Number, min: 0, max: 100, default: 50 },
  aktualnostDuration: { type: Number, default: 3 },
  context:            String,
  notes:              String,
  tags:               { type: [String], default: [] },
  visibility:         { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
  reserved:           { type: Boolean, default: false },
  reservedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fulfilled:          { type: Boolean, default: false },
  fulfilledAt:        Date,
  lastChecked:        Date,
  likes:              [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:           [commentSchema],
  // Актуальність tracking
  lastConfirmedAt:     Date,
  nextCheckAt:         Date,
  lastReminderSentAt:  Date,
  reminderToken:       String,
  // Archive
  archived:            { type: Boolean, default: false },
  archivedAt:          Date,
  // Product info fetch metadata
  sourceUrl:          String,
  fetchStatus:        { type: String, enum: ['auto', 'failed', 'manual'], default: 'manual' },
  fetchedAt:          Date,
  fetchedTitle:       String,
  fetchedPrice:       String,
  fetchedImageUrl:    String,
}, { timestamps: true });

wishSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.likes = (ret.likes || []).map(id => id.toString());
    if (ret.reservedBy) ret.reservedBy = ret.reservedBy.toString();
    if (ret.user && ret.user._id) {
      ret.user = { ...ret.user, id: ret.user._id.toString() };
      delete ret.user._id;
    } else if (ret.user) {
      if (typeof ret.user.id === 'string') {
        // Already transformed by User's toJSON - keep the plain object as-is
      } else {
        // Not populated — still an ObjectId reference
        ret.user = ret.user.toString();
      }
    }
    if (Array.isArray(ret.comments)) {
      ret.comments = ret.comments.map(c => ({
        id: c._id ? c._id.toString() : c.id,
        user: c.user ? c.user.toString() : c.user,
        text: c.text,
        createdAt: c.createdAt,
      }));
    }
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Wish', wishSchema);
