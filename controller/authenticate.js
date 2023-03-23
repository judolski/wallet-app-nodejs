const jwt = require("jsonwebtoken");
const {TOKEN_KEY} = process.env;

function generateToken(user) { 
    const jwtExp = 720;
    return token = jwt.sign({user}, TOKEN_KEY, {
    expiresIn: jwtExp
    });
}

isAuthenticated = (req, res, next) => {
    let token = req.headers.authorization;
    if(!token) {
        return res.status(403).send({message: "Unauthorized, no access token ptovided!"});
    }
    jwt.verify(token, TOKEN_KEY, (err, decoded) => {
        if(err) {
            console.log(err)
            return res.status(403).send({message: "User session expired!. Login in again"});
        }
        next();
    })    
}


module.exports = {generateToken, isAuthenticated}