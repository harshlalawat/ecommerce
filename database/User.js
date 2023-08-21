const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    cart: [{name: String, quantity:{type: Number, default: 0}, image: String, price: Number}],
    isVerified: {type: Boolean, default: false},
    isAdmin: {type: Boolean, default: false},
})

const User = mongoose.model("User", userSchema);

module.exports = User;