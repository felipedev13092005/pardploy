use axum::{
    routing::get,
    Router,
};
use sqlx::SqlitePool;
use crate::handlers::SystemHandlers::get_requirements;

pub fn system_routes() -> Router<SqlitePool> {
    Router::new()
        .route("/system/requirements", get(get_requirements))
}