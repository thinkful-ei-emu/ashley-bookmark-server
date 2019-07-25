const express = require('express');
// const uuid = require('uuid/v4');
const logger = require('../logger');
const xss = require('xss');
// const bookmarks = require('../store');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./bookmarks-service');


const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {   
    BookmarksService.getAllBookmarks(req.app.get('db')) 
      .then(bookmarks => {
        return res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);   
  })
  .post(bodyParser, (req, res, next) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      }     

    }
    const { title, url, rating, description} = req.body;

 
    if(url && !(url.includes('http://') || url.includes('https://'))){
      logger.error('valid url is required');
      return res.status(400).send('Please provide a valid url ex: http:// or https://');
    }
    if(!Number.isInteger(rating) || rating < 0 || rating > 5 ){
      logger.error('valid rating is required');
      return res.status(400).send('Please provide a valid rating between 1-5');
    }
    
    const newBookmark = { title, url, description, rating };

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    ).then(bookmark => {
      logger.info(`Bookmark with id ${bookmark.id} was created`);
      res.status(201).location(`/bookmarks/${bookmark.id}`).json((serializeBookmark(bookmark)));
    }).catch(next);

        
  });

bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.getById(req.app.get('db'), bookmark_id)
    
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark Not Found` }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  });


module.exports = bookmarksRouter;
