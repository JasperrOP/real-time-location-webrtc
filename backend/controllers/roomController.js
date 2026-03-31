const Room = require("../models/Room");

const generateRoomCode = ()=>{
    return Math.random().toString(36).substring(2,8).toUpperCase();
};

const createRoom = async (req,res)=>{
    try {
        const {name} = req.body;

        if(!name) return res.status(400).json({message:"Room name is required"});

        const code = generateRoomCode();

        const room = await Room.create({
            name,
            code,
            createdBy: req.user._id,
            activeMembers:[req.user._id]
        });

        res.status(201).json(room);


    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

const joinRoom = async(req,res)=>{
    try {
        const {code} = req.body;

        const room = await Room.findOne({code});
        if(!room){
            return res.status(404).json({message:"Room not found or has expired"})
        }
        if(!room.activeMembers.includes(req.user._id)){
            room.activeMembers.push(req.user._id);
            await room.save();
        }

        res.status(200).json(room)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};

module.exports = {createRoom,joinRoom};