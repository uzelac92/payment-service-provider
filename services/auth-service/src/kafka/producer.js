const {Kafka, logLevel} = require("kafkajs");

let producer;

async function getProducer() {
    if (producer) return producer;
    const kafka = new Kafka({
        clientId: "auth-service",
        brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
        logLevel: logLevel.NOTHING,
    });
    producer = kafka.producer();
    await producer.connect();
    return producer;
}

async function publish(topic, payload, key) {
    const p = await getProducer();
    await p.send({
        topic,
        messages: [{key: key ? String(key) : undefined, value: JSON.stringify(payload)}],
    });
}

module.exports = {publish};