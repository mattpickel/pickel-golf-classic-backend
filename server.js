const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const handleWebhook = require('./webhookHandler');
const { getUsers, createUser, getUserById } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'https://pickelgolfclassic.com',
    'https://www.pickelgolfclassic.com',
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.post('/api/webhooks', bodyParser.raw({ type: 'application/json' }), handleWebhook);
app.use(bodyParser.json());

app.post('/api/update-user', async (req, res) => {
    const { firstName, lastName, friday, monday, shirt, clerkId, registered } = req.body;
    console.log('Received data to update user:', req.body);

    try {
        const updatedUser = await createUser({ firstName, lastName, friday, monday, shirt, clerkId, registered });
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

app.get('/api/user/:clerkId', async (req, res) => {
    const { clerkId } = req.params;
    console.log(`Fetching data for user with Clerk ID: ${clerkId}`);

    try {
        const user = await getUserById(clerkId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).send('Error fetching users');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
