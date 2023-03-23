const express = require("express");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const Wallet = require("../model/wallet");
const WalletTransaction = require("../model/wallet_trans");
const {transfer, walletTxn} = require("../controller/wallet_operations");
const User = require("../model/user");

const walletRouter = express.Router();

walletRouter.route("/balance")
.get(async(req, res) => {
    try {
        const user_wallet = await Wallet.findOne({userId: req.body.userId});
        if(!user_wallet) {
            return res.status(500).json({status: false, message: `Unable to retrieve balance`});
        }
        return res.status(200).json({status: true, balance: user_wallet});
    }
    catch(err) {res.status(500).json({status: false, message: `Unable to retrieve balance. \n ${err}`});}
});


walletRouter.route("/trans_history")
.get(async(req, res) => {
    const db_operation = WalletTransaction.find({});
    const response = await walletTxn.databaseFunction(db_operation, "No transaction history available");
    return res.status(response.statusCode).json({response});
})
.delete(async(req, res) => {
    const db_operation = WalletTransaction.deleteMany({});
    const response = await walletTxn.databaseFunction(db_operation);
    return res.status(response.statusCode).json({response});
})

walletRouter.route("/trans_history/user")
.get(async(req, res) => {
    const {key ,value} = req.body;
    const db_operation = WalletTransaction.find({[key]: value});
    const response = await walletTxn.databaseFunction(db_operation, "No transaction history available");
    return res.status(response.statusCode).json({response});
})
.delete(async(req, res) => {
    const {key,value} = req.body;
    const db_operation = WalletTransaction.deleteMany({[key]: value});
    const response = await walletTxn.databaseFunction(db_operation);
    return res.status(response.statusCode).json({response});
})

walletRouter.route("/transfer")
.post(async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction()
    try{
        const {senderPhone, recieverPhone, amount, narration} = req.body;
        const transactionId = v4();
        const debit_response = await transfer.debit({wallet_number:senderPhone, transactionId, amount, beneficiary:recieverPhone, narration: `Trf/${recieverPhone}/${narration}`, session});
        if (debit_response.status !== true) {
            await session.abortTransaction();
            return res.status(debit_response.statusCode).json({debit_response});
        }
        const credit_response = await transfer.credit({wallet_number:recieverPhone, transactionId, amount, narration: `From:${senderPhone}/${narration}`, session});
        if (credit_response.status !== true) {
            //refund the sender if debited(rollback transactions)
            await session.abortTransaction();
            return res.status(400).json({credit_response});
        }
        //commit transaction changes to db
        await session.commitTransaction();
        console.log('trnsaction completed');
        session.endSession();
        console.log('Session ended');
        return res.status(200).json({status: true, message: "Transfer successfull"});
    }
    catch(err) {
        console.log(err);
        res.status(400).json({status: false, message: `Transaction failed. \n ${new Error(err)}`});
        await session.abortTransaction();
        session.endSession();
        return;
    }
})
        




const refund = (userId, senderBalace, res) => {
    Wallet.findOneAndUpdate({userId: userId}, 
        {$set: {balance: senderBalace}
    })
    .then((refund) => {
        res.status(500).json({message: "Unable to complete"});
        return;
    })
}



module.exports = walletRouter;