import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);

app.all("*", (req, res) => {
  res.status(404).json({
    status: "404 Not Found",
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log("Server is running on " + PORT);
});
