-- Reference seed data, previously applied through EF Core's HasData.
--
-- Written idempotently (ON CONFLICT DO NOTHING) so it is safe even if the
-- journal is ever lost and DbUp replays it against a populated database.

INSERT INTO categories (id, name, description) VALUES
    (1, 'Electronics',   'Gadgets, devices and accessories'),
    (2, 'Books',         'Fiction, non-fiction and technical books'),
    (3, 'Home & Garden', 'Furniture, decor and outdoor items')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, price, stock, image_url, created_at, category_id) VALUES
    (1, 'Wireless Mouse',      'Ergonomic 2.4GHz wireless mouse',           24.99, 120, NULL, TIMESTAMPTZ '2026-01-01 00:00:00+00', 1),
    (2, 'Mechanical Keyboard', 'Hot-swappable mechanical keyboard',          89.90,  45, NULL, TIMESTAMPTZ '2026-01-01 00:00:00+00', 1),
    (3, 'Clean Code',          'A Handbook of Agile Software Craftsmanship', 34.50,  60, NULL, TIMESTAMPTZ '2026-01-01 00:00:00+00', 2),
    (4, 'Indoor Plant Pot',    'Ceramic pot, 20cm diameter',                 14.00, 200, NULL, TIMESTAMPTZ '2026-01-01 00:00:00+00', 3)
ON CONFLICT (id) DO NOTHING;

-- Inserting explicit ids above does NOT advance the identity sequences, so the
-- first row the API creates would otherwise collide on the primary key.
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('products',   'id'), (SELECT MAX(id) FROM products));
