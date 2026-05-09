use axum::{
    routing::{get, post},
    Router,
};
use sqlx::SqlitePool;
use crate::handlers::SystemHandlers::{get_requirements, install_docker};

pub fn system_routes() -> Router<SqlitePool> {
    Router::new()
        .route("/system/requirements", get(get_requirements))
        .route("/system/install", post(install_docker))
}