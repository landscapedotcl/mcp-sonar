# MCP SonarQube

MCP server para consultar SonarQube desde Claude Code.

## Tools

| Tool | Descripcion |
|------|-------------|
| `sonar_issues` | Busca issues (bugs, vulnerabilities, code smells) |
| `sonar_metrics` | Metricas de un componente (coverage, bugs, etc.) |
| `sonar_quality_gate` | Estado del quality gate de un proyecto |

## Configuracion

El server lee **solo variables de entorno**:

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `SONAR_URL` | Si | URL de SonarQube, sin `/` final (ej. `https://sonarqube.landscape.cl`) |
| `SONAR_TOKEN` | Si | Token de usuario (SonarQube > My Account > Security > Generate Tokens) |

> **Importante:** no pasar `--SONAR_URL=...` ni `--SONAR_TOKEN=...` en `args`. El server no lee argumentos: todas las tools fallan con `Invalid URL`. Van siempre en `env`.

Elegir **una** de estas opciones. No combinarlas: cada una registra las mismas tools y quedan duplicadas.

### Opcion A — Claude Code CLI (personal)

```bash
claude mcp add sonar --scope user \
  -e SONAR_URL=https://sonarqube.landscape.cl \
  -e SONAR_TOKEN=<tu_token> \
  -- npx -y github:landscapedotcl/mcp-sonar
```

- `--scope user`: disponible en todos tus proyectos. `--scope local`: solo en el proyecto actual.
- Queda guardado en `~/.claude.json` **en texto plano**. No compartir ese archivo.
- Las tools se llaman `mcp__sonar__sonar_issues`, etc.

### Opcion B — `.mcp.json` del proyecto (equipo)

En la raiz del proyecto, versionado, **sin el token**:

```json
{
  "mcpServers": {
    "sonar": {
      "command": "npx",
      "args": ["-y", "github:landscapedotcl/mcp-sonar"],
      "env": {
        "SONAR_URL": "https://sonarqube.landscape.cl",
        "SONAR_TOKEN": "${SONAR_TOKEN}"
      }
    }
  }
}
```

Cada persona exporta `SONAR_TOKEN` en su shell (por ejemplo en `~/.zshrc`) antes de abrir Claude Code. Claude Code pide aprobar los servers de `.mcp.json` la primera vez.

### Opcion C — Dentro de un plugin de Claude Code (recomendada para equipos)

El token se declara como opcion `sensitive` del plugin y queda en el llavero del sistema (macOS Keychain), no en archivos. En la entrada del plugin en `marketplace.json` (o en su `plugin.json`):

```json
"userConfig": {
  "sonar_url":   { "type": "string", "title": "SonarQube URL", "description": "URL de SonarQube", "default": "https://sonarqube.landscape.cl" },
  "sonar_token": { "type": "string", "title": "SonarQube token", "description": "Token de usuario", "sensitive": true }
},
"mcpServers": {
  "sonar": {
    "command": "npx",
    "args": ["-y", "github:landscapedotcl/mcp-sonar"],
    "env": {
      "SONAR_URL": "${user_config.sonar_url}",
      "SONAR_TOKEN": "${user_config.sonar_token}"
    }
  }
}
```

Cada persona configura su token una vez:

```bash
/plugin configure <plugin>@<marketplace>        # dentro de Claude Code
# o desde la terminal:
echo '{"sonar_token":"<tu_token>"}' | claude plugin configure <plugin>@<marketplace> --values-stdin
```

Las tools se llaman `mcp__plugin_<plugin>_sonar__sonar_issues`, etc.

### Verificar

Reiniciar Claude Code y ejecutar `/mcp`: el server `sonar` debe aparecer conectado. Luego pedir, por ejemplo, el quality gate de un proyecto. Si responde `Invalid URL`, revisar que `SONAR_URL` este en `env` y no en `args`. Si responde 401, el token es invalido o vencio.

### Fallback sin MCP

```bash
curl -s -u "$SONAR_TOKEN:" "$SONAR_URL/api/qualitygates/project_status?projectKey=<key>"
curl -s -u "$SONAR_TOKEN:" "$SONAR_URL/api/issues/search?componentKeys=<key>&resolved=false"
```

## Uso

Una vez configurado, los tools estan disponibles automaticamente en Claude Code:

```
# Buscar issues de un proyecto
sonar_issues({ projectKey: "mi-proyecto" })

# Obtener metricas
sonar_metrics({ projectKey: "mi-proyecto" })

# Estado del quality gate
sonar_quality_gate({ projectKey: "mi-proyecto" })
```

## Autenticacion

Usa Basic Auth con el token como username y password vacio, igual que el CLI de SonarQube:

```
Authorization: Basic base64(token:)
```
