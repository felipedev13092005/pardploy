use axum::{routing::get, Router};
use sqlx::sqlite::SqlitePoolOptions;
use std::env;

#[tokio::main]
async fn main() {
    // 1. Conexión a la base de datos
    // Priorizamos la variable de entorno, pero con un fallback corregido
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:/app/data/pardploy.db?mode=rwc".to_string());
    
    println!("Conectando a: {}", database_url);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("No se pudo conectar a SQLite");

    // 2. Crear tabla de usuarios
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE
        )"
    )
    .execute(&pool)
    .await
    .expect("Error al crear la tabla de usuarios");

    // 3. Rutas
    let app = Router::new()
        .route("/", get(|| async { "🦁 Pardploy Engine con DB activa!" }))
        .route("/health", get(|| async { "OK" }))
        .with_state(pool);

    let addr = "0.0.0.0:8080";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("🚀 Backend con SQLite iniciado en http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
