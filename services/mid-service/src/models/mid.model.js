const {Schema} = require('mongoose')

module.exports = function makeMidModel(conn) {
    const {Types} = conn.base

    const MidSchema = new Schema(
        {
            _id: {type: Schema.Types.ObjectId, default: () => new Types.ObjectId()},

            label: {
                type: String,
                required: true,
                unique: true,
                validate: {
                    validator: (v) => {
                        if (v == null || v === '') return true;
                        return v.length >= 2 && v.length <= 100;
                    },
                    message: 'Name must be 2-100 characters long',
                },
            },
            emails: {
                type: String,
                trim: true,
                lowercase: true,
            },
            active: {type: Boolean, default: false}
        },
        {
        collection: "mids",
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform(_doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
        }
    })

    return conn.models.Mid || conn.model('Mid', MidSchema);
};
