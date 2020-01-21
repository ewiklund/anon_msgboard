/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const deletePassword = "password";
let threadId, replyId;

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {

    suite('POST', function() {
      test('Redirect after creating a board', function(done) {
        chai.request(server)
        .post("/api/threads/general/")
        .send({
          text: 'test',
          delete_password: deletePassword
          })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.match(res.redirect[0], /b\/general\/$/);
          done();
        });
      });
    });

    suite('PUT', function() {
      test('Report a board', function(done) {
        chai.request(server)
        .put("/api/threads/general/")
        .send({
          thread_id: threadId
          })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "reported");
          done();
        });
    });
    });

    suite('GET', function() {
        test('Receive 10 bumped threads with 3 replies', function(done) {
          chai.request(server)
          .get("/api/threads/general/")
          .query({})
          .end(function(err, res) {
            threadId = res.body[0]._id;
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isArray(res.body[0].replies);
            assert.isNumber(res.body[0].replycount);
            assert.isAtMost(res.body.length, 10);
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "replies");
            assert.property(res.body[0], "replycount");
            assert.notProperty(res.body[0], "delete_password");
            done();
          });
        });
    });

    suite('DELETE', function() {
      test('Attempting to delete a board with an incorrect delete_password', function(done) {
        chai.request(server)
        .delete("/api/threads/general/")
        .send({
          thread_id: threadId,
          delete_password: "wrongPassword"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
    });

    test('Succeed in deleting a board with the correct delete_password', function(done) {
      chai.request(server)
      .delete("/api/threads/general/")
      .send({
        thread_id: threadId,
        delete_password: "deletePassword"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });

  });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    suite('TEST SETUP', () => {
      test('Create board for following test to use', function(done) {
        chai.request(server)
        .post('/api/threads/general/')
        .send({
          text: 'test',
          delete_password: deletePassword
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.redirects[0].slice(-11), '/b/general/');
          done();
        });
      });

      test('Obtain newly created board\'s thread_id', function(done) {
        chai.request(server)
        .get('/api/threads/general/')
        .end(function(err, res) {
          threadId = res.body[0]._id;
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isArray(res.body[0].replies);
          assert.isAtMost(res.body.length, 10);
          assert.isAtMost(res.body[0].replies.length, 3);
          done();
        });
      });
    });

    suite('POST', function() {
      test('Redirect after creating a reply', function(done) {
      chai.request(server)
      .post('/api/replies/general/')
      .send({
        text: 'Tech',
        thread_id: threadId,
        delete_password: deletePassword
      })
      .end(function(err, res) {
        const urlValidator = new RegExp(`b\/general\/${threadId}$`);
        assert.equal(res.status, 200);
        assert.match(res.redirects[0], urlValidator);
        done();
      });
    });
    });

    suite('GET', function() {
      test('Receive entire thread with all replies', function(done) {
      chai.request(server)
      .get(`/api/replies/general/?thread_id=${threadId}`)
      .end(function(err, res) {
        replyId = res.body.replies[0]._id;
        assert.equal(res.status, 200);
        assert.equal(res.body._id, threadId);
        assert.isArray(res.body.replies);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.property(res.body, 'replies');
        assert.notProperty(res.body, 'delete_password');
        done();
      });
    });
    });

    suite('PUT', function() {
      test('Report a reply', function(done) {
      chai.request(server)
      .put('/api/replies/general/')
      .send({
        thread_id: threadId,
        reply_id: replyId
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
    });
    });

    suite('DELETE', function() {
      test('Attempt to delete a reply with an incorrect delete_password', function(done) {
      chai.request(server)
      .delete('/api/replies/general/')
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: 'wrongPassword'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
    });

    test('Succeed in deleting a board with the correct delete_password', function(done) {
      chai.request(server)
      .delete("/api/replies/general/")
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: "deletePassword"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });

  });

});
});
