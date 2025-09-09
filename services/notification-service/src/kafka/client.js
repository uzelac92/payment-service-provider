const {Kafka, logLevel} = require("kafkajs");

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const logging = process.env.NODE_ENV === 'development' ? logLevel.DEBUG : logLevel.INFO;

const kafka = new Kafka({
    clientId: "notification-service",
    brokers,
    logLevel: logging,
});

module.exports = {kafka};