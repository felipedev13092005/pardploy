#!/bin/bash

# Matar sesiones previas de tmux por si acaso el contenedor se reinició
tmux kill-session -t dev 2>/dev/null

# Crear la sesión 'dev' en modo background (-d) con el nombre 'backend'
# Lanzamos cargo run y usamos 'tail -f /dev/null' al final por si el proceso muere,
# para que el panel de tmux no se cierre y puedas ver el error.
tmux new-session -d -s dev -n 'services'
tmux send-keys -t dev:services "cd /app/backend && cargo run; bash" C-m

# Dividir la ventana horizontalmente para el frontend
tmux split-window -h -t dev:services
tmux send-keys -t dev:services "cd /app/frontend && bun dev --host 0.0.0.0; bash" C-m

# Seleccionar el primer panel y entrar a la sesión
tmux select-pane -t 0
tmux attach-session -t dev
