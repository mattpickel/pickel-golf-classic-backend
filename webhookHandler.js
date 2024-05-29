const { createUser } = require('./db');
const { Webhook } = require('svix');
require('dotenv').config();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    throw new Error("You need a WEBHOOK_SECRET in your .env");
}

async function handleWebhook(req, res) {
    const headers = req.headers;
    const payload = req.body.toString(); // Convert the raw buffer to string

    // Get the Svix headers for verification
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];

    // If there are no Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({
            success: false,
            message: 'Error occurred -- no svix headers',
        });
    }

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Attempt to verify the incoming webhook
    // If successful, the payload will be available from 'evt'
    // If the verification fails, error out and return error code
    try {
        evt = wh.verify(payload, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (err) {
        console.log('Error verifying webhook:', err.message);
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Process the webhook payload
    const { first_name, last_name, id, } = evt.data;

    console.log(`First name: ${first_name}, Last name: ${last_name}, Clerk ID: ${id}`);

    if (!id) {
        console.log('Missing id in webhook data.');
        return res.status(400).send('Missing id in webhook data.');
    }

    // Extract additional registration details from payload if available
    const {
        friday = false,
        monday = false,
        shirt = '',
        registered = false,
        paid = false
    } = evt.data;

    try {
        const newUser = {
            firstName: first_name,
            lastName: last_name,
            clerkId: id,
            friday,
            monday,
            shirt,
            registered,
            paid
        };

        const createdUser = await createUser(newUser);

        console.log(`New user created or updated with id: ${createdUser.id}`);
        res.status(201).json({
            success: true,
            message: 'Webhook received and user created or updated',
            user: createdUser
        });
    } catch (error) {
        console.error(`Error creating or updating user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error creating or updating user',
            error: error.message
        });
    }
}

module.exports = handleWebhook;
