/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
const MongoClient = require('mongodb');
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectId;
const expect = require('chai').expect;
const dotenv = require("dotenv").config();
mongoose.connect(process.env.DB, {useUnifiedTopology: true, useNewUrlParser: true});

mongoose.connection.once('open', (err) => {
   if(err) {
     console.log("Error connecting to database:" .err);
 } else {
   console.log("Successfully connected to database");
   }});

const Schema = mongoose.Schema;
const ReplySchema = new Schema ({
  text: { type: String },
  created_on: { type: Date, default: new Date() },
  delete_password: { type: String },
  reported: { type: Boolean, default: false },
}, { _id: true });

const ThreadSchema = new Schema ({
  board: { type: String },
  text: { type: String },
  created_on: { type: Date, default: new Date() },
  bumped_on: { type: Date, default: new Date() },
  delete_password: { type: String },
  reported: { type: Boolean, default: false },
  replies: { type: Array, value: ReplySchema }
}, { versionKey: false });

  const Thread = mongoose.model("Thread", ThreadSchema);

Object.fromEntries = arr => {
  return Object.assign({}, ...arr.map(([k, v]) => {
    return ({ [k]: v});
  }));
}
Object.filter = (obj, predicate) => {
  return Object.fromEntries(Object.entries(obj).filter(predicate));
}

module.exports = function (app) {

  app.get('/api/threads/:board', (req, res, next) => {
    const { board } = req.params;
    Thread.find({ board }, '-delete_password -reported', { limit: 10 }, (err, threads) => {
      if (err) next(err);
      const threadArray = [];
      threads.forEach(doc => threadArray.push({
        _id: doc._id,
        text: doc.text,
        created_on: doc.created_on,
        bumped_on: doc.bumped_on,
        replies: doc.replies.map(reply => {
          return Object.filter(reply, ([key, value]) => {
            return key !== 'delete_password' && key !== 'reported';
          });
        }).slice(0, 3),
        replycount: doc.replies.length
      }));
      threadArray.sort((a, b) => b.bumped_on - a.bumped_on);
      res.status(200).json(threadArray);
    });
  });

  app.post('/api/threads/:board', (req, res, next) => {
    const { board } = req.params;
    const { text, delete_password } = req.body;
    if (text.length === 0)
    res.send("empty text field");
    if (delete_password.length === 0)
    res.send("empty password field");
    const thread = new Thread({
      board,
      text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password,
      replies: []
    });
    Thread.findOne({ board, text }, (err, existingThread) => {
      if (err) next(err);
      if (existingThread) res.redirect(`/b/${board}/`);
      thread.save((err, newThread) => {
        if(err) next(err);
        res.redirect(`/b/${board}/`);
      });
    });
  });

  app.put('/api/threads/:board', (req, res, next) => {
    const { board } = req.params;
    const { thread_id } = req.body;
    if (!ObjectId.isValid(thread_id))
    res.send("invalid thread_id");
    Thread.findOne({ board, _id: thread_id }, (err, thread) => {
      if(err) next(err);
      thread.reported = true,
      thread.markModified("reported");
      thread.save((err, updatedThread) => {
        if(err) next(err);
        res.status(200).send("reported");
      });
    });
});

  app.delete('/api/threads/:board', (req, res, next) => {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;
    if (!ObjectId.isValid(thread_id))
    res.send("invalid thread_id");
    if (delete_password.length === 0)
    res.send("empty password field");
    Thread.findOne({ board, _id: thread_id}, (err, board) => {
      if(err) next(err);
      if (board.delete_password !== delete_password)
      res.send("incorrect password");
      board.deleteOne({ board, _id: thread_id }, (err, updateBoard) => {
        if(err) next(err);
        res.status(200).send("success");
      });
    });
    });

    app.get('/api/replies/:board', (req, res, next) => {
      const { board } = req.params;
      const { thread_id } = req.query;
      if(!ObjectId.isValid(thread_id))
      res.send("invalid thread_id");
      Thread.find({ board, _id: thread_id }, '-delete_password -reported', (err, thread) => {
        if (err) next(err);
        const { _id, text, created_on, bumped_on, replies } = thread;
        const replyArray = replies.map(reply => {
          return Object.filter(reply, ([key, value]) => {
            return key !== "delete_password" && key !== "reported";
          });
        });
        res.status(200).json({_id, text, created_on, bumped_on, replies: replyArray });
      });
    });

    app.post('/api/replies/:board', (req, res, next) => {
      const { board } = req.params;
      const { text, delete_password, thread_id } = req.body;
      const rightNow = new Date();
      if (text.length === 0)
      res.send("empty text field");
      if (!ObjectId.isValid(thread_id))
      res.send("invalid thread_id");
      if (delete_password.length === 0)
      res.send("empty password field");
      Thread.findOne({ board, _id: thread_id}, '-delete_password -reported', (err, thread) => {
        if (err) next(err);
        if ((thread.replies.filter(reply => reply.text === text).length > 0)) {
          res.redirect(`/b/${board}/${thread_id}`);
        }
        thread.replies.push({
          _id: new ObjectId(),
          text,
          created_on: rightNow,
          delete_password,
          reported: false
        })
        thread.bumped_on = rightNow;
        thread.replies.sort((a, b) => b.created_on - a.created_on);
        thread.save((err, updatedThread) => {
          if(err) next(err);
          res.redirect(`/b/${board}/${thread_id}`);
        });
      })
      });

    app.put('/api/replies/:board', (req, res, next) => {
      const { board } = req.params;
      const { thread_id, reply_id } = req.body;
      if (!ObjectId.isValid(thread_id))
      res.send("invalid thread_id");
      if (!ObjectId.isValid(reply_id))
      res.send("invalid reply_id");
      Thread.findOne({ board, _id: thread_id }, (err, thread) => {
        if(err) next(err);
        const replyIndex = thread.replies.findIndex(reply => reply_id == reply_id);
        const replyToUpdate = thread.replies[replyIndex];
        replyToUpdate.reported = true,
        thread.markModified("replies");
        thread.save((err, updatedThread) => {
          if(err) next(err);
          res.status(200).send("reported");
        });
      });
  });

    app.delete('/api/replies/:board', (req, res, next) => {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;
      if (!ObjectId.isValid(thread_id))
      res.send("invalid thread_id");
      if (!ObjectId.isValid(reply_id))
      res.send("invalid reply_id");
      if (delete_password.length === 0)
      res.send("empty password field");
      Thread.findOne({ board, _id: thread_id}, (err, thread) => {
        if(err) next(err);
        const replyIndex = thread.replies.findIndex(reply => reply_id == reply_id);
        const replyToUpdate = thread.replies[replyIndex];
        if (replyToUpdate.delete_password === delete_password) {
          replyToUpdate.text = '[deleted]';
          thread.markModified('replies');
          thread.save((err, updatedThread) => {
            if(err) next(err);
            res.status(200).send("success");
          });
        } else {
          res.status(200).send("incorrect password");
        };
      });
      });
}
