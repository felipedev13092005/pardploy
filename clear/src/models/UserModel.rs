use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqliteQueryResult, FromRow, SqlitePool};

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: Option<i32>, // Option para que el ID sea autoincremental al crear
    pub username: String,
    pub password_hash: String,
    pub is_admin: bool,
}

impl User {
    pub async fn find_all(pool: &SqlitePool) -> Result<Vec<User>, sqlx::Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users")
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: i32) -> Result<User, sqlx::Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn find_by_username(pool: &SqlitePool, username: &str) -> Result<User, sqlx::Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ?")
            .bind(username)
            .fetch_one(pool)
            .await
    }

    pub async fn create(pool: &SqlitePool, user: User) -> Result<SqliteQueryResult, sqlx::Error> {
        sqlx::query("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)")
            .bind(user.username)
            .bind(user.password_hash)
            .bind(user.is_admin)
            .execute(pool)
            .await
    }

    pub async fn update(pool: &SqlitePool, id: i32, user: User) -> Result<SqliteQueryResult, sqlx::Error> {
        sqlx::query("UPDATE users SET username = ?, password_hash = ?, is_admin = ? WHERE id = ?")
            .bind(user.username)
            .bind(user.password_hash)
            .bind(user.is_admin)
            .bind(id)
            .execute(pool)
            .await
    }

    pub async fn delete(pool: &SqlitePool, id: i32) -> Result<SqliteQueryResult, sqlx::Error> {
        sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
    }
}
