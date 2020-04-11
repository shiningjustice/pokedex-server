const { NODE_ENV } = require('../config');
const logger = require('./logger');
 
function errorHandler(error, req, res, next) {
  logger.error(error.message);
  const response = 
    NODE_ENV === 'production'
      ? { error: { message: 'server error' } }
      : { message: error.message, error };
    return res.status(error.status ? error.status : 500).json(response);
}
 
module.exports = errorHandler;