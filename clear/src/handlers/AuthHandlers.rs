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

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: i32,
    exp: usize,
    iat: usize,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AuthPayload {
    #[validate(length(min = 3, message = "El usuario debe tener al menos 3 caracteres"))]
    pub username: String,
    #[validate(length(min = 6, message = "La contraseña debe tener al menos 6 caracteres"))]
    pub password: String,
}

// Helpers para obtener secrets de variables de entorno
fn get_jwt_secret() -> Vec<u8> {
    env::var("JWT_SECRET").expect("JWT_SECRET no definido").into_bytes()
}

fn get_refresh_secret() -> Vec<u8> {
    env::var("REFRESH_SECRET").expect("REFRESH_SECRET no definido").into_bytes()
}

fn create_token(user_id: i32, secret: &[u8], seconds_to_exp: u64) -> String {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let claims = Claims {
        sub: user_id,
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
    
    // Uso de variables de entorno
    let access_token = create_token(user_id, &get_jwt_secret(), 900);
    let refresh_token = create_token(user_id, &get_refresh_secret(), 604800);

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

pub async fn refresh(jar: CookieJar) -> Result<(CookieJar, StatusCode), (StatusCode, String)> {
    let _refresh_token = jar.get("refresh_token")
        .map(|c| c.value().to_string())
        .ok_or((StatusCode::UNAUTHORIZED, "No hay refresh token".into()))?;

    // Aquí podrías validar el token antes de generar uno nuevo
    let user_id = 0; // Debería extraerse del token validado
    let new_access_token = create_token(user_id, &get_jwt_secret(), 900);

    let access_cookie = Cookie::build(("access_token", new_access_token))
        .path("/")
        .http_only(true)
        .build();

    Ok((jar.add(access_cookie), StatusCode::OK))
}

pub async fn logout(jar: CookieJar) -> (CookieJar, StatusCode) {
    let new_jar = jar
        .remove(Cookie::from("access_token"))
        .remove(Cookie::from("refresh_token"));
    
    (new_jar, StatusCode::OK)
}

pub async fn me(State(pool): State<SqlitePool>) -> Json<Vec<User>> {
    let users = User::find_all(&pool).await.unwrap_or_default();
    Json(users)
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
