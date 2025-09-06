const { InternalServerError, NotFound } = require('../error');
const User = require('../models/user');

async function create(userData) {
    if (!userData.email || !userData.password) {
        throw BadRequest('Email and password are required');
    }
    try {
        const user = await User.create(u);
        return user.toObject();
    } catch (e) {
        if (e.code === 11000) {
            throw Conflict();
        }
        throw e;
    }
}

async function getAll() {
    try {
        return await User.find().lean();
    } catch (err) {
        throw InternalServerError;
    }
}

async function getSingle(query) {
  try {
    let user;

    if (query.id && mongoose.Types.ObjectId.isValid(query.id)) {
      user = await User.findById(query.id);
    } else if (query.email) {
      user = await User.findOne({ email: query.email });
    }

    if (!user.isActive) {
        throw new Error('User is not active');
    }

     return user;

  } catch (err) {
    throw InternalServerError;
  }
}

async function update(id, userData) {
    const updated = await User.findByIdAndUpdate(id, userData, {new: true, runValidators: true}).lean();
    if (!updated) {
        throw NotFound;
    }
    return updated;
}

async function remove(userId) {
  try {
    return await User.findByIdAndDelete(userId);
  } catch (err) {
    throw InternalServerError;
  }
}

module.exports = {create, getAll, getSingle, update, remove};