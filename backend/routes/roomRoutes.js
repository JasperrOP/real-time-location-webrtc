const express = require("express");
const router = express.Router();
const {createRoom,joinRoom} = require("../controllers/roomController");
const {protect} = require("../middleware/authMiddleware");

router.post("/create",protect,createRoom);
router.post("/join",protect,joinRoom);

module.exports = router;