const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Path to your service account credentials JSON file
const credentialsPath = path.join(__dirname, '../uciproject-433822-3353ddb8f83b.json');
// Load service account credentials
async function authenticate() {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const { client_email, private_key } = credentials;

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email,
            private_key,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return auth.getClient();
}

// Upload file to Google Drive
// async function uploadFile(auth, filePath) {
//     const drive = google.drive({ version: 'v3', auth });
//     const fileMetadata = {
//         name: path.basename(filePath),
//     };
//     const media = {
//         mimeType: 'application/csv',
//         body: fs.createReadStream(filePath),
//     };

//     try {
//         const response = await drive.files.create({
//             resource: fileMetadata,
//             media: media,
//             fields: 'id, webViewLink'
//         });
//         return response.data;
//     } catch (error) {
//         throw new Error(`Error uploading file: ${error.message}`);
//     }
// }

const uploadFile = async (auth, filePath) => {
    const driveService = google.drive({ version: 'v3', auth });

    // Upload file to Google Drive
    const fileMetadata = {
        name: path.basename(filePath),
        mimeType: 'application/csv', // Update MIME type as needed
    };
    const media = {
        body: fs.createReadStream(filePath),
    };

    const response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
    });

    const fileId = response.data.id;

    // Set permissions to make the file public
    await driveService.permissions.create({
        fileId: fileId,
        resource: {
            role: 'writer',
            type: 'anyone',
        },
        fields: 'id',
    });

    return response.data;
};

module.exports = { authenticate, uploadFile };
