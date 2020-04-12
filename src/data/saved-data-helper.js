const SavedDataService = require('./saved-data-service');
const savedFields = ['favorited', 'notes'];

/**
 * @description middleware function. Redirected here if user = true. Takes in
 * robust pokemon object or array of such and adds notes or favorites key:value
 * pairs based on user for pokemon object
 * @param req 
 * @param res 
 * @param next 
 */
const addSavedData = async (req, res, next) => {
  const result = req.pokemon;

  try {
    if (result.length) {
      for (let pokemon of result) {
        const savedData = await SavedDataService.getItemsSavedData(
          req.app.get('db'),
          req.user.id,
          pokemon.id
        );
  
        if (savedData) {
          savedFields.forEach((field) => {
            if (savedData.field) pokemon[field] = savedData[field];
          });
        }
      }
    } else {
      const savedData = await SavedDataService.getItemsSavedData(
        req.app.get('db'),
        req.user.id,
        result.id
      );
      
      if (savedData) {
        savedFields.forEach((field) => {
          if (savedData[field]) result[field] = savedData[field];
        });
      }
    }
  
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSavedData
};