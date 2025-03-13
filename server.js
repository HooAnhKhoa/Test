const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT; // Chỉ dùng port từ Render

app.use(express.json());

const mongoURI = process.env.MONGO_URI || "mongodb+srv://anhkhoa12204:Nw82nY5vDcRWveTC@cluster0.wokoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB error:", err));

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

app.get('/', (req, res) => {
    console.log('Root endpoint called');
    res.send('API is running');
});

app.get('/spin', async (req, res) => {
    console.log('Spin endpoint called');
    const pet = getRandomPet();
    res.json({ pet });
});

app.get('/inventory/:userId', async (req, res) => {
    console.log(`Inventory endpoint called for userId: ${req.params.userId}`);
    try {
        const userId = req.params.userId;
        let inventory = await Inventory.findOne({ userId });
        if (!inventory) {
            inventory = new Inventory({ userId });
            await inventory.save();
        }
        res.json({ inventory: inventory.pets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/inventory/:userId', async (req, res) => {
    console.log(`POST inventory endpoint called for userId: ${req.params.userId}`);
    try {
        const userId = req.params.userId;
        const newPet = req.body.pet;
        let inventory = await Inventory.findOne({ userId });
        if (!inventory) {
            inventory = new Inventory({ userId, pets: [newPet] });
        } else {
            inventory.pets.push(newPet);
        }
        await inventory.save();
        res.json({ success: true, inventory: inventory.pets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});