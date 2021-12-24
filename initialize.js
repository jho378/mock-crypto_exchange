const {User, Coin, Asset, Key} = require('./models');
// const mongoose = require('mongoose');
// const mongoURL = 'mongodb://test0:test0@testmongo-shard-00-00.4vjoj.mongodb.net:27017,testmongo-shard-00-01.4vjoj.mongodb.net:27017,testmongo-shard-00-02.4vjoj.mongodb.net:27017/coinServer?ssl=true&replicaSet=atlas-me699l-shard-0&authSource=admin&retryWrites=true&w=majority';

const init = async() => {
    // await mongoose.connect(mongoURL);
    await Key.deleteMany();
    await User.deleteMany();
    await Asset.deleteMany();
    await Coin.deleteMany();

    const coins = ['bitcoin', 'ripple', 'ethereum', 'dogecoin', 'decentraland', 'milk'];

    for(const _coin of coins){
        const coin = new Coin({name : _coin, isActive : true});
        await coin.save();
    }
    console.log('completed');
}
init();