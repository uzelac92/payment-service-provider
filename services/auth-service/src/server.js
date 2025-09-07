require("dotenv").config();
const app = require("./app")
const {connectAuthMongo, connectUserMongo} = require("./db/mongo")

const PORT = process.env.PORT || 4000;

(async () => {
    await connectAuthMongo();
    await connectUserMongo();
    app.listen(PORT, () => {
        console.log(`Starting auth-service on port ${PORT}`);
    });
})();