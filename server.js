const express = require('express');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const { registerUser, loginUser, changePassword, logout, refresh } = require('./controllers/authController');
const { protect } = require('./middlewares/authMiddleware');
const verifyToken = require('./middlewares/verifyToken');
const verifyRole = require('./middlewares/verifyRole');


dotenv.config();

const app = express();
connectDB();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the User Dashboard API');
});

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/auth/change-password', protect, changePassword);
app.post('/api/auth/logout', verifyToken, logout);
app.post('/api/auth/refresh', refresh);

app.get('/api/dashboard', protect, (req, res) => {
    res.json({ message: 'Welcome to the protected dashboard', user: req.user });
});



app.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
    res.json({ message: 'Welcome Admin!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});