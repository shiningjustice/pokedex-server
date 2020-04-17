const express = require('express');
const xss = require('xss');
const SavedDataService = require('./saved-data-service');
const { requiredAuth } = require('../middleware/jwt-auth');
const Pokedex = require('pokedex-promise-v2');
const savedFields = ['favorited', 'notes'];

const savedDataRouter = express.Router();
const jsonBodyParser = express.json();
const P = new Pokedex();

/*****************************************************************
	ROUTES
******************************************************************/
savedDataRouter.use(requiredAuth);
savedDataRouter
	.route('/')
	.get(getAllFavoritedItems)
	.post(jsonBodyParser, saveNewItem, updateItem, deleteItem)
	.patch(jsonBodyParser, updateItem, deleteItem)
	.delete(jsonBodyParser, deleteItem);

/*****************************************************************
	ROUTE FUNCTIONS/MIDDLWARE
******************************************************************/

/**
 * @description
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function getAllFavoritedItems(req, res, next) {
	try {
		const allSaved = await SavedDataService.getUserFavorites(
			req.app.get('db'),
			req.user.id
		);

		if (!Array.isArray(allSaved)) {
			allSaved = [allSaved];
		}

		Promise.all(
			allSaved.map(async (data) => {
				const pokemon = await P.getPokemonByName(data.id);

				if (data.favorited) {
					pokemon.favorited = true;
				}
				// savedFields.forEach(field => {
				//   if (data[field]) {
				//     pokemon[field] = data[field];
				//   }
				// });
				return pokemon;
			})
		).then((pokemonWSavedData) => {
			return res.status(200).json(pokemonWSavedData);
		});
	} catch (error) {
		next(error);
	}
}

async function saveNewItem(req, res, next) {
	// check that everything we need is here
	const { id, favorited, notes } = req.body;
	const itemSavedFields = [
		{ id: id },
		{ favorited: favorited },
		{ notes: notes },
	];

	for (const [key, value] of Object.entries(itemSavedFields)) {
		if (!value) {
			return res.status(400).json({ error: `Missing ${key} in request body` });
		}
	}

	try {
		const itemAlreadySaved = await SavedDataService.itemAlreadySaved(
			req.app.get('db'),
			req.user.id,
			id
		);
		if (itemAlreadySaved) {
			return next();
		}

		const newDataObj = {
			id,
			user_id: req.user.id,
			favorited,
			notes: xss(notes),
		};
		const savedItem = await SavedDataService.saveNewData(
			req.app.get('db'),
			newDataObj
		);

		return res.status(201).json(savedItem);
	} catch (error) {
		next(error);
	}
}

async function updateItem(req, res, next) {
	const { id, favorited, notes } = req.body;
	const itemSavedFields = ['favorited', 'notes'];
	const fieldsToUpdate = {};

	if (!id) {
		return res.status(400).json({ error: `Missing id in request body` });
	}

	itemSavedFields.forEach((field) => {
		if (req.body[field] !== undefined) {
			fieldsToUpdate[field] = req.body[field];
		}
	});


	if (!Object.keys(fieldsToUpdate).length) {
		return res.status(400).json({ error: `Missing data in request body` });
	}

	try {
		let currData = await SavedDataService.getUserSavedDataItem(
			req.app.get('db'),
			req.user.id,
			id
		);

		if (Array.isArray(currData)) {
			currData = currData[0];
		}

		// if after update, both fields are false, then delete entry
		for (const [key, value] of Object.entries(fieldsToUpdate)) {
			currData[key] = value;
		}
		let falseCounter = 0;
		savedFields.forEach((field) => {
			if (!currData[field]) ++falseCounter;
		});

		if (falseCounter === 2) return next();

		if (fieldsToUpdate.notes) {
			fieldsToUpdate.notes = xss(notes);
		}

		const updatedData = await SavedDataService.updateSavedData(
			req.app.get('db'),
			req.user.id,
			id,
			fieldsToUpdate
		);
			
		return res.status(200).json(updatedData);
	} catch (error) {
		next(error);
	}
}

async function deleteItem(req, res, next) {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ error: `Missing id in request body` });
	}

	try {
		await SavedDataService.deleteSavedData(req.app.get('db'), req.user.id, id);
		return res.status(204).end();
	} catch (error) {
		next(error);
	}
}

module.exports = {
	savedDataRouter,
};
