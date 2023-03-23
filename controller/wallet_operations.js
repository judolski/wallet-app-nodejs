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
                message: `Insufficient fund, remaining balance is ${validateSender.balance}`
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
    async databaseFunction(db_operation, message) {
        try{
            const response = await db_operation;
            if(!response || response.deletedCount < 1 || response.length < 1) {
                return {status: false, statusCode: 404, message: message || "No record available"};
            }
            return {status: true, statusCode:200, response};  
        }
        catch(err) {
            console.log(err);
            return {status: false, statusCode:500, message: `Internal server error occur, retry later. ${err}`};
        }
    },
    
    createTranctionHistory({amount, wallet_number, transactionId, beneficiary, transaction_type, narration, status, previousbalance, currentbalance, session}) {
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
    }

}

module.exports = {transfer, walletTxn};