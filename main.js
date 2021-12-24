const express = require('express');
const {body, validationResult} = require('express-validator'); // 회원가입시 이메일등 validate
const crypto = require('crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const {encryptPassword, setAuth} = require('./utils');
const {User, Coin, Asset, Key} = require('./models'); // ./models/index가 기본

const app = express();
const port = 3000;

app.use(express.urlencoded({extended : true})); // 미들웨어
app.use(express.json()); // 미들웨어

// app.get('/', async(req, res) => {
//     res.send('');
// })

app.get('/coins', async(req, res)=> {
    const coins = await Coin.find({isActive:true});
    const coinArr = [];
    for(let i=0; i<coins.length; i++)   coinArr.push(coins[i].name);
    res.send(coinArr);
});

app.post('/register',
    body('email').isEmail()
                .withMessage('error : Incorrect email format.')
                .isLength({max:99})
                .withMessage('error : Email should be less than 100 words.'), // express-validator methods
    body('name').isAlphanumeric()
                .withMessage('error : Name should be written in alphabets and numbers only')
                .isLength({min:4, max:12})
                .withMessage('error : Name should be between 4 - 12 words'),
    body('password').isLength({min:8, max:16})
                    .withMessage('error : Password should be longer than 8 words, shorter than 16 words.'), 
    async(req, res)=> {
    const errors = validationResult(req); // 위에서 express-validator해준후에 에러가 있는지 확인 ! 이 코드 꼭 있어야해!
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;
    const encryptedPassword = encryptPassword(password);
    let user = null;
    try{
        user = new User({name: name, email : email, password : encryptedPassword});
        await user.save();
    }   catch(err){
        return res.status(400).json({error : 'email is duplicated'}); // 위에서 형식 체크하고 넘어왔는데도 오류가 뜨면 중복가입이겠쥬? unique로 걸어놔서
    }
    
    // 달러 주기
    const usdAsset = new Asset({name : 'usd', balance :10000, user});
    await usdAsset.save();

    const coins = await Coin.find({isActive:true});
    for(const coin of coins){
        const asset = new Asset({name : coin.name, balance : 0, user});
        await asset.save(); 
    }
    // 나중에 개수가 많아지면 initialize해서 할수 있겠죠
    // res.send({_id : user.id});
    res.send({});
})

app.post('/login', async(req, res)=> {
    const {email, password} =req.body;
    const encryptedPassword = encryptPassword(password);
    const user = await User.findOne({email});
    if(user === null)   return res.status(404).send({error : 'User not found. Check your email address.'});
    else if(user.password!==encryptedPassword)  return res.status(403).send({error : 'Wrond Password. Check it again.'});
    const pub = encryptPassword(crypto.randomBytes(20));
    const sec = encryptPassword(crypto.randomBytes(20));
    // const a = jwt.sign({publicKey:pub}, sec, {expiresIn : 3600});
    const key = new Key({publicKey: pub, secretKey : sec, user : user, LoggedIn : true});
    await key.save();
    // const keys = await Key.find({user});
    res.send({publicKey : key.publicKey, secretKey : key.secretKey});
    // 키를 1:n으로 하는 이유 : 모바일과 웹에서 동시 접속할떄 invalid할때 동시 로그아웃 안되게. 우리는 1:n으로 해줘야함
    // 아무튼 나중에 키 1:n으로 바꾸세요 ..  1:n으로 하는건 User.js에서 ref : Asset 이런식으로 
})


app.get('/balance', setAuth, async(req, res) => {
    const user = req.user;  
    
    // const authorization = req.headers.authorization;
    // const [bearer, key] = authorization.split(' ');
    // if(bearer !== 'Bearer') return res.send({error : 'Wrong Authorization'}).status(400);
    // const user = await User.findOne({key});
    // if(!user)   return res.send({error: 'Cannot find user'}).status(404); 
    const _user = await User.find({user});
    console.log("_user");
    console.log(_user);
    const _assets = user.assets;
    // const assetsId = assets.Keys();
    // const assetName = [];
    // for(let i=0; i<assetsId.length; i++){
    //     const assetname = await Asset.find({_id : assetsId[i]});
    //     assetName.push(assetname);
    // }
    console.log("_assets");
    console.log(_assets);
    console.log("user");
    console.log(user);
    
    const assets = await Asset.find({user});
    const assetName = assets.map(e => e.name);
    const assetBalance = assets.map(e => e.balance);
    for(let j=0; j<assetBalance.length; j++){
        const dot = assetBalance[j].toString().indexOf('.')
        if(assetName[j]==='usd')   continue;
        if(dot!==-1 && assetBalance[j].toString().length > dot+5){
            assetBalance[j] = assetBalance[j].toFixed(4);
        }
    }
    const assetObj = {};
    for(let i=0; i<assetName.length; i++){
        if(assetBalance[i]!==0) assetObj[assetName[i]] = assetBalance[i];
    }
    res.send(assetObj)
    
    // res.send(assets);
})

app.get('/coins/:coinName', async(req, res) => { // get 말고 post 쓰면 여기서 오류 떴어요.
    const {coinName} = req.params;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinName}&vs_currencies=usd`;
    apiRes =await axios.get(url);
    try{
    const price = apiRes.data[coinName].usd;
    return res.send({price : price});
    } catch(e){
        return res.status(404).send({error: 'URL not found. Check if you typed a right coin name'});
    }
})

app.post('/coin/:coinName/sell', setAuth, async(req,res)=> {
    const user = req.user;
    const assets = await Asset.find({user});
    const {coinName} = req.params;
    const {quantity} = req.body;
    
    const dot = quantity.indexOf('.');
    if(dot!== -1 && quantity.length> dot+5)    return res.status(400).send({error : 'At most four decimal points permitted.'});
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinName}&vs_currencies=usd`;
    apiRes = await axios.get(url);
    try{
    const price = apiRes.data[coinName].usd;
    let dollarBalance = 0;
    let targetBalance = 0;
    let sellQuantity = 0;
    for(let i=0; i<assets.length; i++){
        if(assets[i]['name']==='usd')   dollarBalance+= assets[i]['balance'];
        else if(assets[i]['name']===coinName)   targetBalance+=assets[i]['balance'];
        else continue;
    }
    if(quantity === '{all: true}'){
        for(i=0; i<assets.length; i++){
            sellQuantity = targetBalance
            if(assets[i]['name'] === 'usd') assets[i]['balance'] += Number(sellQuantity * Number(price));
            if(assets[i]['name'] === coinName)  assets[i]['balance'] = 0;
        }
    }
    else if(targetBalance < Number(quantity)) return res.status(400).send({error : `You do not have enough ${coinName}`});
    else{    
        for(i=0; i<assets.length; i++){
            if(assets[i]['name']==='usd')  assets[i]['balance']+= Number(price)*Number(quantity);
            if(assets[i]['name']===coinName)  assets[i]['balance'] -= Number(quantity);
            }
    }
    for(asset of assets){
        await asset.save();
    }
    await asset.save();
    if(quantity === '{all: true}'){
        console.log('all true')
        return res.send({price: Number(price), quantity : sellQuantity});
    }   else {
        console.log('not all')
        return res.send({price: price, quantity : Number(quantity)})
    }
    
    }   catch(e){
        return res.status(404).send({error : 'No such coin found. You might have written imaginary coin.'});
    }
});

