const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoints', function () {
  let db;

  const testUsers = helpers.usersArray;
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = helpers.makeKnexInstance();
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));

  /**
   * @description Get token for login
   **/
  describe('POST /api/auth/token', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['username', 'password'];

    requiredFields.forEach((field) => {
      const loginAttemptBody = {
        username: testUser.username,
        password: testUser.password
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/token')
          .send(loginAttemptBody)
          .expect(400, { error: `Missing ${field} in request body` });
      });
    })

    it(`responds 400 'invalid username or password' when bad username`, () => {
      const userInvalidUsername = {
        username: 'user-does-not',
        password: 'exist'
      };
      return supertest(app)
        .post('/api/auth/token')
        .send(userInvalidUsername)
        .expect(400, { error: `Incorrect username or password` });
    });

    it(`responds 400 'invalid username or password' when bad password`, () => {
      const userInvalidPassword = {
        username: testUser.username,
        password: 'wrongPass'
      };
      return supertest(app)
        .post('/api/auth/token')
        .send(userInvalidPassword)
        .expect(400, { error: `Incorrect username or password` });
    });

    it('responds 200 and JWT auth token using secret when valid credentials', () => {
      const userValidCreds = {
        username: testUser.username,
        password: testUser.password,
      };

      const subject = testUser.username;
      const payload = { user_id: testUser.id, first_name: testUser.first_name }; 
      const expectedToken = jwt.sign(payload, process.env.JWT_SECRET,
        {
          subject, 
          expiresIn: process.env.JWT_EXPIRY, 
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .post('/api/auth/token')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken
        });
    });
  });

  /**
   * @description Refresh token
   **/
  describe('PUT /api/auth/token', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    it('responds 200 and JWT auth token using secret', () => {
      const subject = testUser.username;
      const payload = { user_id: testUser.id, first_name: testUser.first_name };
      
      const expectedToken = jwt.sign(payload, process.env.JWT_SECRET,
        {
          subject,
          expiresIn: process.env.JWT_EXPIRY, 
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .put('/api/auth/token')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .expect(200, {
          authToken: expectedToken,
        });
    })
  });
});