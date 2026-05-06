# Pardploy 🦁

[**Español**](#español) | [**English**](#english)

---

## Español

### **¿Qué es Pardploy?**
Pardploy es un gestor de despliegue de alto rendimiento diseñado como una alternativa ligera y ultrarrápida a herramientas como Coolify o Dockploy. Aprovechando la potencia de **Rust** en el backend y la agilidad de **Bun** en el frontend, Pardploy ofrece una experiencia "zero-bloat" para gestionar contenedores Docker.

### **Stack Tecnológico**
*   **Backend:** Rust + Axum (El "Pardo Engine").
*   **Frontend:** React + Vite + Bun (Dashboard reactivo).
*   **Infraestructura:** Docker (Comunicación nativa vía Socket).
*   **Estilos:** Tailwind CSS + Shadcn UI.

### **Inicio Rápido**
1.  Clona el repositorio: `git clone https://github.com/felipedev13092005/pardploy.git`
2.  Levanta el entorno de desarrollo:
    ```bash
    docker compose up -d
    ```
3.  Entra al contenedor para ejecutar los servicios:
    ```bash
    docker exec -it pardploy_dev bash
    # En terminal 1: cd backend && cargo run
    # En terminal 2: cd frontend && bun dev --host
    ```

### **Licencia**
Este proyecto está bajo la Licencia **MIT**. Eres libre de usarlo, modificarlo y distribuirlo siempre que se mantenga la atribución original al proyecto Pardploy.

---

## English

### **What is Pardploy?**
Pardploy is a high-performance deployment manager designed as a lightweight, ultra-fast alternative to tools like Coolify or Dockploy. By leveraging the power of **Rust** on the backend and the agility of **Bun** on the frontend, Pardploy provides a "zero-bloat" experience for managing Docker containers.

### **Tech Stack**
*   **Backend:** Rust + Axum (The "Pardo Engine").
*   **Frontend:** React + Vite + Bun (Reactive Dashboard).
*   **Infrastructure:** Docker (Native Socket communication).
*   **Styling:** Tailwind CSS + Shadcn UI.

### **Quick Start**
1.  Clone the repository: `git clone https://github.com/felipedev13092005/pardploy.git`
2.  Spin up the development environment:
    ```bash
    docker compose up -d
    ```
3.  Enter the container to run the services:
    ```bash
    docker exec -it pardploy_dev bash
    # In terminal 1: cd backend && cargo run
    # In terminal 2: cd frontend && bun dev --host
    ```

### **License**
This project is licensed under the **MIT** License. You are free to use, modify, and distribute it as long as the original attribution to the Pardploy project is maintained.

---

**Developed with ❤️ by [felipedev13092005](https://github.com/felipedev13092005)**
