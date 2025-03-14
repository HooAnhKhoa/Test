const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT; // Chỉ dùng port từ Render

app.use(express.json()); // Parse JSON bodies

const mongoURI = process.env.MONGO_URI || "mongodb+srv://anhkhoa12204:Nw82nY5vDcRWveTC@cluster0.wokoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

const inventorySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    pets: { type: [String], default: ["CommonDog"] }
});
const Inventory = mongoose.model("Inventory", inventorySchema);

const petList = [
    { name: "CommonDog", rarity: 0.6 },
    { name: "RareCat", rarity: 0.3 },
    { name: "EpicBird", rarity: 0.09 },
    { name: "LegendaryDragon", rarity: 0.01 }
];

function getRandomPet() {
    const rand = Math.random();
    let cumulative = 0;
    for (const pet of petList) {
        cumulative += pet.rarity;
        if (rand <= cumulative) return pet.name;
    }
    return petList[0].name;
}

// Root endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint called');
    res.send('API is running');
});

// Spin endpoint (GET version - giữ nguyên)
app.get('/spin', async (req, res) => {
    console.log('GET Spin endpoint called');
    const pet = getRandomPet();
    res.json({ pet });
});

// Spin endpoint (POST version with userId)
app.post('/spin/:userId', async (req, res) => {
    console.log(`POST Spin endpoint called for userId: ${req.params.userId}, body:`, req.body);
    const userId = req.params.userId;
    try {
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const pet = getRandomPet();
        console.log(`Generated pet for ${userId}: ${pet}`);

        // Cập nhật inventory với pet mới
        let inventory = await Inventory.findOne({ userId });
        if (!inventory) {
            inventory = new Inventory({ userId });
            await inventory.save();
            console.log(`Created new inventory for ${userId}`);
        }
        inventory.pets.push(pet);
        await inventory.save();
        console.log(`Updated inventory for ${userId}:`, inventory.pets);

        res.json({ pet });
    } catch (err) {
        console.error("Error in spin endpoint:", err);
        res.status(500).json({ error: err.message });
    }
});

// Inventory endpoint (GET)
app.get('/inventory/:userId', async (req, res) => {
    console.log(`GET Inventory endpoint called for userId: ${req.params.userId}`);
    try {
        const userId = req.params.userId;
        let inventory = await Inventory.findOne({ userId });
        console.log(`Found inventory in MongoDB:`, inventory);
        if (!inventory) {
            inventory = new Inventory({ userId });
            await inventory.save();
            console.log(`Created new inventory for ${userId}:`, inventory);
        }
        res.json({ inventory: inventory.pets });
    } catch (err) {
        console.error(`Error querying MongoDB:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Inventory endpoint (POST - thêm pet)
app.post('/inventory/:userId', async (req, res) => {
    console.log(`POST Inventory endpoint called for userId: ${req.params.userId}, body:`, req.body);
    try {
        const userId = req.params.userId;
        const newPet = req.body.pet;
        if (!newPet) {
            return res.status(400).json({ error: "Pet is required" });
        }
        let inventory = await Inventory.findOne({ userId });
        console.log(`Found inventory before update:`, inventory);
        if (!inventory) {
            inventory = new Inventory({ userId, pets: [newPet] });
        } else {
            inventory.pets.push(newPet);
        }
        await inventory.save();
        console.log(`Saved inventory for ${userId}:`, inventory.pets);
        res.json({ success: true, inventory: inventory.pets });
    } catch (err) {
        console.error("Error saving to MongoDB:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});