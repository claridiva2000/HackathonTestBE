const express = require("express");
const router = express.Router();
//used to protect routes
const auth = require("../middleware/auth");
//validation
const { check, validationResult } = require("express-validator");

//models
const Contacts = require("../models/Contact");
const User = require("../models/User");

//@route    GET api/contacts
//@desc     Get all users contacts
//@access   Private

router.get("/", auth, async (req, res) => {
  try {
    //req.user is accessible through the auth middleware      //sorts contacts by most recent date.
    const contacts = await Contacts.find({ user: req.user.id }).sort({
      date: -1
    });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

//@route    POST api/contacts
//@desc     Add new contacts
//@access   Private

router.post(
  "/",
  [
    //protected route
    auth,
    //validation - if any of the checks are false, the error is put into an array. if not array will be empty.
    [
      check("name", "name is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    //check for errors in checks array
    const errors = validationResult(req);
    //if the array of validation errors is not empty, then show the error message
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, type } = req.body;

    try {
      //create a new contact object
      const newContact = new Contacts({
        name,
        email,
        phone,
        type,
        //user id from auth middleware
        user: req.user.id
      });
      const contact = await newContact.save();

      res.json(contact);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("server error");
    }
  }
);

//@route    PUT api/contacts/:id
//@desc     Update contact
//@access   Private

router.put("/:id", auth, async (req, res) => {
  //destructure data from frontend
  const { name, email, phone, type } = req.body;

  //build contact object
  const contactFields = {};
  //if the data exists in the req.body, then we want to copy it to the contact field object
  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (type) contactFields.type = type;

  try {
    //pull contact by id to see if it exists in db
    let contact = await Contacts.findById(req.params.id);
    //if it doesn't exists throw error
    if (!contact) return res.status(404).json({ msg: "contact not found" });

    //make sure user owns contact
    if (contact.user.toString() !== req.user.id) {
      //if the user is not the owner of the contact, throw error
      return res.status(401).json({ msg: "not authorized" });
    }
    //find contact by id and update with the data saved to the contactFields object
    contact = await Contacts.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );
    res.json(contact);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

//@route    Delete api/contacts/:id
//@desc     Delete contact
//@access   Private

router.delete("/:id", auth, async (req, res) => {
  try {
    //pull contact by id to see if it exists in db
    let contact = await Contacts.findById(req.params.id);
    //if it doesn't exists throw error
    if (!contact) return res.status(404).json({ msg: "contact not found" });

    //make sure user owns contact
    if (contact.user.toString() !== req.user.id) {
      //if the user is not the owner of the contact, throw error
      return res.status(401).json({ msg: "not authorized" });
    }
    //find contact by id and update with the data saved to the contactFields object
    await Contacts.findByIdAndRemove(req.params.id);

    res.json({ msg: "contact removed" });
  } catch (error) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

module.exports = router;
