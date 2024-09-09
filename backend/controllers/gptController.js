// controllers/gptKeyController.js
const GPTKey = require('../models/gptKeyModel');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCSV } = require('../utils/csvService');

// Retrieve the GPT key
const getGPTKey = async (req, res) => {
    try {
        // console.log("Fetching GPT key from the database");
        const data = await GPTKey.findOne().sort({ updatedAt: -1 }); // Get the most recent key
        if (!data) {
            console.log("No Key found from DB");
            return res.status(404).json({ message: 'GPT key not found' });
        }
        // console.log("Sending key");
        // Flatten the response structure to include the key at the top level
        return res.status(200).json({ message: 'GPT Key Fetched!', key: data.key });
    } catch (error) {
        console.error('Error fetching GPT key:', error); // Added logging for the error
        return res.status(500).json({ message: 'Server error', error });
    }
};

// Update the GPT key
const updateGPTKey = async (req, res) => {
    const { key } = req.body;
    console.log("Updating GPT key for user:", req.user.id);
    if (!key) {
        return res.status(400).json({ message: 'Key is required' });
    }

    try {
        const existingKey = await GPTKey.findOne().sort({ updatedAt: -1 });
        if (!existingKey) {
            return res.status(404).json({ message: 'GPT key not found' });
        }

        existingKey.key = key;
        existingKey.updatedBy = req.user.id; // Assuming user authentication is implemented
        existingKey.updatedAt = Date.now();
        await existingKey.save();

        res.json({ message: 'GPT key updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a new GPT key
const addGPTKey = async (req, res) => {
    const { key } = req.body;
    console.log(req.body);
    if (!key) {
        return res.status(400).json({ message: 'Key is required' });
    }

    try {
        console.log("Adding GPT key by user:", req.user.id);
        const newKey = new GPTKey({
            key,
            updatedBy: req.user.id,
            updatedAt: Date.now()
        });
        await newKey.save();

        return res.status(201).json({ message: 'GPT key added successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

const getGPTKeyPrivate = async () => {
    try {
        const data = await GPTKey.findOne().sort({ updatedAt: -1 }); // Get the most recent key
        if (!data) {
            throw new Error('GPT key not found');
        }
        return data.key;
    } catch (error) {
        console.error('Error fetching GPT key:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
};
const generateSearchQuery = async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required." });
    }

    try {
        console.log(req.body);
        const gptKey= await getGPTKeyPrivate();
        // console.log(gptKey);
        const apiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant specializing in generating search queries for nurse-led QI projects"
                },
                {
                    role: "user",
                    content: `Generate a simple search query based on the following details:\n\nTitle: ${title}\nDescription: ${description}\n\nThe search query should be: \n1. A straightforward and natural language phrase that helps in getting relevant and recent academic papers.\n2. Avoid using complex operators, brackets, or logical connectors.`
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${gptKey}`,
                'Content-Type': 'application/json'
            }
        });

        let searchQuery = apiResponse.data.choices[0].message.content;
        searchQuery = searchQuery.replace(/^"|"$/g, '').trim();
        console.log(searchQuery);

        res.json({ searchQuery });

    } catch (error) {
        console.error("Error generating search strategy:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to generate search strategy." });
    }
};


// const generatePMCResults = async (req, res) => {
//     const { searchQuery, numberOfArticles } = req.body;

//     console.log(req.body);

//     if (!searchQuery || !numberOfArticles) {
//         return res.status(400).json({ error: "Search query and number of articles are required." });
//     }

//     try {
//         console.log(req.body);

//         // Fetch article IDs
//         const apiResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 term: searchQuery,
//                 retmode: 'json',
//                 retmax: numberOfArticles,
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         const results = apiResponse.data.esearchresult;
//         console.log(results);
//         if (!results.idlist.length) {
//             return res.status(404).json({ message: "No results found for the given query." });
//         }

//         // Fetch details for each article
//         const detailsPromises = results.idlist.map(id => axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 id: id,
//                 retmode: 'json',
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }));

//         const detailsResponses = await Promise.all(detailsPromises);
//         const articles = detailsResponses.map(response => response.data);

//         // Generate summaries using GPT
//         const summariesPromises = articles.map(article => generateGPTSummary(article));
//         const summaries = await Promise.all(summariesPromises);
//         console.log(summaries);

//         // Create CSV file
//         const csvFilePath = path.join(__dirname, 'static', `TOE_Data_${new Date().toISOString()}.csv`);
//         await createCSV(articles, summaries, csvFilePath);

//         // Save document to the database
//         // From Authenticate Middleware
//         const createdBy = req.user.id; // Assuming you have user authentication and req.user is populated
//         const document = new Document({
//             link: csvFilePath,
//             createdBy: createdBy
//         });
//         await document.save();

//         // Optionally: Add document reference to the project
//         const projectId = req.body.projectId; // Assuming projectId is sent in the request
//         await Project.findByIdAndUpdate(projectId, {
//             $push: { documents: document._id }
//         });

//         res.json({ message: 'CSV file created and document saved successfully.', file: document });

//     } catch (error) {
//         console.error("Error retrieving results from PubMed Central:", error.response ? error.response.data : error.message);
//         res.status(500).json({ error: "Failed to retrieve results from PubMed Central." });
//     }
// };

module.exports = {
    getGPTKey,
    updateGPTKey,
    addGPTKey,
    generateSearchQuery,
    getGPTKeyPrivate
    // generatePMCResults,
};
