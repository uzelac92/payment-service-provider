const {kafka} = require("./client");
const {handleUserCreated} = require("./consumers/users.created");
const {handlePasswordResetRequested} = require("./consumers/password.reset");

let consumer;

async function startKafka() {
    consumer = kafka.consumer({groupId: "pacaria-notification"})

    await consumer.connect();
    await consumer.subscribe({topic: "users.created.v1", fromBeginning: false})
    await consumer.subscribe({topic: "auth.password_reset.v1", fromBeginning: false});


    await consumer.run({
        eachMessage: async ({topic, _partition, message}) => {
            try {
                const payload = JSON.parse(message.value.toString());

                switch (topic) {
                    case "users.created.v1":
                        await handleUserCreated(payload);
                        break;
                    case "auth.password_reset.v1":
                        await handlePasswordResetRequested(payload);
                        break;
                    default:
                    // ignore
                }
            } catch (e) {
                console.error("[notification] consumer error:", e?.response?.data || e.message);
            }
        },
    });

    console.log("[notification] Kafka consumer started");
}

async function stopKafka() {
    if (consumer) {
        try {
            await consumer.disconnect();
        } catch (e) {
            console.error("[notification] consumer disconnect error:", e);
        }
    }
}

module.exports = {startKafka, stopKafka};