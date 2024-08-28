const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    filename: {
        type: String,
        required: true,
    },
    cloudinary_url: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    }
})
const File = mongoose.model("File", FileSchema);
module.exports = File;