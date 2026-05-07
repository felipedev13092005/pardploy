use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;

// Importamos la struct Claims del handler para mantener consistencia
use crate::handlers::AuthHandlers::Claims;

pub async fn mw_require_auth(
    jar: CookieJar,
    mut req: Request, // Añadimos mut para poder insertar extensiones
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. Obtener el token de la cookie
    let token = jar
        .get("access_token")
        .map(|c| c.value().to_string())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // 2. Obtener el secret
    let secret = env::var("JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 3. Validar y decodificar el token
    let token_data = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // 4. INSERTAR LOS DATOS EN LA PETICIÓN
    // Esto permite que cualquier handler posterior use Extension<Claims>
    req.extensions_mut().insert(token_data.claims);

    // 5. Continuar con la ejecución
    Ok(next.run(req).await)
}
