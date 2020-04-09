//sets defaults for values in process.env, if unavailable

module.exports = {
  PORT: process.env.PORT || 8000, 
  NODE_ENV: process.env.NODE_ENV || 'development', 
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://admin@localhost/pokedex',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://admin@localhost/pokedex-test',
}