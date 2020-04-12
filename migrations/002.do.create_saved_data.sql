DROP TABLE IF EXISTS saved_data;

CREATE TABLE saved_data (
  id INTEGER NOT NULL, 
  user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
  favorited BOOLEAN DEFAULT false,
  notes TEXT
);