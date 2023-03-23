const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const { DB_URL, DB_NAME } = process.env;

const connect = () => {
    return mongoose.connect(DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((db) => {
        console.log("Connected to database successfully");
        return {status: true, db}
    })
    .catch((err) => {
        console.log(`Connection to database failed \n ${err}`);
        return {status: false}
    });
}

const disconnect = (db_connection) => {
    db_connection.disconnect()
        .then(() => {
            console.log("database connection closed");
        })
        .catch((err) => {console.log(`unable to close database connection \n ${err}`)})
}


module.exports = {connect, disconnect}