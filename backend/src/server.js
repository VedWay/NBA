import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initWebSocket } from "./realtime/wsHub.js";
import { initializeFirebase } from "./utils/firebase.js";

dotenv.config();
initializeFirebase();

const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const server = http.createServer(app);
initWebSocket(server);

server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
