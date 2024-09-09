// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const Document = require('../models/documentModel'); // Adjust the path as needed
const Project = require('../models/projectModel'); // Adjust the path as needed
const axios = require('axios');
const { authenticate, uploadFile } = require('../utils/googleDriveConfig');
// const { createObjectCsvWriter } = require('csv-writer')
const json2csv = require('json2csv').parse;



// Endpoint to generate CSV and save it
const createDocument = async (req, res) => {
    const { projectId, numberOfArticles, searchQuery, gptKey, userEmail } = req.body;
    const userId = req.user.id; // Assuming req.user.id is set from authentication middleware

    if (!projectId || !numberOfArticles || !searchQuery) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Fetch data from API
        const response = await axios.post(
            "https://nurses-led-qi-project-flaskapi.onrender.com/pubmed-search",
            {
                max_results: numberOfArticles,
                query: searchQuery,
                api_key: gptKey,
                email: userEmail
            }
        );

        const data = response.data;
        console.log('Response from Flask API:', data);
        if (!data) {
            return res.status(404).json({ error: 'Articles not found. Try to change the search Query' });
        }

        // Define file paths
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `TOE_${timestamp}.csv`;
        const tmpDir = path.join(__dirname, '../tmp');
        const filePath = path.join(tmpDir, fileName);

        // Ensure the tmp directory exists
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // const csvWriter = createObjectCsvWriter({
        //     path: filePath,
        //     header: [
        //         { id: 'Title', title: 'Title' },
        //         { id: 'Authors', title: 'Authors' },
        //         { id: 'Purpose', title: 'Purpose' },
        //         { id: 'DesignMethod', title: 'Design & Method' },
        //         { id: 'SampleSettings', title: 'Sample & Settings' },
        //         { id: 'MajorVariables', title: 'Major Variables Studied & Definitions' },
        //         { id: 'Measurement', title: 'Measurement of Variables' },
        //         { id: 'DataAnalysis', title: 'Data Analysis' },
        //         { id: 'Findings', title: 'Findings' },
        //         { id: 'Limitations', title: 'Limitations' },
        //         { id: 'WorthOfPractice', title: 'Worth of Practice - Applicability' },
        //         { id: 'Citation', title: 'Citation (APA Format)' },
        //         { id: 'URL', title: 'URL' }
        //     ]
        // });

        // // Transform data to match the expected structure
        // const records = data.map(item => ({
        //     Title: item.Title,
        //     Authors: item.Authors,
        //     Citation: item["Citation (APA Format)"],
        //     Purpose: item.Purpose,
        //     DesignMethod: item["Design & Method"],
        //     SampleSettings: item["Sample & Settings"],
        //     MajorVariables: item["Major Variables Studied & Definitions"],
        //     Measurement: item["Measurement of Variables"],
        //     DataAnalysis: item["Data Analysis"],
        //     Findings: item.Findings,
        //     Limitations: item.Limitations,
        //     WorthOfPractice: item["Worth of Practice - Applicability"],
        //     URL: item.URL
        // }));

        // await csvWriter.writeRecords(records);


        const fields = ['Citation (APA Format)', 'Purpose', 'Design & Method', 'Sample & Settings', 'Major Variables Studied & Definitions', 'Measurement of Variables', 'Data Analysis', 'Findings', 'Limitations', 'Worth of Practice - Applicability','Title', 'URL'];

        const csv = json2csv(data, { fields });
        fs.writeFile(filePath, csv, (error) => {
            if (error) throw error
            console.log("CSV File saved")
        })
        // Authorize and upload CSV file to Google Drive
        const auth = await authenticate();
        const driveFile = await uploadFile(auth, filePath);

        // Remove local file after upload
        fs.unlinkSync(filePath);

        // Save document link to MongoDB
        const newDocument = new Document({
            link: driveFile.webViewLink, // Google Drive URL
            createdBy: userId
        });
        await newDocument.save();

        // Update project with new document
        await Project.findByIdAndUpdate(projectId, {
            $push: { documents: newDocument._id }
        });

        res.json({ message: 'Document generated and saved successfully', fileLink: driveFile.webViewLink });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createDocument
};
