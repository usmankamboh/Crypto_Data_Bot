const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  registered: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
