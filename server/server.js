const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const MONGO_URI = "mongodb+srv://<Your_db_name>:<password>@clustername.e8yoxmp.mongodb.net/?appName=clustername";
const JWT_SECRET = "my_super_secret_key_123";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ Connection Error:", err));

// --- MULTER SETUP ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- MODELS ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    institute: { type: String, default: "VJTI" },
    branch: { type: String, required: true },
    mobile: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    contactPhone: String,
    imageUrl: String,
    sellerName: String,
    description: String,
    // NEW: Status field to track History
    status: { type: String, default: 'active' }, // 'active' or 'sold'
    date: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', ProductSchema);

// --- ROUTES ---

// Register & Login (Same as before)
app.post('/register', async (req, res) => {
    const { username, password, branch, mobile } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already taken" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, institute: "VJTI", branch, mobile });
    try { await user.save(); res.json({ message: "Registered" }); } 
    catch (err) { res.status(500).json({ error: "Error" }); }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, username: user.username, branch: user.branch }, JWT_SECRET);
    // Send back branch and mobile too for the profile
    res.json({ token, username: user.username, branch: user.branch, mobile: user.mobile });
});

// GET PRODUCTS (Only Active ones for Home Page)
app.get('/products', async (req, res) => {
    const { search, category } = req.query;
    let query = { status: 'active' }; // FILTER: Only show active items
    if (search) query.name = { $regex: search, $options: "i" };
    if (category && category !== "All") query.category = category;
    const products = await Product.find(query).sort({ date: -1 });
    res.json(products);
});

// ADD PRODUCT
app.post('/add-product', upload.single('image'), async (req, res) => {
    let imageUrl = 'https://via.placeholder.com/300';
    if (req.file) imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    const newProduct = new Product({
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        contactPhone: req.body.contactPhone,
        description: req.body.description,
        imageUrl: imageUrl,
        sellerName: req.body.sellerName,
        status: 'active'
    });
    await newProduct.save();
    res.json({ message: "Item added!" });
});

// NEW: GET MY ADS (For Profile - Returns Active AND Sold)
app.get('/my-ads', async (req, res) => {
    const { username } = req.query;
    const products = await Product.find({ sellerName: username }).sort({ date: -1 });
    res.json(products);
});

// NEW: MARK AS SOLD
app.put('/mark-sold/:id', async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, { status: 'sold' });
    res.json({ message: "Marked as sold" });
});

// NEW: DELETE PRODUCT
app.delete('/delete-product/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// ==========================================
// UPDATE PRODUCT ROUTE (Edit Name, Price, Desc)
// ==========================================
app.put('/update-product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description } = req.body;

        // 1. Find the product by ID
        // 2. Update the specific fields
        // 3. { new: true } returns the updated document (optional but good for debugging)
        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            { name, price, description },
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ message: "Product updated successfully", product: updatedProduct });

    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: "Failed to update product" });
    }
});

// ==========================================
// UPDATE USER PROFILE (And fix old ads)
// ==========================================
app.put('/update-profile', async (req, res) => {
    const { username, mobile, branch } = req.body;

    try {
        // 1. Update the User Database
        const updatedUser = await User.findOneAndUpdate(
            { username }, 
            { mobile, branch },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. MAGICAL FIX: Update all existing products by this seller
        // This fixes the "previous ads" that had missing numbers
        await Product.updateMany(
            { sellerName: username },
            { contactPhone: mobile }
        );

        res.json({ 
            message: "Profile and Ads updated successfully!", 
            mobile: updatedUser.mobile, 
            branch: updatedUser.branch 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
