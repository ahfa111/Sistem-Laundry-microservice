const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/laundry_db';

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    seedData();
}).catch(err => console.error('MongoDB connection error:', err));


const laundryPackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true }
}, { timestamps: true });

const LaundryPackage = mongoose.model('LaundryPackage', laundryPackageSchema);

const laundryCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String
}, { timestamps: true });

const LaundryCategory = mongoose.model('LaundryCategory', laundryCategorySchema);


async function seedData() {
    try {
        const packageCount = await LaundryPackage.countDocuments();
        if (packageCount === 0) {
            await LaundryPackage.insertMany([
                { name: 'Cuci Komplit', description: 'Cuci kering dan setrika, pakaian siap pakai', price: 15000 },
                { name: 'Cuci Kering', description: 'Hanya cuci dan keringkan, tanpa setrika', price: 10000 },
                { name: 'Setrika Saja', description: 'Hanya setrika pakaian', price: 8000 },
                { name: 'Cuci Karpet', description: 'Cuci karpet per meter persegi', price: 25000 }
            ]);
            console.log('Seeded laundry packages');
        }

        const categoryCount = await LaundryCategory.countDocuments();
        if (categoryCount === 0) {
            await LaundryCategory.insertMany([
                { name: 'Pakaian', description: 'Kategori untuk semua jenis pakaian sehari-hari' },
                { name: 'Perlengkapan Rumah', description: 'Kategori untuk sprei, selimut, karpet, dll' }
            ]);
            console.log('Seeded laundry categories');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}


app.get('/laundry', async (req, res) => {
    try {
        const packages = await LaundryPackage.find();
        res.json(packages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/laundry/:id', async (req, res) => {
    try {
        const package = await LaundryPackage.findById(req.params.id);
        if (!package) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json(package);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/laundry', async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const newPackage = new LaundryPackage({ name, description, price });
        await newPackage.save();
        res.status(201).json(newPackage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/laundry/:id', async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const updatedPackage = await LaundryPackage.findByIdAndUpdate(
            req.params.id,
            { name, description, price },
            { new: true, runValidators: true }
        );
        if (!updatedPackage) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json(updatedPackage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/laundry/:id', async (req, res) => {
    try {
        const deletedPackage = await LaundryPackage.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json({ message: 'Laundry package deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/laundry-categories', async (req, res) => {
    try {
        const categories = await LaundryCategory.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/laundry-categories/:id', async (req, res) => {
    try {
        const category = await LaundryCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/laundry-categories', async (req, res) => {
    const { name, description } = req.body;
    try {
        const newCategory = new LaundryCategory({ name, description });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/laundry-categories/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        const updatedCategory = await LaundryCategory.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(updatedCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/laundry-categories/:id', async (req, res) => {
    try {
        const deletedCategory = await LaundryCategory.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`LaundryService listening on port ${port}`);
});
