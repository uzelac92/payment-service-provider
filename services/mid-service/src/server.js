require("dotenv").config()
const app = require("./app")
const midCtrl = require("./controllers/mid.controller")
const {connectMidMongo, getMidConn} = require("./db/mongo")
const makeMidModel = require("./models/mid.model")

const PORT = process.env.PORT || 4003;

(async () => {
    await connectMidMongo();
    const midConn = await getMidConn();

    const Mid = makeMidModel(midConn);
    await midCtrl.init({mid: Mid});


    app.listen(PORT, () => {
        console.log(`Starting mid-service on port ${PORT}`);
    })
})().catch((e) => {
    console.error('mid-service failed to start', e);
    process.exit(1);
});