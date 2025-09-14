require("dotenv").config();

const app = require("./app");
const {initEmail} = require("./email/sendgrid");
const {startKafka, stopKafka} = require("./kafka/runner");

const PORT = Number(process.env.PORT || 4005);

initEmail();

const server = app.listen(PORT, async () => {
    console.log(`Starting notification-service on port ${PORT}`);
    try {
        await startKafka();
    } catch (e) {
        console.error("[notification] Kafka start error:", e.message);
        // service can still run health endpoints without Kafka; decide if you want to process.exit(1)
    }
});

// --- Graceful shutdown
function shutdown(signal) {
    console.log(`[notification] Received ${signal}. Closing...`);
    server.close(async () => {
        try {
            await stopKafka();
        } catch (e) {
            console.error("[notification] Shutdown error:", e);
        } finally {
            process.exit(0);
        }
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));