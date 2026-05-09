use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use axum_extra::extract::cookie::{Cookie, SameSite, CookieJar};
use sqlx::SqlitePool;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use serde::{Serialize, Deserialize};
use validator::Validate;
use crate::models::UserModel::User;
use std::time::{SystemTime, UNIX_EPOCH};
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i32,
    pub name: String,
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
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
    payload.validate().map_err(|e| (StatusCode::BAD_REQUEST, format!("Validación: {}", e)))?;

    let hashed = hash(&payload.password, DEFAULT_COST)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al procesar contraseña".into()))?;

    let new_user = User {
        id: None,
        username: payload.username.clone(),
        password_hash: hashed,
        is_admin: false,
    };

    User::create(&pool, new_user).await
        .map_err(|_| (StatusCode::CONFLICT, "El nombre de usuario ya está en uso".into()))?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "message": "Usuario registrado exitosamente", "username": payload.username }))
    ))
}

pub async fn login(
    State(pool): State<SqlitePool>,
    jar: CookieJar,
    Json(payload): Json<AuthPayload>,
) -> Result<(CookieJar, Json<serde_json::Value>), (StatusCode, String)> {
    let user = User::find_by_username(&pool, &payload.username).await
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Usuario o contraseña incorrectos".into()))?;

    if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
        return Err((StatusCode::UNAUTHORIZED, "Usuario o contraseña incorrectos".into()));
    }

    let user_id = user.id.unwrap_or(0);

    let access_token = create_token(user_id, &user.username, &get_jwt_secret(), 900);
    let refresh_token = create_token(user_id, &user.username, &get_refresh_secret(), 604800);

    let access_cookie = Cookie::build(("access_token", access_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    let new_jar = jar.add(access_cookie).add(refresh_cookie);

    Ok((
        new_jar,
        Json(serde_json::json!({
            "message": "Login exitoso",
            "user": {
                "id": user_id,
                "username": user.username
            }
        }))
    ))
}

pub async fn me(
    axum::Extension(claims): axum::Extension<Claims>,
) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "id": claims.sub,
        "username": claims.name,
        "status": "authenticated"
    }))
}

pub async fn logout(jar: CookieJar) -> (CookieJar, (StatusCode, Json<serde_json::Value>)) {
    let access = Cookie::build(("access_token", "")).path("/").build();
    let refresh = Cookie::build(("refresh_token", "")).path("/").build();
    let new_jar = jar.remove(access).remove(refresh);
    (new_jar, (StatusCode::OK, Json(serde_json::json!({ "message": "Sesión cerrada exitosamente" }))))
}

pub async fn refresh(jar: CookieJar) -> Result<(CookieJar, (StatusCode, Json<serde_json::Value>)), (StatusCode, Json<serde_json::Value>)> {
    let err = |msg: &str| (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": msg })));

    let refresh_token = jar
        .get("refresh_token")
        .map(|c| c.value().to_string())
        .ok_or_else(|| err("No hay refresh token"))?;

    let token_data = decode::<Claims>(
        &refresh_token,
        &DecodingKey::from_secret(&get_refresh_secret()),
        &Validation::default(),
    )
    .map_err(|_| err("Refresh token inválido o expirado"))?;

    let claims = token_data.claims;

    let new_access_token = create_token(claims.sub, &claims.name, &get_jwt_secret(), 900);

    let access_cookie = Cookie::build(("access_token", new_access_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    Ok((
        jar.add(access_cookie),
        (StatusCode::OK, Json(serde_json::json!({ "message": "Token renovado exitosamente" })))
    ))
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
