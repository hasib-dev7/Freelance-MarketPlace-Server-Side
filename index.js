const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
// middelwear
app.use(cors());
app.use(express.json());
// start server running
app.get("/", (req, res) => {
  res.send("Welcome Freelance MarketPlace ");
});
app.listen(port, () => {
  console.log(`freelance marketPlace server running on the port ${port}`);
});
