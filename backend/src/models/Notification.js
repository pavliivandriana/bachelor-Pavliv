const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['reservation', 'aktualnost', 'follow', 'comment', 'like', 'achievement'], required: true },
  message: { type: String, required: true },
  from:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wish:    { type: mongoose.Schema.Types.ObjectId, ref: 'Wish' },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt;
    if (ret.from) ret.from = ret.from.toString();
    if (ret.wish) ret.wishId = ret.wish.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    delete ret.wish;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
