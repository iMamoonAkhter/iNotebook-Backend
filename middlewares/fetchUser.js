const jwt = require('jsonwebtoken');

const fetchuser = (req, res, next)=>{
    // Get the user from the jwt token and add id to req object
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({error: 'please authenticate  using a valid token'});
    }
    try {
        const string = jwt.verify(token, process.env.JWT_SECRECT_KEY);
        req.user = string.user;
        next();

    } catch (error) {
        res.status(401).send({error: 'Internal error'});  
    }
    
}


module.exports = fetchuser;