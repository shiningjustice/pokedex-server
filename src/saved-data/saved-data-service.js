const SavedDataService = {
	itemAlreadySaved(db, user_id, pokemon_id) {
		return db('saved_data')
			.where({ id: pokemon_id, user_id: user_id })
			.then((item) => !!item.length);
	},
	// returns an array 
	getUserSavedDataItem(db, user_id, pokemon_id) {
		console.log(user_id, pokemon_id);
		return db('saved_data')
			.select('*')
			.where({ id: pokemon_id, user_id: user_id })
	},
	getAllUserSavedDataItems(db, user_id) {
		return db('saved_data').select('*').where({ user_id: user_id });
	},
	getUserFavorites(db, user_id) {
		return db('saved_data')
			.select('*')
			.where({ user_id: user_id, favorited: true });
	},
	saveNewData(db, newDataObj) {
		return db
			.insert(newDataObj)
			.into('saved_data')
			.returning('*')
			.then((rows) => {
				return rows[0];
			});
	},
	updateSavedData(db, user_id, pokemon_id, updatedFields) {
		return db('saved_data')
			.where({ id: pokemon_id, user_id: user_id })
			.update(updatedFields, ['favorited', 'notes']);
	},
	deleteSavedData(db, user_id, pokemon_id) {
		return db('saved_data').where({ id: pokemon_id, user_id: user_id }).del();
	},
};

module.exports = SavedDataService;
