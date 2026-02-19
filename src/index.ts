import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SONAR_URL = process.env.SONAR_URL!;
const SONAR_TOKEN = process.env.SONAR_TOKEN!;

const AUTH_HEADER =
  "Basic " + Buffer.from(`${SONAR_TOKEN}:`).toString("base64");

async function sonarFetch(path: string, params: Record<string, string>) {
  const url = new URL(path, SONAR_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: AUTH_HEADER },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SonarQube ${res.status}: ${body}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "sonar-mcp",
  version: "1.0.0",
});

// Tool 1: sonar_issues
server.tool(
  "sonar_issues",
  "Search SonarQube issues (bugs, vulnerabilities, code smells)",
  {
    projectKey: z.string().describe("SonarQube project key"),
    componentKeys: z
      .string()
      .optional()
      .describe("Comma-separated component keys to filter"),
    severities: z
      .string()
      .optional()
      .describe(
        "Comma-separated severities: INFO, MINOR, MAJOR, CRITICAL, BLOCKER"
      ),
    types: z
      .string()
      .optional()
      .describe("Comma-separated types: BUG, VULNERABILITY, CODE_SMELL"),
    resolved: z
      .boolean()
      .optional()
      .describe("Filter resolved/unresolved issues"),
    sinceLeakPeriod: z
      .boolean()
      .optional()
      .describe("Only issues created since the leak period"),
    page: z.number().optional().describe("Page number (default 1)"),
    pageSize: z.number().optional().describe("Page size (default 100, max 500)"),
  },
  async ({
    projectKey,
    componentKeys,
    severities,
    types,
    resolved,
    sinceLeakPeriod,
    page,
    pageSize,
  }) => {
    const params: Record<string, string> = {
      componentKeys: componentKeys ?? projectKey,
    };
    if (severities) params.severities = severities;
    if (types) params.types = types;
    if (resolved !== undefined) params.resolved = String(resolved);
    if (sinceLeakPeriod !== undefined)
      params.sinceLeakPeriod = String(sinceLeakPeriod);
    if (page !== undefined) params.p = String(page);
    if (pageSize !== undefined) params.ps = String(pageSize);

    const data = await sonarFetch("/api/issues/search", params);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool 2: sonar_metrics
server.tool(
  "sonar_metrics",
  "Get SonarQube component metrics (coverage, bugs, code smells, etc.)",
  {
    projectKey: z.string().describe("SonarQube project key"),
    metricKeys: z
      .string()
      .optional()
      .describe(
        "Comma-separated metric keys (default: bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc)"
      ),
  },
  async ({ projectKey, metricKeys }) => {
    const data = await sonarFetch("/api/measures/component", {
      component: projectKey,
      metricKeys:
        metricKeys ??
        "bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc",
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool 3: sonar_quality_gate
server.tool(
  "sonar_quality_gate",
  "Get SonarQube quality gate status for a project",
  {
    projectKey: z.string().describe("SonarQube project key"),
  },
  async ({ projectKey }) => {
    const data = await sonarFetch("/api/qualitygates/project_status", {
      projectKey,
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
