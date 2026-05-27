import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "app_data.json");

app.use(express.json({ limit: '50mb' }));

app.get("/api/data", async (req, res) => {
  try {
    const type = req.query.type as string || 'mensal';
    const filePath = type === 'anual' ? path.join(process.cwd(), "anual_data.json") : path.join(process.cwd(), "app_data.json");
    const data = await fs.readFile(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      res.json({ data: null, period: null });
    } else {
      res.status(500).json({ error: "Erro ao ler os dados" });
    }
  }
});

app.post("/api/upload", async (req, res) => {
  const { data, period, password, type } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== adminPassword) {
    return res.status(401).json({ error: "Senha inválida" });
  }

  try {
    const filePath = type === 'anual' ? path.join(process.cwd(), "anual_data.json") : path.join(process.cwd(), "app_data.json");
    await fs.writeFile(filePath, JSON.stringify({ data, period }));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar os dados" });
  }
});

app.post("/api/clear", async (req, res) => {
  const { password, type } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== adminPassword) {
    return res.status(401).json({ error: "Senha inválida" });
  }

  try {
    const filePath = type === 'anual' ? path.join(process.cwd(), "anual_data.json") : path.join(process.cwd(), "app_data.json");
    await fs.rm(filePath, { force: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar dados" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
