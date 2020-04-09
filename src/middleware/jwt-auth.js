const { JsonWebTokenError } = require('jsonwebtoken');
const AuthService = require('../auth/auth-service');


/**
 * @description is identical to `requireAuth` except doesn't fail if no valid auth. Still assigns `req.user` if successful
 * @param req 
 * @param res 
 * @param next 
 */
async function isValidUser(req, res, next) {  
  const authToken = req.get('Authorization')  || '';

  let bearerToken; 
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    // console.log('going next')
    return next();
  } else {
    // console.log('i detect a bearer token')
    bearerToken = authToken.slice(7, authToken.length);
  }
  // console.log('going to the try block');
  try {
    // console.log('in the try block');
    const payload = AuthService.verifyJwt(bearerToken);
    
    const user = await AuthService.getUserWithUsername(req.app.get('db'), payload.sub);

    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return next();
    }
    next(error);
  };
}

async function requireAuth(req, res, next) {
  const authToken = req.get('Authorization')  || '';

  let bearerToken; 
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  } else {
    bearerToken = authToken.slice(7, authToken.length);
  }

  try {
    const payload = AuthService.verifyJwt(bearerToken);
    
    const user = await AuthService.getUserWithUsername(req.app.get('db'), payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }
    next(error);
  };
};


module.exports = {
  isValidUser,
  requireAuth
};