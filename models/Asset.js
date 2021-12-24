const mongoose = require('mongoose');
const {Schema} = mongoose;

const assetSchema = new Schema({
    name : String,
    balance : Number,
    user : {type: Schema.Types.ObjectId, ref:'User'},
})

assetSchema.index({name: 1, user: 1}, {unique : true}); // 한 유저가 btc를 2개를 가지지 않도록
const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;