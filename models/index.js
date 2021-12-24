const mongoose = require('mongoose');

const User = require('./User');
const Coin = require('./Coin');
const Asset = require('./Asset');
const Key = require('./Key')

const mongoURL = 'mongodb://test0:test0@testmongo-shard-00-00.4vjoj.mongodb.net:27017,testmongo-shard-00-01.4vjoj.mongodb.net:27017,testmongo-shard-00-02.4vjoj.mongodb.net:27017/coinServer?ssl=true&replicaSet=atlas-me699l-shard-0&authSource=admin&retryWrites=true&w=majority'; // coinServer로 이름 바꿈;

mongoose.connect(mongoURL);

if(mongoose.connect(mongoURL))  console.log('connected to db')

module.exports = {
    User,
    Coin,
    Asset,
    Key,
}