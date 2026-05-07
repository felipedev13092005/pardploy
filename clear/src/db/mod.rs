use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::env;

pub async fn connect() -> SqlitePool {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:/app/data/pardploy.db?mode=rwc".to_string());
    
    println!("Conectando a: {}", database_url);

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("No se pudo conectar a SQLite")
}

pub async fn migrate(pool: &SqlitePool) {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE
        )"
    )
    .execute(pool)
    .await
    .expect("Error al ejecutar las migraciones");
    
    println!("✅ Migraciones completadas");
}
