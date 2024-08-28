const express = require("express");
const router = express.Router();
const fetchuser = require("../middlewares/fetchUser");
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");
//Route1: Get All Notes details using: Get "/api/auth/fetchallnotes". login required
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    res.status(500).send({ error: "Internal error" });
  }
});

//Route2: Add a note using: POST "/api/auth/addnote". login required
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Enter a valid title").isLength({ min: 3 }),
    body("description", "Description must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;
      //If there are errors, return Bad request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const notes = new Notes({
        title,
        description,
        tag,
        user: req.user.id,
      });
      const saveNote = await notes.save();
      if(saveNote){
        res.json({saveNote, message: "Note has been added successfully"});
      }
      else{
        res.status(400).send({message: "Failed to added note"})
      }
    } catch (error) {
      res.status(500).send({ message: "Please check your network" });
    }
  }
);

//Route: Update an existing notes using: POST "/api/auth/updatenote". login required
router.put("/updatenote/:id", fetchuser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    //Create a newNote object
    const newNote = {};
    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    // Find the note to be updated
    let note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).send({message: "Note not Found"});
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(401).send({message: "Not Allowed to update note"});
    }

    note = await Notes.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );
    res.json({note, message: "Note has been updated!"});
  } catch (error) {
    res.status(500).send({ message: "Internal error" });
  }
});

//Route: Delete an existing notes using: DELETE "/api/auth/deletenote/:id". login required
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    const id = req.params.id;
    let note = await Notes.findById(id);
    if (!note) {
      return res.status(401).send("Not Found");
    }
    if (note.user.toString() !== req.user.id) {
      return res.status(404).send("Not Allowed");
    }

    const deleteNote = await Notes.findByIdAndDelete(id, note);
    if (!deleteNote) {
      return res.status(401).json({ message: "Cannot delete note" });
    }
    res.json({ message: "Note has been deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal error" });
  }
});

module.exports = router;
