const crypto = require('crypto');
const User = require('./models/User');
const Key = require('./models/Key');
const jwt = require('jsonwebtoken');
const encryptPassword = (password) => {
    return crypto.createHash('sha512').update(password).digest('base64');
}

const setAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;
    // const key = jwt.sign({publicKey:pub}, sec, {expiresIn : 3600});
    const [bearer, key] = authorization.split(' ');
    if(bearer !== 'Bearer') return res.status(400).send({error : 'Wrong Authorization'});
    const decodedJwt = jwt.decode(key);
    if(decodedJwt===null)   return  res.status(400).send({error : 'Invalid key'});
    const _pub = decodedJwt.publicKey;
    const _key = await Key.findOne({publicKey: _pub});
    let user = null;
    try{
    console.log('verifying');
    const verified = jwt.verify(key, _key.secretKey);
    user = _key.user;
    }   catch(e){
        return res.status(403).send({error :'Invalid token'});
    }   
    if(!user)   return res.status(404).send({error: 'Cannot find user'});
    req.user = user;
    return next();
    // const user = await User.findOne({keys : _key}); //"keys" :{value : key}
    
}
// next : main.js에서 setAuth를 이용해서 로직을 짤거 아니야. 만약 setAuth에서 오류 생기면 11line이나 13line 통해서 오류 띄우고 
// 제대로 갔으면 main.js에서 setAuth 다음에 넣은 함수 async(req, res) 를 실행하겠죠 
module.exports= {
    encryptPassword,
    setAuth,
}