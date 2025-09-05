require('dotenv').config();
const app = require('./app');
const {connectMongo} = require("./db/mongo")

const PORT = Number(process.env.PORT) || 4004;

(async () => {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`Starting transaction-service on port ${PORT}`);
    });
})()

