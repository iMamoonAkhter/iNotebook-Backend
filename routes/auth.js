const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const File = require('../models/File.js');
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require("../middlewares/fetchUser");
const upload = require('../middlewares/multer');

const {uploadOnCloudinary, deleteFromCloudinary} = require("../utils/cloudinary");




//Route1: Create a User using: POST "/api/auth/createUser". No login required
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      

      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success, error: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      const data = {
        user: {
          id: user.id,
        },
      };

      // Ensure JWT_SECRET_KEY is defined in your environment variables
      const authToken = jwt.sign(data, process.env.JWT_SECRECT_KEY);
      success = true;
      return res.json({ success, authToken });

    } catch (error) {
      return res.status(500).send({message: "Internal Server Error"});
    }
  }
);




//Route2: Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
    body('email', "Enter a valid email").isEmail(),
    body('password', "Password can't be blank").exists(),
], async(req, res)=>{

    // If there are errors, return bad request and the errors 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;
    let success = true;
    try {
        let user = await User.findOne({email});

        // Check the user exist or not
        if(!user){
            success = false;
            return res.status(400).json({error: "Please try to login with correct credentials"});
        }

        const passwordCompare = await bcrypt.compare(password, user.password);

        if(!passwordCompare){
            success = false;
            return res.status(400).json({error: "Please try to login with correct credentials"});
        }

        const data = {
            user:{
                id: user.id
            }
        }
        

        const authToken = jwt.sign(data, process.env.JWT_SECRECT_KEY);
        res.json({success: true, authToken: authToken});



    } catch (error) {
        success = false;
        console.error(error.message);
        res.status(500).send("Internal Error");
    }


})



//Route3: Get loggedin User details using: POST "/api/auth/getuser". login required
router.post('/getuser',  fetchuser, async(req, res)=>{
try {
  const userId = req.user.id;
  const user = await User.findById(userId).select('-password');
  res.send(user);
} catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Error");
}

})



//Route4: Change User Password
router.put('/change-password', [
  body('oldPassword', "old password can't be blank").exists(),
  body('newPassword', "New Password must be at least 5 characters").isLength({min: 5}),
  body("confirmPassword", "Confirm password can't be blank").exists()
],fetchuser, async(req, res)=>{
   // Check for validation errors
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
   }
  try {
      const {oldPassword, newPassword, confirmPassword} = req.body;
      const id = req.user.id;
      // Find the user by Id
      let user = await User.findById(id);

      if(!user){
          return res.status(404).json({error: "User not found"});
      }

      const hashPassword = await bcrypt.compare(oldPassword, user.password);
      if(!hashPassword){
          return res.status(401).json({error: "Old Password is not correct"});
      }


      if(newPassword !== confirmPassword){
          return res.status(401).status({error: "Password does not match"});
      }
     
      if(newPassword == oldPassword){
          return res.status(401).json({error: "Old Password and New Password cannot be same"});
      }

      const salt = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash(newPassword, salt);


      user = await User.findByIdAndUpdate(id,{$set: {password: hashedPassword}}, {new: true});
      res.json({message: "Password updated successfully"});
  } catch (error) {
      res.status(500).send("Internal Error");
  }
})

// Profile
router.post("/uploadprofileimage", fetchuser, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const localFilePath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    // Update the user's profileImage field with the Cloudinary URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: cloudinaryResponse.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile image uploaded successfully", user: updatedUser });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ message: "Internal Error" });
  }
});



module.exports = router;
