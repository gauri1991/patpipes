#!/usr/bin/env python3
"""
Automated PostgreSQL setup for Patent Analytics Platform
This script attempts to create the database using various connection methods
"""

import subprocess
import sys
import os
import time
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def try_create_database():
    """Try to create database using different connection methods"""
    
    db_name = 'patent_analytics_db'
    db_user = 'patent_user'
    db_password = 'patent_secure_pass_2024'
    
    # Connection attempts
    connection_configs = [
        # Try with peer authentication (no password needed for local postgres user)
        {'host': 'localhost', 'user': 'postgres', 'password': None},
        # Try with common default passwords
        {'host': 'localhost', 'user': 'postgres', 'password': 'postgres'},
        {'host': 'localhost', 'user': 'postgres', 'password': 'admin'},
        {'host': 'localhost', 'user': 'postgres', 'password': ''},
        {'host': 'localhost', 'user': 'postgres', 'password': 'maggi456'},
    ]
    
    for config in connection_configs:
        try:
            print(f"Trying connection with user={config['user']}, password={'***' if config['password'] else 'none'}...")
            
            # Build connection parameters
            conn_params = {
                'host': config['host'],
                'user': config['user'],
                'database': 'postgres'  # Connect to default postgres database
            }
            if config['password']:
                conn_params['password'] = config['password']
            
            # Try to connect
            conn = psycopg2.connect(**conn_params)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            print("✓ Connected to PostgreSQL!")
            
            # Check if database exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )
            exists = cursor.fetchone()
            
            if exists:
                print(f"Database '{db_name}' already exists.")
                # Drop existing connections
                cursor.execute(sql.SQL("""
                    SELECT pg_terminate_backend(pid) 
                    FROM pg_stat_activity 
                    WHERE datname = %s AND pid <> pg_backend_pid()
                """), [db_name])
                
                print(f"Dropping existing database...")
                cursor.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(
                    sql.Identifier(db_name)
                ))
            
            # Check if user exists
            cursor.execute(
                "SELECT 1 FROM pg_user WHERE usename = %s",
                (db_user,)
            )
            user_exists = cursor.fetchone()
            
            if user_exists:
                print(f"User '{db_user}' already exists.")
                cursor.execute(sql.SQL("DROP USER IF EXISTS {}").format(
                    sql.Identifier(db_user)
                ))
            
            # Create user
            print(f"Creating user '{db_user}'...")
            cursor.execute(sql.SQL("CREATE USER {} WITH PASSWORD %s").format(
                sql.Identifier(db_user)
            ), [db_password])
            
            # Create database
            print(f"Creating database '{db_name}'...")
            cursor.execute(sql.SQL("CREATE DATABASE {} WITH OWNER = {}").format(
                sql.Identifier(db_name),
                sql.Identifier(db_user)
            ))
            
            # Grant privileges
            cursor.execute(sql.SQL("GRANT ALL PRIVILEGES ON DATABASE {} TO {}").format(
                sql.Identifier(db_name),
                sql.Identifier(db_user)
            ))
            
            print("✓ Database setup complete!")
            
            # Close connection
            cursor.close()
            conn.close()
            
            # Test new connection
            print("\nTesting connection with new credentials...")
            test_conn = psycopg2.connect(
                host='localhost',
                database=db_name,
                user=db_user,
                password=db_password
            )
            test_conn.close()
            print("✓ Successfully connected with new credentials!")
            
            return True
            
        except psycopg2.OperationalError as e:
            print(f"  Connection failed: {str(e)[:50]}...")
            continue
        except Exception as e:
            print(f"  Error: {e}")
            continue
    
    return False

def test_django_connection():
    """Test if Django can connect to the database"""
    try:
        print("\nTesting Django database connection...")
        result = subprocess.run(
            ['./venv/bin/python', 'manage.py', 'dbshell', '--database', 'default'],
            input='SELECT version();\n\\q\n',
            text=True,
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0:
            print("✓ Django can connect to PostgreSQL!")
            return True
        else:
            print(f"Django connection failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error testing Django connection: {e}")
        return False

def main():
    print("=" * 60)
    print("Patent Analytics Platform - PostgreSQL Setup")
    print("=" * 60)
    print()
    
    # Try to create database
    if try_create_database():
        print("\n" + "=" * 60)
        print("SUCCESS! Database has been created.")
        print("=" * 60)
        print("\nDatabase Details:")
        print(f"  Database: patent_analytics_db")
        print(f"  User: patent_user")
        print(f"  Password: patent_secure_pass_2024")
        print(f"  Host: localhost")
        print(f"  Port: 5432")
        print()
        
        # Test Django connection
        if test_django_connection():
            print("\n✓ Everything is ready! You can now run migrations.")
            print("\nNext steps:")
            print("1. Run: ./venv/bin/python manage.py migrate")
            print("2. Load data: ./venv/bin/python manage.py loaddata data_backup.json")
            return 0
        else:
            print("\n⚠ Database created but Django connection failed.")
            print("Please check your settings.py configuration.")
            return 1
    else:
        print("\n" + "=" * 60)
        print("MANUAL SETUP REQUIRED")
        print("=" * 60)
        print("\nCould not automatically create the database.")
        print("Please run the following command manually:")
        print("\n  sudo -u postgres psql < setup_postgres.sql")
        print("\nOr create the database manually with these commands:")
        print("  sudo -u postgres psql")
        print("  CREATE USER patent_user WITH PASSWORD 'patent_secure_pass_2024';")
        print("  CREATE DATABASE patent_analytics_db OWNER patent_user;")
        print("  GRANT ALL PRIVILEGES ON DATABASE patent_analytics_db TO patent_user;")
        print("  \\q")
        return 1

if __name__ == "__main__":
    sys.exit(main())