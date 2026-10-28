
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- DATABASE MODELS --------------------

// Plant model
const Plant = mongoose.models.Plant || mongoose.model('Plant', new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    watering: { type: String, default: 'Weekly' },
    sunlight: { type: String, default: 'Indirect sunlight' },
    emoji: { type: String, default: '🪴' },
    status: {
        type: String,
        enum: ['Healthy', 'Needs Attention', 'Under Treatment'],
        default: 'Healthy'
    }
}, { timestamps: true }));

// Care task model
const CareTask = mongoose.models.CareTask || mongoose.model('CareTask', new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    plant: { type: String, required: true, trim: true },
    type: { type: String, default: 'Watering' },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false }
}, { timestamps: true }));

// Growth record model
const GrowthRecord = mongoose.models.GrowthRecord || mongoose.model('GrowthRecord', new mongoose.Schema({
    plant: { type: String, required: true, trim: true },
    height: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    notes: { type: String, default: '' }
}, { timestamps: true }));

// Health journal model
const HealthRecord = mongoose.models.HealthRecord || mongoose.model('HealthRecord', new mongoose.Schema({
    plant: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    status: {
        type: String,
        enum: ['Healthy', 'Needs Attention', 'Under Treatment'],
        default: 'Healthy'
    },
    observation: { type: String, default: '' },
    treatment: { type: String, default: '' }
}, { timestamps: true }));

// -------------------- HOME / TEST ROUTES --------------------

app.get('/', (req, res) => {
    res.send('GreenNest Backend is Running!');
});

app.get('/api', (req, res) => {
    res.json({
        message: 'GreenNest API is working',
        endpoints: [
            '/api/plants',
            '/api/tasks',
            '/api/growth',
            '/api/health'
        ]
    });
});

// -------------------- PLANTS API --------------------

// Get all plants
app.get('/api/plants', async (req, res) => {
    try {
        const plants = await Plant.find().sort({ createdAt: -1 });
        res.json(plants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get one plant
app.get('/api/plants/:id', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);

        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }

        res.json(plant);
    } catch (error) {
        res.status(400).json({ message: 'Invalid plant ID' });
    }
});

// Add a plant
app.post('/api/plants', async (req, res) => {
    try {
        const plant = await Plant.create(req.body);
        res.status(201).json(plant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Edit a plant
app.put('/api/plants/:id', async (req, res) => {
    try {
        const allowedFields = [
            'name', 'type', 'location', 'watering',
            'sunlight', 'emoji', 'status'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const plant = await Plant.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }

        res.json(plant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a plant and its related records
app.delete('/api/plants/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndDelete(req.params.id);

        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }

        await Promise.all([
            CareTask.deleteMany({ plant: plant.name }),
            GrowthRecord.deleteMany({ plant: plant.name }),
            HealthRecord.deleteMany({ plant: plant.name })
        ]);

        res.json({ message: 'Plant and related records deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// -------------------- CARE TASKS API --------------------

// Get all care tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await CareTask.find().sort({ date: 1, createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a care task
app.post('/api/tasks', async (req, res) => {
    try {
        const task = await CareTask.create(req.body);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a care task, including its completed status
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const allowedFields = ['title', 'plant', 'type', 'date', 'completed'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const task = await CareTask.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Care task not found' });
        }

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a care task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const task = await CareTask.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Care task not found' });
        }

        res.json({ message: 'Care task deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// -------------------- GROWTH API --------------------

// Get all growth records
app.get('/api/growth', async (req, res) => {
    try {
        const records = await GrowthRecord.find().sort({ date: 1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a growth record
app.post('/api/growth', async (req, res) => {
    try {
        const record = await GrowthRecord.create(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a growth record
app.delete('/api/growth/:id', async (req, res) => {
    try {
        const record = await GrowthRecord.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Growth record not found' });
        }

        res.json({ message: 'Growth record deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// -------------------- HEALTH JOURNAL API --------------------

// Get all health records
app.get('/api/health', async (req, res) => {
    try {
        const records = await HealthRecord.find().sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a health observation and update the plant's status
app.post('/api/health', async (req, res) => {
    try {
        const record = await HealthRecord.create(req.body);

        await Plant.findOneAndUpdate(
            { name: record.plant },
            { $set: { status: record.status } }
        );

        res.status(201).json(record);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a health record
app.delete('/api/health/:id', async (req, res) => {
    try {
        const record = await HealthRecord.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Health record not found' });
        }

        res.json({ message: 'Health record deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// -------------------- 404 HANDLER --------------------
// IMPORTANT: Keep this at the bottom, after all API routes.

app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        requestedUrl: req.originalUrl
    });
});

// -------------------- START SERVER --------------------

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing from the server .env file');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully!');

        app.listen(PORT, () => {
            console.log(`GreenNest backend running on port ${PORT}`);
            console.log(`Home: http://localhost:${PORT}`);
            console.log(`Plants: http://localhost:${PORT}/api/plants`);
            console.log(`Tasks: http://localhost:${PORT}/api/tasks`);
            console.log(`Growth: http://localhost:${PORT}/api/growth`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start GreenNest backend:', error.message);
        process.exit(1);
    }
}

startServer();



