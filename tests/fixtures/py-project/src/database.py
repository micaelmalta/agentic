"""Database access layer — intentionally has SQL injection vulnerability."""


def get_user(connection, user_id):
    """Fetch a user by ID. VULNERABLE: SQL injection via string formatting."""
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor = connection.cursor()
    cursor.execute(query)
    return cursor.fetchone()


def search_users(connection, name):
    """Search users by name. VULNERABLE: SQL injection via f-string."""
    query = f"SELECT * FROM users WHERE name LIKE '%{name}%'"
    cursor = connection.cursor()
    cursor.execute(query)
    return cursor.fetchall()
