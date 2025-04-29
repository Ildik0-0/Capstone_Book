CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    published_date DATE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    cover_url TEXT
);