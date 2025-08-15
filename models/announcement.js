const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    text: { type: String, required: true },
    section: { type: String, required: true }, // e.g., '12A', '12B', or 'all'
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
