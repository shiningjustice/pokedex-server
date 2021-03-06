//sets defaults for values in process.env, if unavailable

module.exports = {
  PORT: process.env.PORT || 8000, 
  NODE_ENV: process.env.NODE_ENV || 'development', 
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://admin@localhost/pokedex',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://admin@localhost/pokedex-test',
  JWT_SECRET: process.env.JWT_SECRET || 'changeme',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
  API_TOKEN: process.env.API_TOKEN
}