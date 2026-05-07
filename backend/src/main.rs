#![allow(non_snake_case)]

use axum::{Router, http::{header, Method, HeaderValue}};
use std::env;
use tower_http::cors::CorsLayer;

pub mod db; 
pub mod models { pub mod UserModel; }
pub mod handlers { pub mod AuthHandlers; }
pub mod routes { pub mod AuthRoutes; }
pub mod middlewares { pub mod auth_middleware; }

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok(); 
    let pool = db::connect().await;
    db::migrate(&pool).await;

    // --- CONFIGURACIÓN DE CORS DESDE ENV ---
    let frontend_url = env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "http://localhost:5173".to_string());

    let cors = CorsLayer::new()
        // Convertimos el String del env a un HeaderValue válido
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_methods([
            Method::GET, 
            Method::POST, 
            Method::PUT, 
            Method::DELETE, 
            Method::OPTIONS // Esencial para "preflight requests" en navegadores
        ])
        .allow_headers([
            header::CONTENT_TYPE, 
            header::AUTHORIZATION,
            header::ACCEPT,
        ])
        .allow_credentials(true); // Necesario para enviar/recibir Cookies

    // --- APP ---
    let app = Router::new()
        .nest("/api/auth", routes::AuthRoutes::auth_routes())
        .fallback(|| async { "🦁 Pardploy Engine: Ruta no encontrada" })
        .layer(cors) // IMPORTANTE: El layer de CORS debe ir después de las rutas
        .with_state(pool);

    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("🚀 Backend modular iniciado en http://{}", addr);
    println!("🌐 CORS permitido para: {}", frontend_url);

    axum::serve(listener, app).await.unwrap();
}
