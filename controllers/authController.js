const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const redisClient = require('../config/redisClient');



const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // const newUser = new User({ username, email, password });
        // await newUser.save();

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // const accessToken = newUser.generateAccessToken();
        // const refreshToken = newUser.generateRefreshToken();

        res.status(201).json({
            message: 'User registered successfully',
            // accessToken,
            // refreshToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
// const loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Find user by email
//         const user = await User.findOne({ email }).exec();

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Compare password using the model method
//         // const isMatch = await user.isPasswordCorrect(password); // Ensure `user` is a User model instance

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Generate Access and Refresh tokens
//         const accessToken = user.generateAccessToken();
//         const refreshToken = user.generateRefreshToken();

//         res.json({
//             message: 'Login successful',
//             accessToken,
//             refreshToken
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }


// };

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    console.log('req.body......', req.body);

    try {
        const user = await User.findOne({ email }).exec();

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        console.log('JWT_SECRET:', process.env.JWT_SECRET);
        console.log('REFRESH_SECRET:', process.env.REFRESH_SECRET);


        // Generate tokens
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

        // Store tokens in Redis
        await redisClient.set(`accessToken:${user._id}`, accessToken, 'EX', 15 * 60); // 15 minutes
        await redisClient.set(`refreshToken:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60); // 7 days

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const changePassword = async (req, res) => {

    console.log("req.body", req.body);

    const { currentPassword, newPassword } = req.body;

    try {
        // Find the user by ID
        const user = await User.findById(req.user._id);

        console.log("user.........", user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        const isMatch = await bcrypt.compare(currentPassword, user.password);

        console.log("ismatch....", isMatch);

        if (!isMatch)

        // if (user.password !== currentPassword)
        {
            return res.status(400).json({ message: 'Invalid current password' });
        }

        // user.password = newPassword;
        user.password = await bcrypt.hash(newPassword, 10);

        console.log('user.password', user.password);

        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const logout = async (req, res) => {
    const { accessToken, refreshToken } = req.body;

    console.log('reqbody@@@@@@', req.body);

    try {
        // Decode access token to get expiration time
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        console.log('decodeeeeeeee', decoded);


        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

        console.log('expiresInnnnnnnnnnn', expiresIn);

        // Blacklist the access token
        await redisClient.set(`blacklist:${accessToken}`, 'true', 'EX', expiresIn);

        // Optionally, delete the refresh token
        await redisClient.del(`refreshToken:${decoded.id}`);

        res.json({ message: 'Logged out successfully!' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid tokens!' });
    }
};





// const refresh = async (req, res) => {
//     const { refreshToken } = req.body;



//     try {
//         // Verify the refresh token
//         const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

//         // Check Redis for the refresh token
//         const storedToken = await redisClient.get(`refreshToken:${decoded.id}`);
//         if (!storedToken || storedToken !== refreshToken) {
//             return res.status(403).json({ message: 'Invalid or expired refresh token!' });
//         }

//         // Generate new tokens
//         const newAccessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
//         const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

//         // Update tokens in Redis
//         await redisClient.set(`accessToken:${decoded.id}`, newAccessToken, 'EX', 15 * 60); // 15 minutes
//         await redisClient.set(`refreshToken:${decoded.id}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60); // 7 days

//         res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Invalid or expired refresh token!' });
//     }
// };

const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // Check Redis for the refresh token
        const storedToken = await redisClient.get(`refreshToken:${decoded.id}`);
        if (!storedToken || storedToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid or expired refresh token!' });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { id: decoded.id, role: decoded.role }, // Include necessary payload data
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Set access token expiration
        );

        // Update the access token in Redis (optional, for token tracking)
        await redisClient.set(`accessToken:${decoded.id}`, newAccessToken, 'EX', 15 * 60); // 15 minutes

        // Return the new access token to the client
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Invalid or expired refresh token!' });
    }
};


module.exports = { registerUser, loginUser, changePassword, logout, refresh };