const mongoose = require("mongoose");
const {InternalServerError, BadRequest, NotFound, Conflict} = require("@uzelac92/payment-models");

function parseBool(v) {
    if (v === undefined) return undefined;
    return v === true || v === "true" || v === "1";
}

async function create({User, data}) {
    if (!data?.email || !data?.password) throw BadRequest("Email and password are required");

    const payload = {
        name: data.name?.trim(),
        email: String(data.email).toLowerCase(),
        password: data.password,
        isActive: data.isActive ?? false,
    };

    try {
        const user = await User.create(payload);
        return user.toJSON();
    } catch (e) {
        if (e?.code === 11000) throw Conflict("User with this email already exists");
        if (e?.status) throw e;
        throw InternalServerError();
    }
}

async function getAll({User, q = {}}) {
    const page = Math.max(parseInt(q.page ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(q.limit ?? "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    const active = parseBool(q.isActive);
    if (active !== undefined) filter.isActive = active;
    if (q.search) {
        filter.$or = [
            {name: {$regex: q.search, $options: "i"}},
            {email: {$regex: q.search, $options: "i"}},
        ];
    }

    try {
        const [items, total] = await Promise.all([
            User.find(filter).sort({createdAt: -1}).skip(skip).limit(limit).lean({getters: true}),
            User.countDocuments(filter),
        ]);
        return {items, total, page, limit};
    } catch (e) {
        if (e?.status) throw e;
        throw InternalServerError();
    }
}

async function getSingle({User, query}) {
    if (!query.id && !query.email) throw BadRequest("Provide id or email");

    let user;
    try {
        if (query.id && mongoose.Types.ObjectId.isValid(query.id)) {
            user = await User.findById(query.id).lean();
        } else if (query.email) {
            user = await User.findOne({email: String(query.email).toLowerCase()}).lean();
        }
    } catch (e) {
        if (e?.status) throw e;
        throw InternalServerError();
    }

    // ⬇️ outside the try: no “throw caught locally” warning
    if (!user) throw NotFound("User not found");
    if (user.isActive === false) throw BadRequest("User is not active");
    return user;
}

async function update({User, id, data}) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw BadRequest("Invalid id");

    const ALLOWED = ["name", "email", "isActive"];
    const safePatch = Object.fromEntries(
        Object.entries(data || {})
            .filter(([k]) => ALLOWED.includes(k))
            .map(([k, v]) => (k === "email" ? [k, String(v).toLowerCase()] : [k, v]))
    );

    let updated;
    try {
        updated = await User.findByIdAndUpdate(id, safePatch, {new: true, runValidators: true}).lean();
    } catch (e) {
        if (e?.code === 11000) throw Conflict("Email already in use");
        if (e?.status) throw e;
        throw InternalServerError();
    }

    // ⬇️ outside the try
    if (!updated) throw NotFound("User not found");
    return updated;
}

async function remove({User, id}) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw BadRequest("Invalid id");

    let res;
    try {
        res = await User.findByIdAndDelete(id).lean();
    } catch (e) {
        if (e?.status) throw e;
        throw InternalServerError();
    }

    // ⬇️ outside the try
    if (!res) throw NotFound("User not found");
    return true;
}

module.exports = {create, getAll, getSingle, update, remove};