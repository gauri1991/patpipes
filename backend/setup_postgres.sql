-- PostgreSQL Database Setup for Patent Analytics Platform
-- Run this script as postgres user: sudo -u postgres psql < setup_postgres.sql

-- Drop existing connections if any
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'patent_analytics_db' AND pid <> pg_backend_pid();

-- Create database user
DROP USER IF EXISTS patent_user;
CREATE USER patent_user WITH PASSWORD 'patent_secure_pass_2024';

-- Create database
DROP DATABASE IF EXISTS patent_analytics_db;
CREATE DATABASE patent_analytics_db 
    WITH OWNER = patent_user 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8' 
    TEMPLATE = template0;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE patent_analytics_db TO patent_user;

-- Connect to the database
\c patent_analytics_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO patent_user;
GRANT CREATE ON SCHEMA public TO patent_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For better indexing

-- Display confirmation
\echo 'Database setup complete!'
\echo 'Database: patent_analytics_db'
\echo 'User: patent_user'
\echo 'Password: patent_secure_pass_2024'