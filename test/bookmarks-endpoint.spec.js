const knex = require('knex');
const fixtures = require('./bookmarks-fixtures');
const app = require('../src/app');
// TODO: remove when updating POST and DELETE
// const store = require('../src/store');

describe('Bookmarks Endpoints', () => {
  let  db;
  

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe(`Unauthorized requests`, () => {
    const testBookmarks = fixtures();
    it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
      return supertest(app)
        .post('/bookmarks')
        .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
      const secondBookmark = testBookmarks[1];
      return supertest(app)
        .get(`/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for DELETE /bookmarks/:id`, () => {
      const singleBookmark = testBookmarks[1];
      return supertest(app)
        .delete(`/bookmarks/${singleBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /bookmarks', () => {

    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
        
      it('gets the bookmarks from the store', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });

    });      

  });  

  describe('GET /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` }
          });
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });


  describe('DELETE /bookmarks/:id', () => {
    context('Given that there are bookmarks in the database', () => {
      const testBookmarks = fixtures();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
      it('responds with 204 and deletes specified bookmark', () => {
        const removeId = 2; 
        let expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== removeId);

        return supertest(app)
          .delete(`/bookmarks/${removeId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() => 
            supertest(app)
              .get(`/bookmarks`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(200, expectedBookmarks)
          );                    
      });
    });
  });

  describe(`POST /bookmarks`, () => {
    it(`creates an item, responding with 201 and the new item`, () => {
      // const testBookmarks = fixtures();
      const newBookmark = {     
        title: 'Google',
        url: 'https://www.google.com',
        description: 'Where we find everything else',
        rating: 4,
      };
      
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .then(() =>
          console.log(newBookmark) 
          // supertest(app)
          //   .get(`/bookmarks/${res.id}`)
          //   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          //   .expect(200, res.id)
        );     
      
    });

    it(`gets new bookmark with specified id`, () => {
      supertest(app)
      //   .get(`/bookmarks/${res.id}`)
      //   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      //   .expect(200, res.id)
    });
  });
  
});