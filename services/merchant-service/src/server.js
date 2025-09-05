require("dotenv").config();
const app = require("./app")

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`Starting merchant-service on port ${PORT}`);
})