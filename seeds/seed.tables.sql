BEGIN;

TRUNCATE
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

COMMIT; 