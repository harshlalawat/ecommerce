const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    isVerified: {type: Boolean, default: false},
    isAdmin: {type: Boolean, default: false},
})

const User = mongoose.model("User", userSchema);

module.exports = User;