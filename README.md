# Pokedex Server

## Set up

1. You'll need to [download PostgreSQL]('https://www.postgresql.org/download/')
   if you haven't already. If you need more tips on setting it up I'd happy to
   pass along some resources. 

   Then create database `pokedex`.

2. Create an `.env` file and store the following (with substitutions):

```
NODE_ENV=development
PORT=8000
TZ='UTC'
MIGRATION_DB_HOST=127.0.0.1
MIGRATION_DB_PORT=5432
MIGRATION_DB_NAME=pokedex
MIGRATION_DB_USER=[replace-me]
MIGRATION_DB_PASS=[replace-me, is optional]
DATABASE_URL="postgresql://admin@localhost/pokedex"
JWT_SECRET=[replace-me]
JWT_EXPIRY=3h
API-TOKEN=[replace-me]
```

3. Migrate your database with test users and data with `npm run migrate` (optional, you can also just populate users and favorites yourself)
4. `npm install` to install dependencies.
5. `npm run dev` will get the server up and running.