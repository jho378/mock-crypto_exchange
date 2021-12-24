const mongoose = require('mongoose');
const {Schema} = mongoose;

const keySchema= new Schema({
    publicKey : String,
    secretKey : String,
    user : {type : Schema.Types.ObjectId, ref:'User'},
    LoggedIn : Boolean,
});

// keySchema.index({value : 1, user :1}, {unique : true});

const Key = mongoose.model('Key', keySchema);
module.exports = Key;