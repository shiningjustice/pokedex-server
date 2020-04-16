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
 * @description middleware function. Redirected here if user = true. Takes in
 * robust pokemon object or array of such and adds notes or favorites key:value
 * pairs based on user for pokemon object
 */
// const getSavedAndAddToRes = async (result) => {
//   console.log('in saved and add to res');
//   console.log(Array.isArray(result));
// 	try {
// 		if (Array.isArray(result)) {
//       console.log('i am an array');
// 			for (let pokemon of result) {
// 				const savedData = await SavedDataService.getUserSavedDataItem(
// 					req.app.get('db'),
// 					req.user.id,
// 					pokemon.id
// 				);

// 				if (savedData) {
// 					savedFields.forEach((field) => {
// 						if (savedData.field) pokemon[field] = savedData[field];
// 					});
// 				}
// 			}
// 		} else {
//       console.log(' i am not an array', req.user.id, result.id);
// 			const savedData = await SavedDataService.getUserSavedDataItem(
// 				req.app.get('db'),
// 				req.user.id,
// 				result.id
// 			);

// 			if (savedData) {
//         console.log('saved data is true');
// 				savedFields.forEach((field) => {
// 					if (savedData[field]) result[field] = savedData[field];
// 				});
// 			}
// 		}

// 		return res.status(200).json(result);
// 	} catch (error) {
// 		next(error);
// 	}
// };

/**
 * @description
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function getAllFavoritedItems(req, res, next) {
	console.log('userid', req.user.id);
	try {
		const allSaved = await SavedDataService.getUserFavorites(
			req.app.get('db'),
			req.user.id
		);

		if (!Array.isArray(allSaved)) {
			allSaved = [allSaved];
		}
		console.log({ allSaved });

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
			console.log(key, value);
			return res.status(400).json({ error: `Missing ${key} in request body` });
		}
	}

	try {
		const itemAlreadySaved = await SavedDataService.itemAlreadySaved(
			req.app.get('db'),
			req.user.id,
			id
		);
		console.log({itemAlreadySaved});
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
	console.log(158, 'reqbody', req.body);
	const { id, favorited, notes } = req.body;
	const itemSavedFields = ['favorited', 'notes'];
	const fieldsToUpdate = {};

	console.log(163, { id }, { favorited }, { notes });

	if (!id) {
		return res.status(400).json({ error: `Missing id in request body` });
	}

	itemSavedFields.forEach((field) => {
		if (req.body[field] !== undefined) {
			fieldsToUpdate[field] = req.body[field];
		}
	});

	console.log(175, { fieldsToUpdate });

	if (!Object.keys(fieldsToUpdate).length) {
		return res.status(400).json({ error: `Missing data in request body` });
	}

	try {
		let currData = await SavedDataService.getUserSavedDataItem(
			req.app.get('db'),
			req.user.id,
			id
		);

		console.log(188, { currData });

		if (Array.isArray(currData)) {
			currData = currData[0];
		}

		// if after update, both fields are false, then delete entry
		for (const [key, value] of Object.entries(fieldsToUpdate)) {
			currData[key] = value;
		}
		console.log(195, 'currData', currData);
		let falseCounter = 0;
		savedFields.forEach((field) => {
			if (!currData[field]) ++falseCounter;
		});

		if (falseCounter === 2) return next();
		console.log(199, 'pokemonId', id);

		if (fieldsToUpdate.notes) {
			fieldsToUpdate.notes = xss(notes);
		}

		const updatedData = await SavedDataService.updateSavedData(
			req.app.get('db'),
			req.user.id,
			id,
			fieldsToUpdate
		);
			
		console.log(210, 'updateddata index', {updatedData}, updatedData);
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
