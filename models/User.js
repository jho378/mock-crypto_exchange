const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    name : String,
    email : {type : String, unique: true}, // duplicate key error 두번째 회원가입시 
    password : String,
    // key : String , 나중에 assets처럼 1:n으로 만들래여?
    keys : [{type: Schema.Types.ObjectId, ref : 'Key'}], 
    assets : [{type : Schema.Types.ObjectId, ref: 'Asset'}],
});

const User = mongoose.model('User', userSchema);

module.exports = User;