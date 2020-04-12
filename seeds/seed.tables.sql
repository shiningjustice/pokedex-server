BEGIN;

TRUNCATE
  "saved_data",
  "user";

INSERT INTO "user" ("id", "username", "password", "first_name")
VALUES
  (
    1,
    'admin',
    -- password = "P@ssw0rd", salted by 12
    '$2a$12$97iynXdhkTqyWYjlISIIbevz0gPEq0QX7RstxZji87kMN.bdn01l2',
    'Admin'
  );

INSERT INTO "saved_data" ("id", "user_id", "favorited", "notes")
VALUES
  (
    1,
    1,
    true,
    'My first starter Pokemon'
  ),
  (
    4,
    1,
    false,
    'I don''t know much about Pokemon so I won''t pretend I know anything relevant to add to these notes.'
  ),
  (
    6, 
    1,
    true, 
    ''
  );

COMMIT; 