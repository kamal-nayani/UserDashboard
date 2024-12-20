const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');


const authRoutes = require('./controllers/authController');
const protect = require('./middlewares/authMiddleware');

dotenv.config();


const app = express();


connectDB();


app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the User Dashboard API');
});


app.post('/api/auth/register', authRoutes.registerUser);
app.post('/api/auth/login', authRoutes.loginUser);


app.get('/api/dashboard', protect, (req, res) => {
    res.json({ message: 'Welcome to the protected dashboard', user: req.user });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
