const express = require('express');
const Pokedex = require('pokedex-promise-v2');

const dataRouter = express.Router();
const P = new Pokedex();

const mainRoute = '/api/v2';
const mainRoutePoke = `${mainRoute}/pokemon`;
const itemsPerPage = 20;
const offset = (pageNumber) => itemsPerPage * (pageNumber - 1);
const validCategories = ['type', 'shape', 'color', 'generation'];
const generations = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

/**
 * @returns paginated results for pokemon by pokemon number
 * @query {number} - page number
 */
dataRouter.route('/pokemon?').get(async (req, res, next) => {
	const pageNumber = req.query.page;

	// require page number
	if (!pageNumber)
		return res.status(400).json({ error: 'missing page number' });

	try {
		const pokemon = await P.resource(
			`${mainRoutePoke}/?limit=${itemsPerPage}&offset=${offset(pageNumber)}`
		);

		return res.status(200).json(pokemon);
	} catch (error) {
		next(error);
	}
});

/**
 * @description Returns subcategories of requested category
 */
dataRouter.route('/:category').get(async (req, res, next) => {
	let { category } = req.params;
	const pageNumber = req.query.page;
	let subcategories;

	if (!validCategories.includes(category)) {
		return res.status(400).json({ error: 'invalid category' });
	}

	try {
		// If generation
		if (category === 'generation') {
			subcategories = generations;
		} // If type, shape, or color
		else {
			if (category !== 'type') category = `pokemon-${category}`;
			subcategories = await P.resource(
				`${mainRoute}/${category}/?limit=${itemsPerPage}&offset=${offset(
					pageNumber
				)}`
			);
		}

		return res.status(200).json(subcategories);
	} catch (error) {
		next(error);
	}
});

/**
 * @description Returns requested Pokemon by id or number. Multiple queries can be submitted
 */
dataRouter.route('/pokemon/search?').get(async (req, res, next) => {
	let { name, id } = req.query;
	let searchFor;

	if (!name && !id) {
		return res.status(400).json({ error: 'no queries provided' });
	}

	// If terms in name and id, search as an array. Otherwise rename params
	// so that you don't need more conditionals
	if (name && id) {
		searchFor = [...name, ...id];
	} else {
		[name, id].forEach((query) => {
			if (query) {
				searchFor = query;
			}
		});
	}

	try {
		return await P.getPokemonByName(searchFor).then((results) =>
			res.status(200).json(results)
		);
	} catch (error) {
		next(error);
	}
});

/**
 * @returns results of subcategory
 * Note: this will return ALL results for pokemon
 */
dataRouter.route('/:category/search?').get(async (req, res, next) => {
	const { category } = req.params;
	const { name, page } = req.query;
	const pageNumber = page;
	const numPokemonByGeneration = [
		{
			generation: 1,
			new: 151,
			total: 151,
		},
		{
			generation: 2,
			new: 100,
			total: 251,
		},
		{
			generation: 3,
			new: 135,
			total: 386,
		},
		{
			generation: 4,
			new: 107,
			total: 493,
		},
		{
			generation: 5,
			new: 156,
			total: 649,
		},
		{
			generation: 6,
			new: 72,
			total: 721,
		},
		{
			generation: 7,
			new: 88,
			total: 809,
		},
		{
			generation: 8,
			new: 85,
			total: 894,
		},
	];

  // require category, name, page number
	if (!validCategories.includes(category)) {
		return res.status(400).json({ error: 'invalid category' });
  }
  if (!name)
    return res.status(400).json({ error: 'missing category name' });
	if (!pageNumber)
		return res.status(400).json({ error: 'missing page number' });

	try {
		let pokemonUrls = [];

    //Category 'generation' pagination determined in server, so handled
    //differently. Category 'type' immediately returns basic Pokemon objects
    //(url + name) while 'color' and 'shape' imm. return basic Pokemon species
    //objects, so handled differently too. 
		if (category === 'generation') {
			genStr = name.toLowerCase();

			const index = generations.findIndex((gen) => gen === genStr);
			genStats = numPokemonByGeneration[index];
			genStartingNum = genStats.total - genStats.new;

			const offsetPerGen = offset(pageNumber) + genStartingNum;

			const basicPokemonObjs = await P.resource(
				`/api/v2/pokemon/?limit=${itemsPerPage}&offset=${offsetPerGen}`
			);
			pokemonUrls = basicPokemonObjs.results.map((obj) => obj.url);
		} else if (category === 'type') {
      const initialResult = await P.resource(
        `${mainRoute}/${category}/${name}/?limit=${itemsPerPage}&offset=${offset}`
      );
      pokemonUrls = initialResult.pokemon.map(
        (basicPObj) => basicPObj.pokemon.url
      );
    } else {
      const initialResult = await P.resource(`${mainRoute}/pokemon-${category}/${name}`);

      // "imperfect" pagination (doesn't account for species having multiple varieties)
      const speciesUrls = initialResult.pokemon_species
        .slice(offset(pageNumber), offset(pageNumber) + 20)
        .map((s) => s.url);

      const speciesObjs = await P.resource(speciesUrls);
      // Species returns pokemon urls within "variety" array. Return the first,
      // even if muliple
      speciesObjs.forEach((s) => {
        pokemonUrls.push(s.varieties[0].pokemon.url);
      });
    };
    
    const robustPokemonObjs = await P.resource(pokemonUrls.slice(0, 20));
		return res.status(200).json(robustPokemonObjs);
	} catch (error) {
		next(error);
	}
});

// ***************************************** !!!! CHANGE ITEMS PER PAGE LIMIT BACK TO VARIABLE
// allow for multiple types of base string to be returned. extension is maybe multiple... but dont' allow for more than one category type!!!! so should nto be an array

module.exports = dataRouter;
