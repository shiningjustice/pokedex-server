const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Data Endpoints', function () {
	// let db;
	// const testUsers = helpers.usersArray;
	// const testUser = testUsers[0];
  // const { createSavedSeeds, categories } = helpers;
  const endpointPath = '/api/data';
  const pageNumber = 1;
  const validCategories = ['type', 'shape', 'color', 'generation'];
  const thirdItemEachSubcat = {
    type: 'flying',
    shape: 'fish',
    color: 'brown',
    generation: 'iii',
  }
  // const savedFields = ['favorited', 'notes'];

	// before('make knex instance', () => {
	// 	db = helpers.makeKnexInstance();
	// 	app.set('db', db);
  // });
  
	// after('disconnect from db', () => db.destroy());
	// before('cleanup', () => helpers.cleanTables(db));
  // afterEach('cleanup', () => helpers.cleanTables(db));

  // beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

  /*****************************************************************
    GET /api/data/pokemon

    Get paginated pokemon results
  ******************************************************************/
  describe(`GET ${endpointPath}/pokemon? - all paginated pokemon results`, () => {
    it(`responds 400 and message when sent without page number`, () => {
      return supertest(app)
        .get(`${endpointPath}/pokemon?page=`)
        .expect(400, { error: 'missing page number' });
    });

    it(`responds 200 and pokemon results when sent with page number`, () => {
      return supertest(app)
        .get(`${endpointPath}/pokemon?page=${pageNumber}`)
        .expect(200)
        .then(res => {
          expect(res.body.results[2].name === "venusaur");
        });
    })
  });

  /*****************************************************************
    GET /api/data/:category

    Get subcategories of requested category
  ******************************************************************/
  describe(`GET ${endpointPath}/:category - subcategories of requested category`, () => {
    it(`responds 400 'invalid category' when invalid category`, () => {
      return supertest(app)
        .get(`${endpointPath}/invalidcat`)
        .expect(400, {error: 'invalid category' })
    });

    // let category = 'color';
    validCategories.forEach(category => {
      it(`responds 200 subcategories when valid category`, () => {
        return supertest(app)
          .get(`${endpointPath}/${category}`)
          .expect(200)
          .then(res => {
            category === 'generation' ? (
              expect(res.body[2].toLowerCase() === thirdItemEachSubcat[category])
            ) : (
              expect(res.body.results[2].name === thirdItemEachSubcat[category])
            );
          });
      });
    });
  });

  /*****************************************************************
    GET /api/data/pokemon/search?

    Get requested Pokemon by id or number
  ******************************************************************/
  describe(`GET ${endpointPath}/pokemon/search? - gets req'ed Pokemon by id or number`, () => {
    // if name and id are empty then it returns a 400, missing parameters
    it(`returns 400 'no queries provided' when none are passed in`, () => {
      return supertest(app)
        .get(`${endpointPath}/pokemon/search?`)
        .expect(400, { error: 'no queries provided'});
    })
    
    it(`returns 200 and search result when name passed in`, () => {
      const queryString = 'name=venusaur';
      return supertest(app)
        .get(`${endpointPath}/pokemon/search?${queryString}`)
        .expect(200)
        .then(res => expect(res.body.id).to.be.eql(3));
    });

    it(`returns 200 and search result when id passed in`, () => {
      const queryString = 'id=3';
      return supertest(app)
        .get(`${endpointPath}/pokemon/search?${queryString}`)
        .expect(200)
        .then(res => {
          expect(res.body.name).to.be.eql('venusaur')
        });
    });

    it(`returns 200 and search result when multiple names are passed in`, () => {
      const queryString = 'name=venusaur&name=bulbasaur';

      return supertest(app)
        .get(`${endpointPath}/pokemon/search?${queryString}`)
        .expect(200)
        .then(res => {
          expect(res.body[0].id).to.be.eql(3);
          expect(res.body[1].id).to.be.eql(1);
        });
    });
    
    it(`returns 200 and search result when names and id are passed in`, () => {
      const queryString = 'name=venusaur&name=bulbasaur&id=4';

      return supertest(app)
        .get(`${endpointPath}/pokemon/search?${queryString}`)
        .expect(200)
        .then(res => {
          expect(res.body[0].id).to.be.eql(3);
          expect(res.body[1].id).to.be.eql(1);
          expect(res.body[2].name).to.be.eql('charmander');
        });
    });
  });

  /*****************************************************************
    GET /api/data/:category/search?

    Get results of subcategory
  ******************************************************************/
  describe(`GET ${endpointPath}/:category/search?`, () => {
    it(`returns 400 'invalid category' when invalid category passed in`, () => {
      return supertest(app)
        .get(`${endpointPath}/invalidCat/search?page=1`)
        .expect(400, { error: 'invalid category' });
    });

    it(`returns 400 'missing category name' when missing name query`, () => {
      return supertest(app)
        .get(`${endpointPath}/${validCategories[0]}/search?page=1`)
        .expect(400, { error: 'missing category name' });
    });

    it(`returns 400 'missing page number' when missing page param`, () => {
      return supertest(app)
        .get(`${endpointPath}/${validCategories[0]}/search?name='venusaur'`)
        .expect(400, { error: 'missing page number' });
    });

    const { expectedLength, testIndex, page } = helpers.categoryHelpers;

    helpers.categoryHelpers.categories.forEach(categoryObj => {
      const { category, subcategory, expectedName, expectedId } = categoryObj; 

      it(`returns 200 and array of pokemon when valid data passed in for category '${category}'`, () => {
        return supertest(app)
          .get(`${endpointPath}/${category}/search?page=${page}&name=${subcategory}`)
          .expect(200)
          .then(res => {
            const resArr = res.body;
            
            expect(resArr.length).to.be.eql(expectedLength);
            expect(resArr[testIndex].id).to.be.eql(expectedId);
            expect(resArr[testIndex].name).to.be.eql(expectedName);
          });
      });
    });
  });
});