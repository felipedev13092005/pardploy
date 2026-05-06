use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    // Definimos las rutas
    let app = Router::new()
        .route("/", get(|| async { "🦁 Pardploy Engine rugiendo!" }))
        .route("/health", get(|| async { "OK" }));

    // Dirección donde escuchará el servidor (0.0.0.0 para Docker)
    let addr = "0.0.0.0:8080";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    
    println!("🚀 Backend iniciado en http://{}", addr);

    // Arrancamos el servidor
    axum::serve(listener, app).await.unwrap();
}
