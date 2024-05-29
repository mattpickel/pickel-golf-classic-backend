const crypto = require('crypto');

function verifyClerkWebhook(secret) {
    return (req, res, next) => {
        console.log('Verifying webhook...');
        
        const signatureHeader = req.headers['svix-signature'];
        const timestamp = req.headers['svix-timestamp'];
        const id = req.headers['svix-id'];

        console.log(`Headers - svix-id: ${id}, svix-timestamp: ${timestamp}, svix-signature: ${signatureHeader}`);

        if (!signatureHeader || !timestamp || !id) {
            console.log('Missing svix headers');
            return res.status(400).send('Missing svix headers');
        }

        const payload = JSON.stringify(req.body);
        const payloadToVerify = `${id}.${timestamp}.${payload}`;

        // Extract the signature part from the header
        const [version, receivedSignature] = signatureHeader.split(',');

        // Calculate the expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadToVerify)
            .digest('hex');

        console.log(`Expected Signature: ${expectedSignature}`);
        console.log(`Received Signature: ${receivedSignature}`);

        if (receivedSignature !== expectedSignature) {
            console.log('Invalid signature');
            return res.status(400).send('Invalid signature');
        }

        next();
    };
}

module.exports = verifyClerkWebhook;
