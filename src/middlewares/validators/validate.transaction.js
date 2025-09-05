// src/middlewares/validators/validate.transaction.js
const {celebrate, Joi, Segments} = require('celebrate');

// Example schemas (copy pattern per route)
const createTransactionSchema = celebrate({
    [Segments.BODY]: Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        currency: Joi.string().length(3).uppercase().required(),
        merchantId: Joi.string().guid({version: 'uuidv4'}).required(),
        orderRef: Joi.string().max(64).required(),
        // extend with customer data, returnUrl, etc.
    }),
});

module.exports = {
    celebrate,
    Joi,
    Segments,
    createTransactionSchema,
};