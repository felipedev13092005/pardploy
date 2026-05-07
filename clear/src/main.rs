#![allow(non_snake_case)]

use axum::Router;
use std::env;

// Declaración de módulos
pub mod db; 
pub mod models { pub mod UserModel; }
pub mod handlers { pub mod AuthHandlers; }
pub mod routes { pub mod AuthRoutes; }

#[tokio::main]
async fn main() {
    // 1. Cargar variables de entorno desde .env
    dotenvy::dotenv().ok(); 

    // --- BLOQUE DE DEBUG PARA ENVS ---
    println!("--- Verificando Variables de Entorno ---");
    let envs = ["SERVER_PORT", "DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"];
    for e in envs {
        match env::var(e) {
            Ok(val) => {
                // Si es un secret, ocultamos el resto por seguridad
                if e.contains("SECRET") {
                    println!("✅ {}: {}***", e, &val[..2]); 
                } else {
                    println!("✅ {}: {}", e, val);
                }
            },
            Err(_) => println!("❌ {}: NO ENCONTRADA", e),
        }
    }
    println!("---------------------------------------");
    // ---------------------------------

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
