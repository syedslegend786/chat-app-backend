import app from "./app/index.js";
import http from "http";
import mongoose from "mongoose";
// ---->
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGO_URI;
mongoose
  .connect(DB_URI)
  .then(() => {
    console.log(`DB connected successfully.`);
  })
  .catch((err) => {
    console.log(err);
  });
server.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
// ---->
process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
