const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({

    name:{
        type:String,
        required:[true," Enter Room name "]
    },
    code:{
        type:String,
        required:true,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    activeMembers:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
    ],
    createdAt:{
        type:Date,
        default:Date.now,
        expires:86400

    },
});

module.exports = mongoose.model("Room",roomSchema);