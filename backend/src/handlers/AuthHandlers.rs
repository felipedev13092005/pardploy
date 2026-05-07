use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use axum_extra::extract::cookie::{Cookie, SameSite, CookieJar};
use sqlx::SqlitePool;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Serialize, Deserialize};
use validator::Validate;
use crate::models::UserModel::User;
use std::time::{SystemTime, UNIX_EPOCH};
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i32,      // User ID
    pub name: String,   // Username
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AuthPayload {
    #[validate(length(min = 3, message = "El usuario debe tener al menos 3 caracteres"))]
    pub username: String,
    #[validate(length(min = 6, message = "La contraseña debe tener al menos 6 caracteres"))]
    pub password: String,
}

fn get_jwt_secret() -> Vec<u8> {
    env::var("JWT_SECRET").expect("JWT_SECRET no definido").into_bytes()
}

fn get_refresh_secret() -> Vec<u8> {
    env::var("REFRESH_SECRET").expect("REFRESH_SECRET no definido").into_bytes()
}

// Función actualizada para aceptar name
fn create_token(user_id: i32, username: &str, secret: &[u8], seconds_to_exp: u64) -> String {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let claims = Claims {
        sub: user_id,
        name: username.to_string(),
        iat: now as usize,
        exp: (now + seconds_to_exp) as usize,
    };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret)).unwrap_or_default()
}

pub async fn register(
    State(pool): State<SqlitePool>,
    Json(payload): Json<AuthPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    payload.validate().map_err(|e| (StatusCode::BAD_REQUEST, format!("Validación: {}", e)))?;

    let hashed = hash(&payload.password, DEFAULT_COST)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al procesar contraseña".into()))?;

    let new_user = User {
        id: None,
        username: payload.username,
        password_hash: hashed,
        is_admin: false,
    };

    User::create(&pool, new_user).await
        .map_err(|_| (StatusCode::CONFLICT, "El nombre de usuario ya está en uso".into()))?;

    Ok(StatusCode::CREATED)
}

pub async fn login(
    State(pool): State<SqlitePool>,
    jar: CookieJar,
    Json(payload): Json<AuthPayload>,
) -> Result<(CookieJar, StatusCode), (StatusCode, String)> {
    let user = User::find_by_username(&pool, &payload.username).await
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Usuario o contraseña incorrectos".into()))?;

    if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
        return Err((StatusCode::UNAUTHORIZED, "Usuario o contraseña incorrectos".into()));
    }

    let user_id = user.id.unwrap_or(0);
    
    // Pasamos el username al token
    let access_token = create_token(user_id, &user.username, &get_jwt_secret(), 900);
    let refresh_token = create_token(user_id, &user.username, &get_refresh_secret(), 604800);

    let access_cookie = Cookie::build(("access_token", access_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .path("/api/auth/refresh")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    Ok((jar.add(access_cookie).add(refresh_cookie), StatusCode::OK))
}

// Ejemplo de cómo usar los datos en el endpoint 'me'
pub async fn me(
    axum::Extension(claims): axum::Extension<Claims>,
) -> Json<serde_json::Value> {
    // Ahora 'me' recibe los datos directamente del token sin consultar la DB
    Json(serde_json::Value::from(serde_json::json!({
        "id": claims.sub,
        "username": claims.name,
        "status": "authenticated"
    })))
}

pub async fn logout(jar: CookieJar) -> (CookieJar, StatusCode) {
    let new_jar = jar
        .remove(Cookie::from("access_token"))
        .remove(Cookie::from("refresh_token"));
    (new_jar, StatusCode::OK)
}

pub async fn refresh(jar: CookieJar) -> Result<(CookieJar, StatusCode), (StatusCode, String)> {
    let _refresh_token = jar.get("refresh_token")
        .map(|c| c.value().to_string())
        .ok_or((StatusCode::UNAUTHORIZED, "No hay refresh token".into()))?;

    // Nota: En una app real, aquí validarías el refresh_token y obtendrías el user_id/name
    let new_access_token = create_token(0, "user_refreshed", &get_jwt_secret(), 900);

    let access_cookie = Cookie::build(("access_token", new_access_token))
        .path("/")
        .http_only(true)
        .build();

    Ok((jar.add(access_cookie), StatusCode::OK))
}

pub async fn get_user_by_id(
    State(pool): State<SqlitePool>, 
    Path(id): Path<i32>
) -> Result<Json<User>, StatusCode> {
    match User::find_by_id(&pool, id).await {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}
