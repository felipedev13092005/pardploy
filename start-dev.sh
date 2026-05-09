#!/bin/bash
# Matar sesiones previas de tmux
tmux kill-session -t dev 2>/dev/null

# Crear sesión y lanzar Backend (Rust) con hot reload
tmux new-session -d -s dev -n 'services'
tmux send-keys -t dev:services "cd /app/backend && cargo watch -q -x run; bash" C-m

# Dividir y lanzar Frontend (React en ui/web)
tmux split-window -h -t dev:services
tmux send-keys -t dev:services "cd /app/ui/web && bun dev --host 0.0.0.0; bash" C-m

# Seleccionar panel izquierdo y conectar
tmux select-pane -t 0
tmux attach-session -t dev
