#![allow(non_snake_case)]

use axum::Router;
use std::env;

// Declaración de módulos
pub mod db; 
pub mod models { pub mod UserModel; }
pub mod handlers { pub mod AuthHandlers; }
pub mod routes { pub mod AuthRoutes; }
pub mod middlewares { pub mod auth_middleware; }

#[tokio::main]
async fn main() {
    // 1. Cargar variables de entorno desde .env
    dotenvy::dotenv().ok(); 
    // 2. Inicializar DB usando el módulo db
    let pool = db::connect().await;
    db::migrate(&pool).await;

    // 3. Configurar rutas y estado global
    let app = Router::new()
        .nest("/api/auth", routes::AuthRoutes::auth_routes())
        .fallback(|| async { "🦁 Pardploy Engine: Ruta no encontrada" })
        .with_state(pool);

    // 4. Leer puerto desde env o usar 8080 por defecto
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("🚀 Backend modular iniciado en http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
