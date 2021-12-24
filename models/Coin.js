const mongoose = require('mongoose');
const {Schema} = mongoose;

const coinSchema = new Schema({
    name : {type: String, unique: true},
    coingeckoId : String, // BTC의 경우 뭐 코인개코에서 bitcoin이라 되있는거 그거 말하는거임
    isActive : Boolean,
})

const Coin = mongoose.model('Coin', coinSchema);

module.exports = Coin;

