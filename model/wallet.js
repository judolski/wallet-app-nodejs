const mongoose = require("mongoose");
const Schema = mongoose.Schema;

walletSchema = new Schema({
    balance: {required: true, type: Number, default: 0},
    phone: {required: true, type: String, ref: 'user'},
    userId: {required: true, type: String}
},{timestamps: true})

module.exports = mongoose.model("wallet", walletSchema);