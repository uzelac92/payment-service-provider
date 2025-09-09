const mongoose = require('mongoose')
//baca mi error da ne vidi ovaj tvoj repo pa sam zakomentarisao
//const {InternalServerError, BadRequest, NotFound, Conflict} = require("@uzelac92/payment-models");

function parseBool(v) {
    if (v === undefined) return undefined;
    return v === true || v === "true" || v === "1";
}

async function create({Mid, data}) {
    //if(!data?.label) throw new BadRequest("Label is required");

    const payload = {
        label: data?.label.trim(),
        emails: data?.emails,
        isActive: data?.isActive ?? false,
    }

    try {
        const mid = Mid.create(payload);
        return mid.toJSON();
    } catch (e) {
        //if (e?.code === 11000) throw Conflict("Mid with this label already exists");
        if (e?.status) throw e;
        //throw InternalServerError();
    }
}

async function getAll({Mid, q = {}}) {
    const page = Math.max(parseInt(q.page ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(q.limit ?? "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    const active = parseBool(q.active);
    if (active !== undefined) filter.active = active;

    try {
        const [items, total] = await Promise.all([
            Mid.find(filter).sort({label: 1}).skip(skip).limit(limit).lean({getters: true}),
            Mid.countDocuments(filter),
        ]);
        return {items, total, page, limit};
    } catch (e) {
        if (e?.status) throw e;
        //throw InternalServerError();
    }
}

async function getSingle({Mid, query}) {
    //if(!query.id || !query.label) throw new BadRequest("Label or id are required");

    let mid;
    try {
        if (query.id && mongoose.Types.ObjectId.isValid(query.id)) {
            mid = await Mid.findById(query.id).lean();
        } else if (query.label) {
            mid = await Mid.findOne({label: String(query.label)}).lean();
        }
    } catch (e) {
        if (e?.status) throw e;
        //throw InternalServerError();
    }

    //if (!mid) throw NotFound("Mid not found");
    return mid;
}

async function update({Mid, id, data}) {
    //if (!mongoose.Types.ObjectId.isValid(id)) return BadRequest("Invalid id");

    const ALLOWED = ["label", "emails", "active"];
    const safePatch = Object.fromEntries(
        Object.entries(data || {})
            .filter(([k]) => ALLOWED.includes(k))
    );

    let updated;
    try {
        updated = await Mid.findByIdAndUpdate(id, safePatch, {new: true, runValidators: true}).lean();
    } catch (e) {
        //if (e?.code === 11000) throw Conflict("Label already in use");
        if (e?.status) throw e;
        //throw InternalServerError();
    }

    //if (!updated) throw NotFound("Mid not found");
    return updated;
}

async function remove({Mid, id}) {
    //if(!mongoose.Types.ObjectId.isValid(id)) return BadRequest("Invalid id");

    let res;
    try {
        await Mid.findByIdAndDelete(id);
        //res = await Mid.findByIdAndDelete(id);
    } catch (e) {
        //throw InternalServerError();
    }

    //if (!res) throw NotFound("Mid not found for remove");
    return true;
}

module.exports = {getSingle, getAll, create, update, remove};