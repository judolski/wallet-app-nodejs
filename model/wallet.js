const mongoose = require("mongoose");
const Schema = mongoose.Schema;

walletSchema = new Schema({
    balance: {required: true, type: Number, default: 0},
    phone: {required: true, type: String},
    userId: {required: true, type: Schema.Types.ObjectId, ref: 'User'}
},{timestamps: true})

module.exports = mongoose.model('Wallet', walletSchema);