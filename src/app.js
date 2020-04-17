'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const userRouter = require('./user/user-router');
const authRouter = require('./auth/auth-router');
const { dataRouter } = require('./data/data-router');
const { savedDataRouter } = require('./saved-data/saved-data-router');
const errorHandler = require('../src/helpers/errorHandler');

const app = express(); 

const morganOption = (NODE_ENV === 'production' ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test',
  });

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/saved-data', savedDataRouter);
app.use('/api/user', userRouter);

app.use(errorHandler);

module.exports = app;