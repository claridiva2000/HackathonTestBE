const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
//validation
const { check, validationResult } = require("express-validator");
//model
const User = require("../models/User");



//@route    POST api/users
//@desc     Register a user
//@access   Public

router.post(
  "/",
  //backend validation. optional.
  [
    check("name", "name is required")
      .not()
      .isEmpty(),
    check("email", "please include a valid email").isEmail(),
    check(
      "password",
      "please enter a password with at least 6 letters"
    ).isLength({ min: 6 })
  ],
  //validation ends here

  async (req, res) => {
    const errors = validationResult(req);
    //if the array of validation errors is not empty, then show the error message
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //if the email address exists throw an error
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      //else create a new user
      user = new User({
        name,
        email,
        password
      });

      //encrypt the passworrd
      const salt = await bcrypt.genSalt(10);
      //replace the password with encrypted version
      user.password = await bcrypt.hash(password, salt);
      
      //save to database
      await user.save();

      //save user id to payload used to create token
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
      console.error(err.message);
      res.status(500).send("server error");
    }
  }
);

module.exports = router;
