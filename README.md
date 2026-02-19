# MCP SonarQube

MCP server para consultar SonarQube desde Claude Code.

## Tools

| Tool | Descripcion |
|------|-------------|
| `sonar_issues` | Busca issues (bugs, vulnerabilities, code smells) |
| `sonar_metrics` | Metricas de un componente (coverage, bugs, etc.) |
| `sonar_quality_gate` | Estado del quality gate de un proyecto |

## Instalacion

### 1. Clonar y compilar

```bash
git clone https://github.com/landscapedotcl/mcp-sonar.git
cd mcp-sonar
npm install
npm run build
```

### 2. Configurar en Claude Code

Agregar a `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "sonar-mcp": {
      "command": "node",
      "args": ["/ruta/absoluta/a/mcp-sonar/dist/index.js"],
      "cwd": "/ruta/absoluta/a/mcp-sonar",
      "env": {
        "SONAR_URL": "https://tu-instancia-sonarqube.com",
        "SONAR_TOKEN": "tu_token_aqui"
      }
    }
  }
}
```

### 3. Reiniciar Claude Code

Reinicia Claude Code para que cargue el MCP server.

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

El token se genera en SonarQube > My Account > Security > Generate Tokens.
