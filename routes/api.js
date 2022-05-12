'use strict';
const mongoose = require('mongoose');
const threadModel = require('../models/threads');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post((req, res) => {
      const {text, delete_password} = req.body;
      const {board} = req.params;

      const thread = new threadModel({
        board: board,
        text: text,
        replies: [],
        delete_password: delete_password,
      });

      thread.save(function(err, doc) {
         res.json(doc)
      });
    })
    .get((req, res) => {
      const {board} = req.params;
      
      threadModel
        .find({board})
        .sort("-created_on")
        .limit(10)
        .lean()
        .exec((err, docs) => {
          const response = docs.map(doc => {
            return {
              _id: doc._id,
              text: doc.text,
              replies: doc.replies,
              created_on: doc.created_on,
              bumped_on: doc.bumped_on,
            }
          })
          response.forEach(thread => {
            thread['replycount'] = thread.replies.length;

            thread.replies.sort((thread1, thread2) => {
              return thread2.created_on - thread1.created_on;
            });

            thread.replies = thread.replies.slice(0, 3);

            thread.replies.forEach(reply => {
              reply.delete_password = undefined;
              reply.reported = undefined;
            })
          })
          res.json(response);
        })
    })
    .delete((req, res) => {
      const {delete_password, thread_id} = req.body;
      threadModel
        .findOne({_id: thread_id})
        .select({delete_password: 1})
        .lean()
        .exec((err, thread) => {
          if (thread.delete_password === delete_password ) {
            threadModel.findOneAndDelete({_id: thread_id}, (err, doc) => {
              res.send("success");
            })
          } else {
            res.send("incorrect password");
          }
        });
     
    })
    .put((req, res) => {
      const {thread_id} = req.body;
      threadModel.updateOne({_id: thread_id}, {reported: true}, function(err, doc) {
        res.send("reported");
      })
    });
    
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const {text, delete_password, thread_id} = req.body;

      const result = await threadModel.findOneAndUpdate({_id: thread_id}, {
        bumped_on: Date.now(),
        $push: {replies: {
          _id: mongoose.Types.ObjectId(),
          text: text,
          created_on: Date.now(),
          delete_password: delete_password,
          reported: false,
        }}
      }, {
        new: true,
      });

      res.json(result);
    })
    .get((req, res) => {

      const {thread_id} = req.query;
      threadModel
        .findOne({_id: thread_id})
        .exec((err, thread) => {
          thread.delete_password = undefined;
          thread.reported = undefined;
          
          
          thread.replies.sort((thread1, thread2) => {
            return thread2.created_on - thread1.created_on;
          });
          
          thread.replies.forEach(reply => {
            reply.delete_password = undefined;
            reply.reported = undefined;
          })

          res.json(thread);
        })
    })
    .delete((req, res) => {
      const {delete_password, thread_id, reply_id} = req.body;
      threadModel
        .findOne({_id: thread_id})
        .lean()
        .exec((err, thread) => {
          const filteredReply = thread.replies.filter(item => {
            
            return String(item._id) === reply_id;
          });
          if (filteredReply[0].delete_password === delete_password ) {
            threadModel.updateOne({_id: thread_id, "replies._id": reply_id}, {
              "$set": {
                "replies.$.text": "[deleted]",
              }
            }, (err, doc) => {
              res.send("success");
            })
          } else {
            res.send("incorrect password")
          }
        });
     
    })
    .put((req, res) => {
      const {thread_id, reply_id} = req.body;

      threadModel.updateOne({_id: thread_id, "replies._id": reply_id}, {
        "$set": {
          "replies.$.reported": true,
        }
      }, (err, doc) => {
        res.send("reported");
      })
    })

};
