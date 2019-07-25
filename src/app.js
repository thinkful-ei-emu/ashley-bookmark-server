require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const bookmarksRouter = require('./bookmarks/bookmarks.router');
const app = express();
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}));
app.use(cors());
app.use(helmet());
app.use(validateBearerToken);
app.use('/api/bookmarks', bookmarksRouter);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

module.exports = app;
