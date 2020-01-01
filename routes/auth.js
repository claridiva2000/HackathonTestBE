const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
//used to protect routes
const auth = require('../middleware/auth')
//backend validation
const { check, validationResult } = require("express-validator");
//brings in the User schema to create a new user object for the database
const User = require("../models/User");


//@route    GET api/auth
//@desc     Get logged in user
//@access   Private

router.get("/", auth, async (req, res) => {
  try{
    //the user is found by ID. we send back all user date except for the password.
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)

  }catch(err){
    console.error(err.message);
    res.status(500).send('server error')
  }
});


//@route    POST api/auth
//@desc     Auth user & get token
//@access   Public

router.post(
  "/",
  //validation check
  [
    check("email", "please include a valid email").isEmail(),
    check("password", "password is required").exists()
  ],

  //validation ends here

  async (req, res) => {
    const errors = validationResult(req);
    //if the array of validation errors is not empty, then show the error message
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if(!isMatch){
        return res.status(400).json({ msg: 'invalid credentials'})
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      //create jwt
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000 //reset to 3600 before deploying
        },
        (err, token) => {
          if (err) throw err;
        //if there is no error, push token to client side
          res.json({ token });
        }
      );

    } catch (err) {
      console.error(err.message)
      res.status(500).send('server error')
    }
  }
);

module.exports = router;
