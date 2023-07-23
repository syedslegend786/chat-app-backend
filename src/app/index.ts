import dotenv from "dotenv";
dotenv.config();
import express from "express";
import expressRateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import bodyParser from "body-parser";
// import xss from "xss"; // later
import cors from "cors";

const app = express();
app.use(express.json());

app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// rate limit
const limiter = expressRateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "To many requests, please try again after 1 hour.",
});
app.use("/tawk", limiter); // any request start with "/tawk" , the limiter will be applied.
// rate limit
app.use(mongoSanitize());
// app.use(xss()); // Later...

// Routes...
app.get("/", (req, res) => {
  res.send("hello");
});

import routes from "../routes/index.js";
app.use(routes);

// Routes...
export default app;
