const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    surname: {type: String, required:true},
    firstname: {type: String, required:true},
    middlename: {type: String},
    status: {type: String, required: true, default: "active", enum: ["active", "dormant"]},
    phone: {type: String, unique:true, required:true},
    email: {type: String, unique:true, required:true},
    password: {type: String, required:true},
});

module.exports = mongoose.model('User', userSchema);

