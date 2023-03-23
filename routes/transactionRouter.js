const express = require("express");
const path = require("path");
const axios = require("axios")
const User = require("../model/user");
const Wallet = require("../model/wallet")
const WalletTransaction = require("../model/wallet_trans")
const {walletTxn} = require("../controller/wallet_operations")

const transactionRouter = express.Router();

transactionRouter.route('/pay')
.get((req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

transactionRouter.route('/response')
.get(async(req, res) => {
    const {transaction_id} = req.query;
    //create url with transaction ID to verify transaction status
    const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

    //network call to confirm transaction
    const { FLUTTERWAVE_V3_SECRET_KEY }  = process.env;
    const response = await axios({
        url,
        method: "get",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `${process.env.FLUTTERWAVE_V3_SECRET_KEY}`
        }
    });

    try {
        const {id, status, amount, narration, customer, card} = response.data.data;
        const db_operation1 = WalletTransaction.findOne({transactionId: id});
        const checkTranExist = await walletTxn.databaseFunction(db_operation1);    
        if(checkTranExist.status === true) {
            return res.status(409).json({status:false, message:"Transaction already exist"});
        }
        const db_operation2 = Wallet.findOneAndUpdate({phone: customer.phone_number}, {$inc: {balance: +amount}});
        const creditWallet = await walletTxn.databaseFunction(db_operation2);
        const walletBalance = creditWallet.response.balance;
        if(creditWallet.status !== true) {
            console.log("transaction failed");
            await walletTxn.createTranctionHistory({amount, wallet_number: customer.phone_number, transactionId:id, transaction_type: "fund wallet via flutterwave", narration:`${narration}/${card.first_6digits}****${card.last_4digits}`, status:"failed", previousbalance: walletBalance, currentbalance: walletBalance});
            return res.status(409).json({status:false, message:"Transaction failed"});
        }
        console.log("wallet successfully funded");
        await walletTxn.createTranctionHistory({amount, wallet_number: customer.phone_number, transactionId:id, transaction_type: "fund wallet via flutterwave", narration:`${narration}/${card.first_6digits}****${card.last_4digits}`, status: status, previousbalance: walletBalance, currentbalance: walletBalance + amount});
        return res.status(200).json({status:true, message:"Wallet funded successfully"});
    }
    catch(err) {
        console.log(err);
        return res.status(200).json({status: false, statusCode:500, message: `Transaction failed. ${err}`});    
    }
})
  


module.exports = transactionRouter;
