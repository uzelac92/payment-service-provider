require("dotenv").config();
const app = require("./app")
const {connectMongo} = require("./db/mongo")

const PORT = process.env.PORT || 4000;

(async () => {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`Starting auth-service on port ${PORT}`);
    });
})();