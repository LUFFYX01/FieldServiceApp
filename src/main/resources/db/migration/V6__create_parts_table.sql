CREATE TABLE parts (
                       part_id BIGSERIAL PRIMARY KEY,

                       name VARCHAR(255) NOT NULL,

                       part_number VARCHAR(255) NOT NULL UNIQUE,

                       description TEXT,

                       quantity INTEGER NOT NULL,

                       price NUMERIC(10, 2) NOT NULL,

                       active BOOLEAN NOT NULL,

                       created_at TIMESTAMP NOT NULL
);