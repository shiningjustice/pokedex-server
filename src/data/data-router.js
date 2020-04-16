/*****************************************************************
	IMPORTS
******************************************************************/
const express = require('express');
const Pokedex = require('pokedex-promise-v2');
const SavedDataService = require('../saved-data/saved-data-service');
const { optionalAuth } = require('../middleware/jwt-auth');

/*****************************************************************
	VARIABLES/HELPER FUNCS
******************************************************************/
const dataRouter = express.Router();
const P = new Pokedex();

const mainRoute = '/api/v2';
const itemsPerPage = 20;
const offset = (pageNumber) => itemsPerPage * (pageNumber - 1);
const validCategories = ['type', 'shape', 'color', 'generation'];
const generations = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

/*****************************************************************
	ROUTES
******************************************************************/
dataRouter.use(optionalAuth);
dataRouter.route('/pokemon').get(getAllPokemon);
dataRouter.route('/:category').get(getSubcategories);
dataRouter.route('/pokemon/search').get(getRequestedPokemon);
dataRouter.route('/:category/search').get(getFilteredPokemon);

/*****************************************************************
	ROUTE FUNCTIONS/MIDDLWARE
******************************************************************/
/**
 * @returns paginated results for pokemon by pokemon number
 * @query {number} - page number
 */
async function getAllPokemon(req, res, next) {
	const pageNumber = req.query.page;

	// require page number
	if (!pageNumber)
		return res.status(400).json({ error: 'missing page number' });

	try {
		const pokemon = await P.resource(
			`${mainRoute}/pokemon/?limit=${itemsPerPage}&offset=${offset(pageNumber)}`
		);

		return res.status(200).json(pokemon.results);
	} catch (error) {
		next(error);
	}
}

/**
 * @description Returns subcategories of requested category
 */
async function getSubcategories(req, res, next) {
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
}

/**
 * @description Returns requested Pokemon object by id or number (relative
 * size is much larger than `get /pokemon` object). Multiple queries allowed.
 * Gets saved data for pokemon if user valid
 */
async function getRequestedPokemon(req, res, next) {
	console.log(`getRe'dPokemon`);
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
		console.log('in try loop');
		const pokemonData = await P.getPokemonByName(searchFor);
		// const pokemonData = [ {id: 1}, {id: 2} ];
		// const pokemonData = { id: 1 };
		console.log(pokemonData.name);
		const savedFields = ['favorited', 'notes'];

		if (req.user) {
			console.log('req.user is true');

			if (Array.isArray(pokemonData)) {
				console.log("`pokemonData` c'est un array");

				Promise.all(
					pokemonData.map(async (pokemon) => {
						console.log('here i am', pokemon.id);
						const savedData = await SavedDataService.getUserSavedDataItem(
							req.app.get('db'),
							req.user.id,
							pokemon.id
						);

						if (savedData) {
							savedFields.forEach((field) => {
								if (savedData[field]) pokemon[field] = savedData[field];
							});
						}
					})
				).then(() => res.status(200).json(pokemonData));
			} else {
				console.log(' i am not an array');
				await SavedDataService.getUserSavedDataItem(
					req.app.get('db'),
					req.user.id,
					pokemonData.id
				).then((res) => {
					const savedData = res[0];
					if (savedData) {
						savedFields.forEach((field) => {
							if (savedData[field]) pokemonData[field] = savedData[field];
							console.log(pokemonData[field]);
						});
						console.log(savedData);
					}
				});
			}
		}
		return res.status(200).json(pokemonData);
	} catch (error) {
		next(error);
	}
}

/**
 * @description Returns pokemon of requested subcategory. If query to PokeAPI
 * returns pokemon-species, and species contains multiple varieties, only the
 * first pokemon variety will be returned
 */
async function getFilteredPokemon(req, res, next) {
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
	let basicPokemonObjs = [];

	// require category, name, page number
	if (!validCategories.includes(category)) {
		return res.status(400).json({ error: 'invalid category' });
	}
	if (!name) return res.status(400).json({ error: 'missing category name' });
	if (!pageNumber)
		return res.status(400).json({ error: 'missing page number' });

	try {
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

			const initialResponse = await P.resource(
				`/api/v2/pokemon/?limit=${itemsPerPage}&offset=${offsetPerGen}`
			);
			basicPokemonObjs = initialResponse.results;
		} else if (category === 'type') {
			const typeObj = await P.resource(
				`${mainRoute}/${category}/${name}/?limit=${itemsPerPage}&offset=${offset(
					pageNumber
				)}`
			);
			basicPokemonObjs = typeObj.pokemon.map((pObj) => pObj.pokemon);
		} else {
			const categoryObject = await P.resource(
				`${mainRoute}/pokemon-${category}/${name}`
			);

			const speciesUrls = categoryObject.pokemon_species
				.slice(offset(pageNumber), offset(pageNumber) + 20)
				.map((s) => s.url);

			const speciesObjs = await P.resource(speciesUrls);

			// "imperfect" pagination (doesn't account for species having multiple
			// varieties). Species returns pokemon urls within "variety" array. Return
			// the first, even if muliple
			speciesObjs.forEach((s) => {
				basicPokemonObjs.push(s.varieties[0].pokemon);
			});
		}

		return res.status(200).json(basicPokemonObjs);
	} catch (error) {
		next(error);
	}
}

module.exports = {
	dataRouter,
};
