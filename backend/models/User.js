const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true," Please add a name "]
    },
    email:{
        type:String,
        required:[true," Please add a email "],
        unique:true
    },
    password:{
        type:String,
        required:[true," Enter password"]
    },
    avatarUrl:{
        type:String,
        default:''
    }
    
    },
    {
        timestamps:true
    }
)

module.exports = mongoose.model("User",UserSchema);