const mongoose = require('mongoose'); // Line 1

const studentSchema = new mongoose.Schema({ // Line 3
    roll: { type: String, required: true, unique: true, uppercase: true }, // Line 4
    name: { type: String, required: true }, // Line 5
    section: { type: String, required: true }, // Line 6
    parentPhone: { type: String, required: true }, // Line 7
    key: { type: String, unique: true }, // Line 8
    
    attendance: {  // Line 10
        type: Map, 
        of: [String],
        default: {} 
    },
    fees: {  // Line 16
        type: String, 
        enum: ['paid', 'due'], 
        default: 'due' 
    },
    performance: { // Line 21
        type: Map, 
        of: mongoose.Schema.Types.Mixed,
        default: {} 
    }
});

module.exports = mongoose.model('Student', studentSchema); // Line 28