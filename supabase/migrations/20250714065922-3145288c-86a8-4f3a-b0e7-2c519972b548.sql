-- Create user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'dentist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;