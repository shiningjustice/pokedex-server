'use strict'; 

const app = require('./app');
const { PORT, DATABASE_URL } = require('./config');

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});

app.set('db', db);

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));