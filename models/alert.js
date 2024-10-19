const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tokenSymbol: String,
  priceThreshold: Number,
});

module.exports = mongoose.model('Alert', alertSchema);