app.post('/coin/:coinName/buy', setAuth, async (req, res) => {
    const user = req.user;
    const assets = await Asset.find({user});
    
    const {coinName} = req.params;
    const {quantity} = req.body; 
    const dot = quantity.indexOf('.');
    if(dot!== -1 && quantity.length> dot+5)    return res.status(400).send({error : 'At most four decimal points permitted.'});
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinName}&vs_currencies=usd`;
    apiRes =await axios.get(url);
try{
    const price = apiRes.data[coinName].usd;
    let dollarBalance = 0;
    let targetBalance = 0;    
    let buyQuantity = 0; 
    for(let i=0; i<assets.length; i++){
        if(assets[i]['name']==='usd') dollarBalance+= assets[i]['balance'];
        else if(assets[i]['name']===coinName) targetBalance += assets[i]['balance'];
        else continue;
    }
    if(quantity === '{all: true}'){
        // try using findoneandupdate 
        for(i=0; i<assets.length; i++){
            buyQuantity = (dollarBalance/Number(price)).toFixed(4);
            buyQuantity = Math.floor((dollarBalance/Number(price))*10000)/10000;
            if(assets[i]['name'] === 'usd') assets[i]['balance'] -= Number(buyQuantity * Number(price));
            if(assets[i]['name'] === coinName)  assets[i]['balance'] += Number(buyQuantity);
            // 에러가 언제 뜨냐면 0이 아닌데, 추가로 전량 구매할때 생겼어요..! cast to number failed for value ~~ 
        }
        // for(asset of assets){
        //     await asset.save();
        // }
        // await asset.save();
        // return res.send({price: Number(price), quantity : buyQuantity})
    }
    else if(dollarBalance < Number(price) * Number(quantity)) return res.status(400).send({error : 'You do not have enough dollars'});
    else{    
        for(i=0; i<assets.length; i++){
            if(assets[i]['name']==='usd')  assets[i]['balance']-= Number(price)*Number(quantity);
            if(assets[i]['name']===coinName)  assets[i]['balance'] += Number(quantity);
            }
    }
    for(asset of assets){
        await asset.save();
    }
    await asset.save();
    if(quantity === '{all: true}'){
        console.log('all true');
        return res.send({price: Number(price), quantity : buyQuantity});
    }
    else {
        console.log('not all');
        return res.send({price: price, quantity : Number(quantity)});
    }
}   catch(e){
    return res.status(400).send({error : 'No such coin found. You might have written imaginary coin.'})
}
    // const user = req.user;
    // const {quantity} = req.body;
    // const price = await getCoinPrice(req.params.coinName);
    // user.assets//조절
    // await asset.save();
    // 여기 위에 것으로 하든 아래것으로 하든
    // use findoneandupdate 엄밀하게 하고 싶으면 아니면 그냥 흉내만 내고 되고 ㅇㅇ ;
    
});

app.get('/keys', async(req, res)=> {
    const keys = await Key.find({LoggedIn: true});
    res.send(keys);
});

app.listen(port, () => {
    console.log(`listening at port: ${port}`);
})