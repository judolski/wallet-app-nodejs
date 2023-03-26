const express = require("express");
const path = require("path");
const {fundWallet} = require("../controller/wallet_operations");
const auth = require("../controller/authenticate");


const transactionRouter = express.Router();

transactionRouter.route('/pay')
.get( auth.isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

transactionRouter.route('/response')
.get(async(req, res) => {
    return fundWallet.via_flutterwave(req, res);
})
  


module.exports = transactionRouter;
