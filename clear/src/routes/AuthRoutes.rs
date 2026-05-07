use axum::{routing::{get, post}, Router};
use sqlx::SqlitePool;
use crate::handlers::AuthHandlers::{register, login, me, refresh, logout, get_user_by_id};

pub fn auth_routes() -> Router<SqlitePool> {
    Router::new()
        // Auth core
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
        .route("/logout", post(logout))
        
        // Perfil y Gestión
        .route("/me", get(me))
        // IMPORTANTE: En Axum 0.7 se usan llaves {} para capturas, no dos puntos :
        .route("/user/{id}", get(get_user_by_id))
}
