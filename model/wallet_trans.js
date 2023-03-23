const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletTransactionSchema = new Schema({
    amount: {type: Number, required: true, default: 0},
    wallet_number: {type: String, required: true, ref: 'user'},
    transactionId: {type: String, required: true},
    beneficiary: {type: String},   
    transaction_type: {type: String, enum: ["Credit", "Debit", "fund wallet via flutterwave"]},                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
    status: {type: String, required: [true, "payment status is required"], enum:["successful", "pending", "failed"]},
    narration: {type: String, required: true,},
    previousbalance: {type: Number},
    currentbalance: {type: Number}
}, {timestamps: true})

module.exports = mongoose.model("walletTransaction", walletTransactionSchema)