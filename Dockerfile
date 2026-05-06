FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Añadimos tmux a la lista de apps
RUN apt-get update && apt-get install -y \
    curl build-essential pkg-config libssl-dev git docker.io unzip procps tmux \
    && rm -rf /var/lib/apt/lists/*

# Instalar Rust y Bun (igual que antes)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Nuevo script de inicio con TMUX
RUN echo '#!/bin/bash\n\
# Creamos una sesión de tmux llamada "dev" y lanzamos el backend\n\
tmux new-session -d -s dev -n services "cd /app/backend && cargo run"\n\
# Dividimos la ventana y lanzamos el frontend\n\
tmux split-window -h -t dev:services "cd /app/frontend && bun dev --host 0.0.0.0"\n\
# Mantenemos el proceso de tmux vivo para que el contenedor no se apague\n\
tmux attach-session -t dev' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
