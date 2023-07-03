import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running at port ${PORT}`));
