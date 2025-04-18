import express from "express";
import helmet from "helmet";
import cors from "cors";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json("Server is 🏃‍♂️‍➡️🏃‍♂️‍➡️🏃‍♂️‍➡️");
});

app.use("/user", userRouter);

app.use("/post", postRouter);

export default app;
