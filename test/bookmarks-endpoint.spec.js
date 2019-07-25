const knex = require('knex');
const fixtures = require('./bookmarks-fixtures');
const app = require('../src/app');


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
    it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
      return supertest(app)
        .get('/api/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
      const secondBookmark = testBookmarks[1];
      return supertest(app)
        .get(`/api/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
      const singleBookmark = testBookmarks[1];
      return supertest(app)
        .delete(`/api/bookmarks/${singleBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /api/bookmarks', () => {

    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
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
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });

    });      

  });  

  describe('GET /api/bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/api/bookmarks/123`)
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });


  describe('DELETE /api/bookmarks/:id', () => {
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
          .delete(`/api/bookmarks/${removeId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() => 
            supertest(app)
              .get(`/api/bookmarks`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(200, expectedBookmarks)
          );                    
      });
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it(`creates an item, responding with 201 and the new item`, () => {
      // const testBookmarks = fixtures();
      const newBookmark = {     
        title: 'Google',
        url: 'https://www.google.com',        
        rating: 4,
      };     
      
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)        
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql('');
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/${res.body.id}`);

        })
        
        .then(res =>          
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, res.body)
        );     
        
      
    });
    it(`responds with 400 and an error message when the 'title' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          // title: 'Google',
          url: 'https://www.google.com',          
          rating: 4,
        })
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: `'title' is required`}
        });
    });
    it(`responds with 400 and an error message when the 'url' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'Google',
          // url: 'https://www.google.com',         
          rating: 4,
        })
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: `'url' is required`}
        });
    });
    it(`responds with 400 and an error message when the 'rating' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'Google',
          url: 'https://www.google.com',         
          // rating: 4,
        })
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: `'rating' is required`}
        });
    });
  


    
  });
  
});