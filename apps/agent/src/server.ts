import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { config } from "./config";

function json(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function startServer(handlers: {
  start: (sessionId: string) => void;
  stop: (sessionId: string) => void;
}) {
  const srv = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }
    const url = new URL(req.url || "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true });
      return;
    }
    if (req.method === "POST" && url.pathname === "/session") {
      const body = await readJson(req);
      const sessionId = body.sessionId;
      if (typeof sessionId !== "string" || !sessionId) {
        json(res, 400, { error: "sessionId required" });
        return;
      }
      handlers.start(sessionId);
      json(res, 200, { ok: true, sessionId });
      return;
    }
    const m = url.pathname.match(/^\/session\/([^/]+)\/stop$/);
    if (req.method === "POST" && m) {
      handlers.stop(decodeURIComponent(m[1]));
      json(res, 200, { ok: true });
      return;
    }
    json(res, 404, { error: "not found" });
  });

  srv.listen(config.port, () =>
    console.log(`[agent] listening on http://localhost:${config.port}`),
  );
  return srv;
}
