// routes/api.js
const express = require('express');
const router = express.Router();

// Import Models
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Announcement = require('../models/Announcement');
const Material = require('../models/Material');
const Timetable = require('../models/Timetable');

// --- AUTHENTICATION ---
router.post('/auth/teacher', async (req, res) => {
    try {
        const { pin } = req.body;
        const teacher = await Teacher.findOne({ pin });
        if (!teacher) {
            return res.status(404).json({ message: 'Invalid PIN.' });
        }
        res.json({ teacher, section: teacher.section });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.post('/auth/student-parent', async (req, res) => {
    try {
        const { roll } = req.body;
        const student = await Student.findOne({ roll: roll.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.json({ student, section: student.section });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- STUDENTS ---
// Get students by section
router.get('/students/:section', async (req, res) => {
    try {
        const students = await Student.find({ section: req.params.section });
        res.json(students);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add a new student
router.post('/students', async (req, res) => {
    try {
        const { name, section, parentPhone } = req.body;
        
        // Auto-generate roll number
        const lastStudent = await Student.findOne({ section }).sort({ roll: -1 });
        const lastRollNum = lastStudent ? parseInt(lastStudent.roll.split('-')[1]) : 0;
        const newRoll = `${section}-${String(lastRollNum + 1).padStart(2, '0')}`;

        const newStudent = new Student({
            name,
            section,
            parentPhone,
            roll: newRoll,
            key: `${name.replace(/\s/g, '').slice(0, 4)}${section}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        });

        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete a student
router.delete('/students/:roll', async (req, res) => {
    try {
        const deletedStudent = await Student.findOneAndDelete({ roll: req.params.roll.toUpperCase() });
        if (!deletedStudent) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update student details
router.put('/students/:roll', async (req, res) => {
    try {
        const { name, parentPhone } = req.body;
        const updatedStudent = await Student.findOneAndUpdate(
            { roll: req.params.roll.toUpperCase() },
            { name, parentPhone },
            { new: true } // returns the updated document
        );
        if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });
        res.json(updatedStudent);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update student performance
router.put('/students/:roll/performance', async (req, res) => {
    try {
        const { performance } = req.body;
        const student = await Student.findOne({ roll: req.params.roll.toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        student.performance = performance;
        await student.save();
        res.json(student);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Mark attendance
router.post('/students/:roll/attendance', async (req, res) => {
    try {
        const { teacherId, status } = req.body;
        const student = await Student.findOne({ roll: req.params.roll.toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        
        if (!student.attendance.has(teacherId)) {
            student.attendance.set(teacherId, []);
        }
        student.attendance.get(teacherId).unshift(status);
        
        await student.save();
        res.json(student);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update fee status
router.put('/students/:roll/fees', async (req, res) => {
    try {
        const { status } = req.body;
        const student = await Student.findOneAndUpdate(
            { roll: req.params.roll.toUpperCase() },
            { fees: status },
            { new: true }
        );
         if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- NEW AI REPORT GENERATION ROUTE ---
router.post('/students/:roll/generate-report', async (req, res) => {
    try {
        const { studentData, teachers } = req.body;
        if (!studentData || !teachers) {
            return res.status(400).json({ error: "Student data and teachers are required." });
        }

        let performanceDetails = "";
        for (const teacherId in studentData.performance) {
            const teacher = teachers.find(t => t.id === teacherId);
            if (teacher) {
                const subject = teacher.subject;
                const score = studentData.performance[teacherId][subject.toLowerCase()];
                performanceDetails += `- In ${subject}, their score is ${score}.\n`;
            }
        }

        const prompt = `
            You are an expert teacher writing a performance report for a student.
            The student's name is ${studentData.name}.
            Here is their performance data:
            ${performanceDetails}
            
            Based on this, write a concise, encouraging, and professional performance report for their parents. 
            Keep it to 3-4 sentences. Start with "Dear Parent,".
            Identify strengths and one area for improvement.
        `;
        
        // This is where you would call a generative AI model.
        // We are using a placeholder here for demonstration.
        // In a real application, you would make a fetch call to the Gemini API.
        const apiKey = ""; // IMPORTANT: Add your Gemini API Key here
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const fetch = (await import('node-fetch')).default;
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const error = await geminiResponse.json();
            console.error("Gemini API Error:", error);
            return res.status(500).json({ error: "Failed to generate report from AI." });
        }

        const result = await geminiResponse.json();
        const reportText = result.candidates[0].content.parts[0].text;

        res.json({ text: reportText });

    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});


// --- ANNOUNCEMENTS ---
router.get('/announcements/:section', async (req, res) => {
    try {
        const section = req.params.section;
        const announcements = await Announcement.find({
            $or: [{ section: section }, { section: 'all' }]
        }).sort({ date: -1 });
        res.json(announcements);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/announcements', async (req, res) => {
    try {
        const { text, section } = req.body;
        const announcement = new Announcement({ text, section });
        await announcement.save();

        // Real-time notification
        const io = req.app.get('socketio');
        io.emit('new-announcement', announcement);

        res.status(201).json(announcement);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- MATERIALS, TIMETABLE, TEACHERS (GETTERS) ---
router.get('/materials/:section', async (req, res) => {
    try {
        const materials = await Material.find({ section: req.params.section });
        res.json(materials);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/materials', async (req, res) => {
    try {
        const material = new Material(req.body);
        await material.save();
        res.status(201).json(material);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/materials/:id', async (req, res) => {
    try {
        await Material.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


router.get('/timetables/:section', async (req, res) => {
    try {
        const timetable = await Timetable.find({ section: req.params.section });
        res.json(timetable);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/timetables', async (req, res) => {
    try {
        const entry = new Timetable(req.body);
        await entry.save();
        res.status(201).json(entry);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/timetables/:id', async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable entry deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/teachers/:section', async (req, res) => {
    try {
        const teachers = await Teacher.find({ section: req.params.section });
        res.json(teachers);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
