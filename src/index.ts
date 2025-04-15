import app from "./app.js";
import { configDotenv } from "dotenv";
import { connectDB } from "./services/prisma.service.js";

configDotenv();

connectDB()

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
