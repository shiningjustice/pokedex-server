CREATE TABLE "user" (
  "id" SERIAL PRIMARY KEY, 
  "username" TEXT NOT NULL UNIQUE, 
  "password" TEXT NOT NULL,
  "first_name" TEXT NOT NULL
);