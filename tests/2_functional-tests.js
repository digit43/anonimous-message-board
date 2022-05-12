const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');

const threadModel = require('../models/threads');

chai.use(chaiHttp);

let thread_id;
let created_thread_id;
let reply_id;

suite('Functional Tests', function() {

  
  before(async function() {
    const thread = new threadModel({
      text: "thread text",
      delete_password: "delete_password",
      replies: [
        {
          _id: mongoose.Types.ObjectId(),
          created_on: Date.now(),
          text: "test chai reply",
          delete_password: "delete_password",
          reported: false,
        }
      ],
      board: "test1111"
    })
    const doc = await thread.save();
    thread_id = String(doc._id);
    reply_id = String(doc.replies[0]._id);
  });

  
  test("Creating a new thread: POST request to /api/threads/{board}", function(done) {
    chai
      .request(server)
      .post('/api/threads/test1111')
      .type('form')
      .send({
        text: "test text chai",
        delete_password: "delete_password",
      })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.property(res.body, "board");
        assert.equal(res.body['board'], "test1111");
        assert.property(res.body, "text");
        assert.property(res.body, "reported");
        assert.property(res.body, "delete_password");
        assert.property(res.body, "replies");
        assert.property(res.body, "created_on");
        assert.property(res.body, "bumped_on");
        created_thread_id = res.body._id;
      });
      done();
  });

  test("Creating a new reply: POST request to /api/replies/{board}", function(done) {
      chai
        .request(server)
        .post('/api/replies/test1111')
        .send({
          text: "test text chai 1",
          delete_password: "delete_password",
          thread_id: thread_id,
        })
        .end(function(err, res) {
          assert.equal(res.status, 200, "Response status is always 200");
          assert.property(res.body, "board");
          assert.equal(res.body['board'], "test1111");
          assert.property(res.body, "text");
          assert.property(res.body, "reported");
          assert.property(res.body, "delete_password");
          assert.property(res.body, "replies");
          assert.equal(res.body["replies"].length, 2);
          assert.property(res.body, "created_on");
          assert.property(res.body, "bumped_on");
        });
        done();
  });
  
  test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function(done) {
    chai
      .request(server)
      .get('/api/threads/test1111')
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.isAtMost(res.body.length, 10);
        assert.isAtMost(res.body[0].replies.length, 3);
      });
      done();
  })

  test("Reporting a thread: PUT request to /api/threads/{board}", function(done) {
    chai
      .request(server)
      .put('/api/threads/test1111')
      .send({ thread_id })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "reported");
      });
      done();
  });

  test("Reporting a reply: PUT request to /api/replies/{board}", function(done) {
    chai
      .request(server)
      .put('/api/replies/test1111')
      .send({ reply_id, thread_id })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "reported");
      });
      done();
  });

  test("Viewing a single thread with all replies: GET request to /api/replies/{board}", function(done) {
    chai
      .request(server)
      .get('/api/replies/test1111')
      .query({ thread_id })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.property(res.body, "board");
        assert.equal(res.body['board'], "test1111");
        assert.property(res.body, "text");
        assert.property(res.body, "replies");
        assert.isArray(res.body["replies"]);
        assert.property(res.body, "created_on");
        assert.property(res.body, "bumped_on");
      });
      done();
  });

  test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function(done) {
    chai
      .request(server)
      .delete('/api/replies/test1111')
      .send({
        thread_id: thread_id,
        reply_id: reply_id,
        delete_password: "delete",
      })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "incorrect password");
      });
      done();
  });

  test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function(done) {
    chai
      .request(server)
      .delete('/api/replies/test1111')
      .send({
        thread_id: thread_id,
        reply_id: reply_id,
        delete_password: "delete_password",
      })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "success");
      });
      done();
  });

  test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function(done) {
    chai
      .request(server)
      .delete('/api/threads/test1111')
      .send({
        thread_id: thread_id,
        delete_password: "delete"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "incorrect password");
      });
      done();
  })
  
  test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function(done) {
    chai
      .request(server)
      .delete('/api/threads/test1111')
      .send({
        thread_id: thread_id,
        delete_password: "delete_password"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200, "Response status is always 200");
        assert.equal(res.text, "success");
      });
      done();
  });
});

