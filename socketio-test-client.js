const { io } = require("socket.io-client");
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA4MTE0NTQsInN1YiI6IjY4MmNhZGUzMjRmMjc0OWNlYTEzYjIzNSIsImlhbSI6MTc0ODEzMzA1NCwidHlwZSI6InVzZXIiLCJpYXQiOjE3NDgxMzMwNTR9.NODhCCkCzQcg54EAOaHusvaS-akyvAFAg83KwRONb3CAfvIGrfce-edAdJVUWcHP7-gMf1UzfV3OpdAAX05tVCvKJfbUEhKUtCIg-X4KFrgVS1UYfc1YsGbv804WNi8Vup7Wc8wY0Bdp3QagFYZV7SdO0NxSnuAYJ1txapQQlwsTSWybVPvW89JeCdXLrwcUlfknfhbv03VuzXBoEkcQJsj_bbTuG6WzVcVuBnzBpPmaiKvM_6UR72LJTfVh156ToKWKVrTFIjxFNGnK-pEdfGRAZL14zNao_nbkfAUqD-WJfC_sYgX3P3sjQM1l8QT--szFpu-kaY4MHSK8oY_1UB1H162ej-bFH614bdi_7ZT-4gykERxdenZBPvQrj1BueRsoVKpypxXqz7H_RuMR3gpNdczq6Y2E4BxKQitZvMs9EgdGnilfcAMagP_mgpJBxucKJkGBNO_KhkSy_saZK_fc2S1YgYomocdLif8wBaDEUB6mtw2DD8EhayiPFZGCtjhbVEEOT2w2OCtW7kLlosgW-I2xuqSB-4TQKBUU66XO0kynaob1-DjqZTQVc2tEMhE5FGXb6n8uMHZGyIZdVnssz4jEwa4iWHuhlt7j0025Sz0V9oJT5ku32G1lGbkw0-VeihvyU0aGlwxofh4zCFx0cX0I7A9fQM2IjWF4V78"; // Generate a real one!

const socket = io("http://localhost:3000", {
  auth: { token }
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server!");
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

socket.on("notification", (data) => {
  console.log("Received notification:", data);
});