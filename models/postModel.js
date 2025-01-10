const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    image: {
      type: String, // Stores the image file path or URL
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      // maxlength: 100,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      // maxlength: 500, // Optional: Limit the description length
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
