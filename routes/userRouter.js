const express = require("express")
const mongoose = require("mongoose");

const User = require("../model/user");
const Wallet = require("../model/wallet");
const auth = require("../controller/authenticate");
const {walletTxn} = require("../controller/wallet_operations")

const userRouter = express.Router();

userRouter.route('/register')
.post(async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    return auth.userRegistration(req, res, session);
});

userRouter.route('/login')
.post(async(req, res) => {
    return auth.login(req, res);
});


userRouter.route('/all_users')
.get(async(req, res) => {
    const fetchUsers =  User.find({});
    const db_operation = await walletTxn.databaseFunction(fetchUsers);
    if(db_operation.status !== true) {
        return res.status(db_operation.statusCode).json({db_operation});
    }
    return res.status(db_operation.statusCode).json({db_operation});

})

userRouter.route('/single_user')
.get(async(req, res) => {
    const fetchUser =  User.findOne({_id: req.body.id});
    const db_operation = await walletTxn.databaseFunction(fetchUser);
    if(db_operation.status !== true) {
        return res.status(db_operation.statusCode).json({db_operation});
    }
    return res.status(db_operation.statusCode).json({db_operation});

})
//delete account
.delete(async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    return auth.closeAccount(req, res, session);
});


module.exports = userRouter;

