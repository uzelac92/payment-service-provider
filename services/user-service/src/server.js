require("dotenv").config();
const app = require("./app")
const {connectMongo} = require("./db/mongo")

const PORT = process.env.PORT || 4001;

(async () => {
    await connectMongo();
    app.listen(PORT, () => {
        console.log("Starting user-service on port: " + PORT);
    })
})()