#!/usr/bin/env bash
# Create three users (alumno1, alumno2, invitado) with the same password,
# record metadata and write evidence_practica11_linux.json
# Usage: sudo ./create_practica11_linux.sh "P@ssw0rd123"

set -euo pipefail
PASSWORD="$1"
OUTFILE="evidence_practica11_linux.json"

users=(
  "alumno1:Alumno Uno"
  "alumno2:Alumno Dos"
  "invitado:Invitado"
)

results=()

for u in "${users[@]}"; do
  username="${u%%:*}"
  fullname="${u##*:}"
  if ! id -u "$username" >/dev/null 2>&1; then
    sudo useradd -m -c "$fullname" "$username"
    echo "$username:$PASSWORD" | sudo chpasswd
  fi
  home="/home/$username"
  creation="$(sudo stat -c '%w' "$home" 2>/dev/null || sudo stat -c '%y' "$home")"
  lastlogin="$(lastlog -u $username | awk 'NR==2 {print $4" "$5" "$6" "$7}')"
  groups="$(id -nG $username)"
  pwdchange=false

  results+=$(cat <<JSON
  {
    "usuario": "$username",
    "nombre_completo": "$fullname",
    "habilitado": true,
    "fecha_creacion": "$creation",
    "ultimo_inicio": "$lastlogin",
    "grupos": "$groups",
    "requiere_cambio_contrasena": $pwdchange
  }
JSON
)
done

echo "{\"generated_at\": \"$(date -u +"%Y-%m-%d %H:%M:%SZ")\", \"evidence\": [$(IFS=,; echo "${results[*]}")] }" > $OUTFILE

echo "Evidence written to $OUTFILE"
echo "To disable a user: sudo usermod -L alumno2" 
echo "To enable a user: sudo usermod -U alumno2" 
