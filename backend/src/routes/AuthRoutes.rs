use axum::{
    middleware,
    routing::{get, post}, 
    Router
};
use sqlx::SqlitePool;
use crate::handlers::AuthHandlers::{register, login, me, refresh, logout, get_user_by_id, get_auth_status};
use crate::middlewares::auth_middleware::mw_require_auth;

pub fn auth_routes() -> Router<SqlitePool> {
    // 1. Rutas Públicas (No requieren Token)
    let public_routes = Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
        .route("/status", get(get_auth_status));

    // 2. Rutas Protegidas (Requieren Token válido)
    let protected_routes = Router::new()
        .route("/me", get(me))
        .route("/logout", post(logout))
        .route("/user/{id}", get(get_user_by_id))
        // Aplicamos el middleware solo a este sub-router
        .route_layer(middleware::from_fn(mw_require_auth));

    // Unimos ambos routers
    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
}
