const {kafka} = require("./client");
const {handleUserCreated} = require("./consumers/users.created");

let consumer;

async function startKafka() {
    consumer = kafka.consumer({groupId: "notification-users-created"})

    await consumer.connect();
    await consumer.subscribe({topic: "users.created.v1", fromBeginning: false})

    await consumer.run({
        eachMessage: async ({topic, _partition, message}) => {
            try {
                const payload = JSON.parse(message.value.toString());
                if (topic === "users.created.v1") {
                    await handleUserCreated(payload);
                }
            } catch (e) {
                console.error("[notification] consumer error:", err?.response?.data || err.message);
            }
        }
    })

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