const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    day: { type: String, required: true },
    time: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true }
});

module.exports = mongoose.model('Timetable', timetableSchema);
