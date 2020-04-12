const SavedDataService = {
  getItemsSavedData(db, user_id, pokemon_id) {
    console.log(user_id, pokemon_id)
    return db('saved_data')
      .select('*')
      .where({ user_id })
      .where({ id: pokemon_id })
      .first()
  },
  getCategorysSavedData(db, user_id) {
    return db('saved_data')
      .select('*')
      .where({ user_id })
  },
  saveNewData(db, dataToSave) {
    return db
      .insert(dataToSave)
      .into('saved_data')
      .returning('*')
      .then((rows) => {
        return rows[0];
      })
  },
  updateSavedData(db, user_id, pokemon_id, updatedFields) {
    return db('saved_data')
      .where({ user_id })
      .where({ id: pokemon_id })
      .update({ ...updatedFields })
  },
  deleteSavedData(db, user_id, pokemon_id) {
    return db('saved_data')
      .where({ user_id })
      .where({ id: pokemon_id })
      .del();
  },
};

module.exports = SavedDataService;