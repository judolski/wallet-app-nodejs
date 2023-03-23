const bycryp = require("bcryptjs");
const express = require("express")
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const mongoose = require("mongoose");
const Wallet = require("../model/wallet");
const auth = require("../controller/authenticate");
const {walletTxn} = require("../controller/wallet_operations")

const userRouter = express.Router();

userRouter.route('/register')
.post(async(req, res) => {
    try{
        const session = await mongoose.startSession();
        session.startTransaction();
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
        let token = auth.generateToken(email);
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
    
});

userRouter.route('/login')
.post(async(req, res) => {
    try{
        const {user, password} = req.body;
        const checkUser = User.findOne({$or:[{phone:user},{email:user}]});
        const db_operation = await walletTxn.databaseFunction(checkUser);
        if(db_operation.status !== true) {
            return res.status(401).json({status: true, message: "Invalid user"});
        }
        const checkPassword = await bycryp.compare(password, db_operation.response.password);
        if(!checkPassword) {
            return res.status(401).json({status: false, message: "incorrect password"});
        }
        let token = auth.generateToken(user);
        return res.status(200).json({token: token, user: user});
    }
    catch(err) {
        console.log(err);
        return res.status(400).json({status: false, message: `Error processing request. \n ${new Error(err)}`});
    }
    
});


userRouter.route('/users')
.get((req, res) => {
    User.find({})
    .then((users) => {
        console.log(users)
    })
})


module.exports = userRouter;

