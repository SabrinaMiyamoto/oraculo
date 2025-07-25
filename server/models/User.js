const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId:{
        type:String,
        required:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    name:{
        type:String,
        required:true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
})

module.exports = mongoose.model('User', UserSchema)