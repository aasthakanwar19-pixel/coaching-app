const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    pin: { type: String, required: true, unique: true },
    section: { type: String, required: true },
    isFeeManager: { type: Boolean, default: false },
    whatsapp: String
});

module.exports = mongoose.model('Teacher', teacherSchema);
