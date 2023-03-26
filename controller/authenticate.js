const jwt = require("jsonwebtoken");
const bycryp = require("bcryptjs");
const fs = require("fs");
const Wallet = require("../model/wallet");
const User = require("../model/user");
const WalletTransaction = require("../model/wallet_trans");

const {walletTxn} = require("../controller/wallet_operations")

const PRIVATE_KEY = fs.readFileSync('./rsa_key/private.key', 'utf8');
const PUBLIC_KEY = fs.readFileSync('./rsa_key/public.key', 'utf8');


function generateToken(user) {
    return token = jwt.sign({user}, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: "12h",

    });
}

const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    if(!token) {
        return res.status(403).send({message: "Unauthorized, no access token provided!"});
    }
    return jwt.verify(token, PUBLIC_KEY, {}, (err, user) => {
        if(err) {
            console.log(err)
            return res.status(498).send({message: "invalid or expired token!. Login in again"});
        }
        return next();
    });    
}

const userRegistration = async(req, res, session) => {
    try{
        const {surname, firstname, middlename,email,phone, password} = req.body;
        //check if email exist
        const db_operation1 = User.findOne({email:email});
        const checkMail = await walletTxn.databaseFunction(db_operation1);
        if(checkMail.status === true) {
            return res.status(409).json({status: false, message: "The email has been used"});
        }
        //check if phone exist
        const db_operation2 = User.findOne({phone:phone});
        const checkPhone = await walletTxn.databaseFunction(db_operation2, "The Phone number has been used");
        if(checkPhone.status === true) {
            return res.status(409).json({status: false, message: "The phone number has been used"});
        }
        const hashed_password = await bycryp.hash(password,10);
        if(!hashed_password) {
            return res.status(400).json({status: false, message: "Unable to create account"});
        }
        //create user
        const db_operation3 = User.create([{surname,firstname,middlename,email,phone,password: hashed_password}],{session});
        const createuser = await walletTxn.databaseFunction(db_operation3, "Unable to create account");
        if(createuser.status !== true) {
            await session.abortTransaction();
            return res.status(400).json({status: false, message: "Unable to create account"});
        } 
        //create wallet
        const db_operation4 = Wallet.create([{userId:createuser.response[0]._id, phone}],{session});
        const createwallet = await walletTxn.databaseFunction(db_operation4, "Unable to create wallet");
        if(createwallet.status !== true) {
            await session.abortTransaction();
            return res.send(createwallet);
        }
        //generate token
        let token = generateToken(email);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({message: "Your account has been created successfully", token: token});
    }
    catch(err) {
        console.log(err);
        res.status(400).json({status: false, message: `Unable to complete registration. \n ${new Error(err)}`});
        await session.abortTransaction();
        session.endSession();
        return;
    }
}

const login = async(req, res) => {
    try{
        const {user, password} = req.body;
        const checkUser = User.findOne({$or:[{phone:user},{email:user}]});
        const db_operation = await walletTxn.databaseFunction(checkUser);
        if(db_operation.status !== true) {
            return res.status(401).json({status: false, message: "Invalid user"});
        }
        const checkPassword = await bycryp.compare(password, db_operation.response.password);
        if(!checkPassword) {
            return res.status(401).json({status: false, message: "incorrect password"});
        }
        let token = generateToken(user);
        return res.status(200).json({token: token, user: user});
    }
    catch(err) {
        console.log(err);
        return res.status(400).json({status: false, message: `Error processing request. \n ${new Error(err)}`});
    }
}


    //close Account
    const closeAccount = async(req, res, session) => {
        try{
            const deleteUsers =  User.deleteOne({_id: req.body.id}, {session});
            const db_operation1 = await walletTxn.databaseFunction(deleteUsers);
            if(db_operation1.status !== true) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({status: false, message: "Unable to delete accout"});
            }
            const deleteWallet =  Wallet.findOneAndDelete({userId: req.body.id}, {session});
            const db_operation2 = await walletTxn.databaseFunction(deleteWallet);
            if(db_operation2.status !== true) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({status: false, message: "Unable to delete accout"});
            }
            const deleteTransHis = WalletTransaction.deleteMany({wallet_number:db_operation2.response.phone}, {session});
            const db_operation3 = await walletTxn.databaseFunction(deleteTransHis);
            if(db_operation3.status !== true && db_operation3.response.acknowledged !== true) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({status: false, message: "Unable to perform the operation"});
            }
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({status: true, message: "Account successfully closed"});
        }
        catch(err) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({status: true, message: `internal error occur. ${err}`});
        }
    }


module.exports = {generateToken, isAuthenticated, userRegistration, login, closeAccount}