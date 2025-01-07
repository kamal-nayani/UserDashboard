const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('Token', TokenSchema);
