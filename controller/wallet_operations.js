const axios = require("axios")
const auth = require("../controller/authenticate");
const WalletTransaction = require("../model/wallet_trans");
const Wallet = require("../model/wallet");
const User = require("../model/user");

const transfer = {
     credit: async({wallet_number, transactionId, amount, narration, session}) => { 
        console.log("crediting recipient")
        const response = await Wallet.findOneAndUpdate({phone: wallet_number}, {$inc: {balance: +amount}}, {session});
        if(!response) {
            return {
                status: false,
                statusCode: 400,
                message: `Unable to complete transaction. \n Error: ${response}`
            }
        }
        const receipt = await walletTxn.createTranctionHistory({amount, wallet_number, transactionId, transaction_type: "Credit", narration, status: "successful", previousbalance:response.balance, currentbalance:response.balance+amount, session});
        console.log('Credited successful');
        return {
            status: true,
            statusCode: 200,
            data: {receipt, response}
        }
    },
    
    debit: async({wallet_number, transactionId, amount, beneficiary, narration, session}) => {
        const searchBeneficiary = await Wallet.findOne({phone: beneficiary})
        if(!searchBeneficiary) {
            return {
                status: false,
                statusCode: 404,
                message: `Invalid destination account`
            }
        }
        if(typeof(amount) !== 'number') {
            return {
                status: false,
                statusCode: 400,
                message: `Invalid Amount`
            }
        }
        if(wallet_number === beneficiary) {
            return {
                status: false,
                statusCode: 400,
                message: `Cannot transfer to self`
            }
        }
        const validateSender = await Wallet.findOne({phone:wallet_number});
        if(!validateSender) {
            return {
                status: false,
                statusCode: 404,
                message: `Invalid Originator account`
            }
        }
        if(validateSender.balance < amount) {
            return {
                status: false,
                statusCode: 403,
                message: `Insufficient fund, current balance is ${validateSender.balance}`
            };
        }
        const response = await Wallet.findOneAndUpdate({phone: wallet_number}, {$inc: {balance: -amount}}, {session});
        if(!response) {
            return {
                status: true,
                statusCode: 400,
                message: `Unable to complete transaction. \n Error: ${response}`
            }
        }
        const receipt = await walletTxn.createTranctionHistory({amount, wallet_number, transactionId, beneficiary,transaction_type: "Debit", narration, status: "successful", previousbalance:response.balance, currentbalance:response.balance-amount, session});
        console.log('Debited successful');
        return {
            status: true,
            statusCode: 201,
            data: {response, receipt}
        }  
    } 
}

const walletTxn = {
    databaseFunction: async(db_operation, message) => {
        try{
            const response = await db_operation;
            if(!response || response.deletedCount < 1 || response.length < 1) {
                return {status: false, statusCode: 404, response, message: message || "No record available"};
            }
            return {status: true, statusCode:200, response};  
        }
        catch(err) {
            console.log(err);
            return {status: false, statusCode:500, message: `Internal server error occur, retry later. ${err}`};
        }
    },
    //create transaction history
    createTranctionHistory: ({amount, wallet_number, transactionId, beneficiary, transaction_type, narration, status, previousbalance, currentbalance, session}) => {
        return WalletTransaction.create([{
            amount,
            wallet_number,
            transactionId,
            beneficiary,   
            transaction_type,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
            narration,
            status,
            previousbalance,
            currentbalance,
        }], {session});
    },

    balance: async(req, res) => {
        try {
            const user_wallet = await Wallet.findOne({userId: req.body.userId});
            if(!user_wallet) {
                return res.status(500).json({status: false, message: `Unable to retrieve balance`});
            }
            return res.status(200).json({status: true, balance: user_wallet});
        }
        catch(err) {res.status(500).json({status: false, message: `Unable to retrieve balance. \n ${err}`});}
    }
}

const fundWallet = {
    via_flutterwave: async(req, res) => {
        const {transaction_id} = req.query;
        //create url with transaction ID to verify transaction status
        const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

        //network call to confirm transaction
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
            console.log(customer)
            const db_operation2 = Wallet.findOneAndUpdate({email: customer.email}, {$inc: {balance: +amount}});
            const creditWallet = await walletTxn.databaseFunction(db_operation2);
            console.log(creditWallet)
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
    }
}


module.exports = {transfer, walletTxn, fundWallet};