const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const bookmarks = require('../store');
const bookmarksRouter = express.Router();
const bodyParser = express.json();


bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {    
    res.json(bookmarks);   
  })
  .post(bodyParser, (req, res) => {
    const {title, url, rating, description} = req.body;
    if(!title) {
      logger.error('Title is required');
      return res.status(400).send('Please submit a valid title')
    }
    if(!url) {
      logger.error('url is required');
      return res.status(400).send('Please submit a valid url')
    }
    if(url && !url.includes('https://')){
      logger.error('valid url is required');
      return res.status(400).send('Please submit a valid url ex: https://')
    }
  });

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(c => c.id == id);
    //make sure that bookmark is found
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Bookmark not found');
    }
    res.json(bookmark);
  })
  .delete((req, res ) => {
    const {id} = req.params;
    const bookmarkIndex = bookmarks.findIndex(c => c.id == id)
    if(bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Not found');
    }
  });

 

module.exports = bookmarksRouter;
