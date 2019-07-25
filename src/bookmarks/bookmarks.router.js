const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const bookmarks = require('../store');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./bookmarks-service');


bookmarksRouter
  .route('/')
  .get((req, res, next) => {   
    BookmarksService.getAllBookmarks(req.app.get('db')) 
      .then(bookmarks => {res.json(bookmarks);})
      .catch(next);   
  })
  .post(bodyParser, (req, res) => {
    const {title, url, rating, description} = req.body;  
    const numRating = Number(rating);  
    
    if(!title) {
      logger.error('Title is required');
      return res.status(400).send('Please provide a title');
    }
    if(!url) {
      logger.error('url is required');
      return res.status(400).send('Please provide a valid url');
    }
    if(url && !(url.includes('http://') || url.includes('https://'))){
      logger.error('valid url is required');
      return res.status(400).send('Please provide a valid url ex: http:// or https://');
    }
    if(!Number.isInteger(numRating) || numRating < 0 || numRating > 5 ){
      logger.error('valid rating is required');
      return res.status(400).send('Please provide a valid rating between 1-5');
    }


    const id = uuid();
    const bookmark = {id, title, url, rating, description};

    bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} was created`);
    res.status(201).location(`http://localhost:8000/bookmarks/${id}`).json(bookmark);

  });

bookmarksRouter
  .route('/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    BookmarksService.getById(req.app.get('db'), id)
    // const bookmark = bookmarks.find(c => c.id == id);
      .then(bookmark => {
        //make sure that bookmark is found
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).send('Bookmark not found');
        }
        res.json(bookmark);

      })
      .catch(next);
   
  })
  .delete((req, res ) => {
    const {id} = req.params;
    const bookmarksIndex = bookmarks.findIndex(c => c.id == id);
    if(bookmarksIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Not found');
    }
    bookmarks.splice(bookmarksIndex, 1);
    logger.info(`Bookmark list with id ${id} deleted`);
    res.status(204).end();
  });


module.exports = bookmarksRouter;
