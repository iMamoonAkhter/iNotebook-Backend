const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    profileImage: {type: String, default: null},
    password: {type: String, required: true},
    date: {type: Date, default: Date.now},
});
const User = mongoose.model('user', UserSchema);
module.exports = User;