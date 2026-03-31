const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const avatars = Array.from({ length: 100 }, (_, i) => 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`
);
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};


const signup = async(req,res)=>{
    try{
        const {name,email,password}=req.body;

        const userExists = await User.findOne({email});
        if(userExists) return res.status(400).json({message:"User already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const randomAvatar = avatars[Math.floor(Math.random()*100)];

        const user = await User.create({
            name,
            email,
            password:hashedPassword,
            avatarUrl:randomAvatar
        });

        if(User){
            res.status(201).json({
                _id:user.id,
                name:user.name,
                email:user.email,
                avatarUrl:user.avatarUrl,
                token:generateToken(user._id)
            });
        }
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

const login = async(req,res)=>{
    try {
        const{email,password} = req.body;

        const user = await User.findOne({email});

        if(user && (await bcrypt.compare(password,user.password))){
            res.json({
                _id:user.id,
                name:user.name,
                email:user.email,
                avatarUrl:user.avatarUrl,
                token:generateToken(user._id)
            });
        }else{
            res.status(401).json({message:'Invalid credentials'});
        }
        
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

module.exports = {signup,login};

