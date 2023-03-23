require("dotenv").config();
const bodyParser = require('body-parser');
const express = require("express");
const morgan = require("morgan")
const http = require("http");

const userRouter = require("./routes/userRouter");
const transactionRouter = require("./routes/transactionRouter");
const walletRouter = require("./routes/walletRouter");
const db = require("./config/db");

db.connect();

const app = express();
const server =  http.createServer(app);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(morgan('tiny'));

app.use('/user', userRouter);
app.use('/wallet', walletRouter);
app.use('/transaction', transactionRouter);

server.listen(port,() => {
    console.log(`server running on http://localhost:${port}`)
});

module.exports = app;