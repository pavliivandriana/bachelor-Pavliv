const mongoose = require('mongoose');

const antiWishItemSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  item:     { type: String, required: true },
  reason:   String,
}, { timestamps: true });

antiWishItemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.user;
  },
});

module.exports = mongoose.model('AntiWishItem', antiWishItemSchema);
