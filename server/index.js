import "dotenv/config";
const { app } = await import("./app.js");
const port = Number(process.env.PORT || 8081);
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Mathate API: http://${process.env.HOST || "127.0.0.1"}:${port}`),
);
