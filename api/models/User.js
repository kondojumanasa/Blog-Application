const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
  username: {type: String, required: true, min: 4, unique: true},
  password: {type: String, required: true},
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;

//mongodb+srv://manasakondoju181:BWX8lfBlCCgmuL7t@cluster0.6yliz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//BWX8lfBlCCgmuL7t