// controllers/gptKeyController.js
const GPTKey = require('../models/gptKeyModel');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCSV } = require('../utils/csvService');
// const rateLimit = require('rate-limiter-flexible');
// const xml2js = require('xml2js');
// const { generateGPTSummary } = require('../utils/gptService');


// Create a rate limiter with a limit of 10 requests per minute
// const rateLimiter = new rateLimit.RateLimiterMemory({
//     points: 10, // Number of requests
//     duration: 60, // Per 60 seconds
// });

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


const generatePMCResults = async (req, res) => {
    const { searchQuery, numberOfArticles } = req.body;

    console.log(req.body);

    if (!searchQuery || !numberOfArticles) {
        return res.status(400).json({ error: "Search query and number of articles are required." });
    }

    try {
        console.log(req.body);

        // Fetch article IDs
        const apiResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
            params: {
                db: 'pmc',
                term: searchQuery,
                retmode: 'json',
                retmax: numberOfArticles,
                api_key: process.env.PUBMED_API_KEY
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const results = apiResponse.data.esearchresult;
        console.log(results);
        if (!results.idlist.length) {
            return res.status(404).json({ message: "No results found for the given query." });
        }

        // Fetch details for each article
        const detailsPromises = results.idlist.map(id => axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
            params: {
                db: 'pmc',
                id: id,
                retmode: 'json',
                api_key: process.env.PUBMED_API_KEY
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }));

        const detailsResponses = await Promise.all(detailsPromises);
        const articles = detailsResponses.map(response => response.data);

        // Generate summaries using GPT
        const summariesPromises = articles.map(article => generateGPTSummary(article));
        const summaries = await Promise.all(summariesPromises);
        console.log(summaries);

        // Create CSV file
        const csvFilePath = path.join(__dirname, 'static', `TOE_Data_${new Date().toISOString()}.csv`);
        await createCSV(articles, summaries, csvFilePath);

        // Save document to the database
        // From Authenticate Middleware
        const createdBy = req.user.id; // Assuming you have user authentication and req.user is populated
        const document = new Document({
            link: csvFilePath,
            createdBy: createdBy
        });
        await document.save();

        // Optionally: Add document reference to the project
        const projectId = req.body.projectId; // Assuming projectId is sent in the request
        await Project.findByIdAndUpdate(projectId, {
            $push: { documents: document._id }
        });

        res.json({ message: 'CSV file created and document saved successfully.', file: document });

    } catch (error) {
        console.error("Error retrieving results from PubMed Central:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to retrieve results from PubMed Central." });
    }
};

module.exports = {
    getGPTKey,
    updateGPTKey,
    addGPTKey,
    generateSearchQuery,
    generatePMCResults,
};



//Gives the PMC results
// const generatePMCResults = async (req, res) => {
//     const { searchQuery } = req.body;

//     if (!searchQuery) {
//         return res.status(400).json({ error: "Search query is required." });
//     }

//     try {
//         console.log(req.body);
//         const apiResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
//             params: {
//                 db: 'pmc', // PubMed Central database
//                 term: searchQuery,
//                 retmode: 'json',
//                 retmax: 50, // Number of results to retrieve, you can adjust this
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/json'
//                 // Add 'api_key' here if PubMed requires it
//             }
//         });

//         const results = apiResponse.data;
//         if (results.length === 0) {
//             return res.status(404).json({ message: "No results found for the given query." });
//         }

//         res.json({ results });

//     } catch (error) {
//         console.error("Error retrieving results from PubMed Central:", error.response ? error.response.data : error.message);
//         res.status(500).json({ error: "Failed to retrieve results from PubMed Central." });
//     }
// };
// const fetchArticles = async (req, res) => {
//     try {
//         // URL-encode the search query using encodeURIComponent
//         const { numberOfArticles } = req.body;
//         console.log(req.body);
//         const searchQuery = `("nurse-led quality improvement" OR "nurse-led intervention" OR "nurse-driven quality improvement") AND ("pain management" OR "postoperative pain" OR "pain assessment" OR "pain management strategies") AND ("patient education" OR "patient care" OR "pain management protocols")`
//         const encodedQuery = encodeURIComponent(searchQuery);
//         console.log(encodedQuery);
//         await rateLimiter.consume(1);
//         // Fetch article IDs from PubMed Central
//         const apiResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
//             params: {
//                 db: 'pmc', // Database to search
//                 term: searchQuery, // Encoded search query
//                 retmode: 'json', // Return format
//                 retmax: numberOfArticles, // Number of results to retrieve
//                 api_key: process.env.PUBMED_API_KEY // API key
//             },
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         // Extract and log the search results
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
//         const articles = detailsResponses.map(response => {
//             const article = response.data;
//             return {
//                 title: article.title,
//                 authors: article.authors.map(author => author.name).join(', '),
//                 abstract: article.abstract,
//                 pubDate: article.pubDate
//             };
//         });
//         console.log(articles);
//         // Generate summaries using GPT
//         // const summariesPromises = articles.map(article => generateGPTSummary(article));
//         // const summaries = await Promise.all(summariesPromises);
//         // console.log(summaries);

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
//         // Check if IDs are available
//         if (results.idlist && results.idlist.length > 0) {
//             console.log('Article IDs:', results.idlist);
//         } else {
//             console.log('No article IDs found.');
//         }
//     } catch (error) {
//         console.error('Error fetching articles:', error.response ? error.response.data : error.message);
//     }
// };


// const fetchArticles = async (req, res) => {
//     try {
//         const { numberOfArticles } = req.body;
//         console.log(req.body);

//         const searchQuery = `("nurse-led quality improvement" OR "nurse-led intervention" OR "nurse-driven quality improvement") AND ("pain management" OR "postoperative pain" OR "pain assessment" OR "pain management strategies") AND ("patient education" OR "patient care" OR "pain management protocols") AND ("purpose" OR "design and method" OR "sample" OR "variables" OR "measurement" OR "data analysis" OR "findings" OR "limitations" OR "worth of practice")`;
//         const encodedQuery = encodeURIComponent(searchQuery);
//         console.log(encodedQuery);

//         await rateLimiter.consume(1);

//         // Fetch article IDs from PubMed Central
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

//         const results = apiResponse.data.esearchresult || {};
//         console.log(results);

//         if (!results.idlist || !results.idlist.length) {
//             return res.status(404).json({ message: "No results found for the given query." });
//         }
//         const articleId = results.idlist[0];
//         // Fetch details for each article
//         // const detailsPromises = results.idlist.map(id => axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//         //     params: {
//         //         db: 'pmc',
//         //         id: id,
//         //         retmode: 'xml', // XML is used for detailed article data
//         //         api_key: process.env.PUBMED_API_KEY
//         //     },
//         //     headers: {
//         //         'Content-Type': 'application/xml'
//         //     }
//         // }));
//         const articleResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 id: articleId,
//                 retmode: 'xml', // Use 'xml' for detailed article data
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/xml' // Adjust header for XML response
//             }
//         });

//         console.log("###########################################################");
//         console.log(`Raw XML for article ID ${articleId}:`);
//         // console.log(articleResponse.data);

//         // Parse XML response
//         const parser = new xml2js.Parser();
//         parser.parseString(articleResponse.data, (err, result) => {
//             if (err) {
//                 console.error('Error parsing XML:', err);
//                 return res.status(500).json({ message: 'Error parsing XML' });
//             }
//             const pubmedArticle = result.PubmedArticleSet && result.PubmedArticleSet.PubmedArticle ? result.PubmedArticleSet.PubmedArticle[0] : {};

//             const article = {
//                 title: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].ArticleTitle && pubmedArticle.MedlineCitation[0].Article[0].ArticleTitle[0]) || 'No Title',
//                 authors: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].AuthorList && pubmedArticle.MedlineCitation[0].Article[0].AuthorList[0].Author || [])
//                     .map(author => `${author.LastName[0]} ${author.ForeName[0]}`)
//                     .join(', ') || 'No Authors',
//                 abstract: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].Abstract && pubmedArticle.MedlineCitation[0].Article[0].Abstract[0].AbstractText || ['No Abstract'])[0],
//                 pubDate: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].Journal && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate[0].Year && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]) || 'No Date'
//             };

//             console.log("Parsed article details:", article);)}

//         // const detailsResponses = await Promise.all(detailsPromises);

//         // // Log raw XML responses
//         // detailsResponses.forEach((response, index) => {
//         //     console.log("###########################################################")
//         //     console.log(`Raw JSON for article ${index}:`);
//         //     console.log(response.data);
//         // });

//         // // Parse XML responses
//         // const articles = await Promise.all(detailsResponses.map(async (response) => {
//         //     const articleData = response.data;

//         //     // Extract data from XML
//         //     const parser = new xml2js.Parser();
//         //     let article = {};

//         //     try {
//         //         const result = await parser.parseStringPromise(articleData);
//         //         const pubmedArticle = result.PubmedArticleSet.PubmedArticle[0];

//         //         article = {
//         //             title: pubmedArticle.MedlineCitation[0].Article[0].ArticleTitle[0] || 'No Title',
//         //             authors: (pubmedArticle.MedlineCitation[0].Article[0].AuthorList[0].Author || [])
//         //                 .map(author => `${author.LastName[0]} ${author.ForeName[0]}`)
//         //                 .join(', ') || 'No Authors',
//         //             abstract: (pubmedArticle.MedlineCitation[0].Article[0].Abstract[0].AbstractText || ['No Abstract'])[0],
//         //             pubDate: pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0] || 'No Date'
//         //         };
//         //     } catch (err) {
//         //         console.error('Error parsing XML:', err);
//         //         article = {
//         //             title: 'No Title',
//         //             authors: 'No Authors',
//         //             abstract: 'No Abstract',
//         //             pubDate: 'No Date'
//         //         };
//         //     }

//         //     return article;
//         // }));

//         // console.log(articles);

//         // Generate summaries using GPT
//         // const summariesPromises = articles.map(article => generateGPTSummary(article));
//         // const summaries = await Promise.all(summariesPromises);
//         // console.log(summaries);

//         // Create CSV file (implementation not shown in this code)
//         // const csvFilePath = path.join(__dirname, 'static', `TOE_Data_${new Date().toISOString()}.csv`);
//         // await createCSV(articles, summaries, csvFilePath);

//         // Save document to the database (implementation not shown in this code)
//         // const createdBy = req.user ? req.user.id : 'anonymous';
//         // const document = new Document({
//         //     link: csvFilePath,
//         //     createdBy: createdBy
//         // });
//         // await document.save();

//         // Optionally: Add document reference to the project (implementation not shown in this code)
//         // const projectId = req.body.projectId;
//         // if (projectId) {
//         //     await Project.findByIdAndUpdate(projectId, {
//         //         $push: { documents: document._id }
//         //     });
//         // }

//         // For the purpose of this example, let's return the articles and summaries directly
//         res.json({ articles, summaries });

//     } catch (error) {
//         console.error('Error fetching articles:', error.response ? error.response.data : error.message);
//         res.status(500).json({ message: 'Error fetching articles.' });
//     }
// };

// const fetchArticles = async (req, res) => {
//     try {
//         const { numberOfArticles } = req.body;
//         console.log("Request Body:", req.body);

//         const searchQuery = `("nurse-led quality improvement" OR "nurse-led intervention" OR "nurse-driven quality improvement") AND ("pain management" OR "postoperative pain" OR "pain assessment" OR "pain management strategies") AND ("patient education" OR "patient care" OR "pain management protocols") AND ("purpose" OR "design and method" OR "sample" OR "variables" OR "measurement" OR "data analysis" OR "findings" OR "limitations" OR "worth of practice")`;


//         await rateLimiter.consume(1);

//         // Fetch article IDs from PubMed Central
//         const apiResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 term: searchQuery, // Use the encoded query
//                 retmode: 'json',
//                 retmax: numberOfArticles,
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         const results = apiResponse.data.esearchresult || {};
//         console.log("Search Results:", results);

//         if (!results.idlist || !results.idlist.length) {
//             return res.status(404).json({ message: "No results found for the given query." });
//         }

//         // Fetch details for each article (for demonstration, we fetch only the first one)
//         const articleId = results.idlist[0];
//         const articleResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 id: articleId,
//                 retmode: 'xml',
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/xml'
//             }
//         });

//         console.log("###########################################################");
//         console.log(`Raw XML for article ID ${articleId}:`);
//         console.log(articleResponse.data);

//         // Parse XML response
//         const parser = new xml2js.Parser();
//         parser.parseString(articleResponse.data, async (err, result) => {
//             if (err) {
//                 console.error('Error parsing XML:', err);
//                 return res.status(500).json({ message: 'Error parsing XML' });
//             }

//             const pubmedArticle = result.PubmedArticleSet && result.PubmedArticleSet.PubmedArticle ? result.PubmedArticleSet.PubmedArticle[0] : {};

//             const article = {
//                 title: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].ArticleTitle && pubmedArticle.MedlineCitation[0].Article[0].ArticleTitle[0]) || 'No Title',
//                 authors: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].AuthorList && pubmedArticle.MedlineCitation[0].Article[0].AuthorList[0].Author || [])
//                     .map(author => `${author.LastName[0]} ${author.ForeName[0]}`)
//                     .join(', ') || 'No Authors',
//                 abstract: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].Abstract && pubmedArticle.MedlineCitation[0].Article[0].Abstract[0].AbstractText || ['No Abstract'])[0],
//                 pubDate: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation[0].Article && pubmedArticle.MedlineCitation[0].Article[0].Journal && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate[0].Year && pubmedArticle.MedlineCitation[0].Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]) || 'No Date'
//             };

//             console.log("Parsed Article Details:", article);

//             // Generate summaries using GPT
//             try {
//                 const summary = await generateGPTSummary(article);
//                 console.log("Generated Summary:", summary);

//                 // Create CSV file (if needed)
//                 // const csvFilePath = path.join(__dirname, 'static', `TOE_Data_${new Date().toISOString()}.csv`);
//                 // await createCSV([article], [summary], csvFilePath);

//                 // Save document to the database (if needed)
//                 // const createdBy = req.user ? req.user.id : 'anonymous';
//                 // const document = new Document({
//                 //     link: csvFilePath,
//                 //     createdBy: createdBy
//                 // });
//                 // await document.save();

//                 // Optionally: Add document reference to the project (if needed)
//                 // const projectId = req.body.projectId;
//                 // if (projectId) {
//                 //     await Project.findByIdAndUpdate(projectId, {
//                 //         $push: { documents: document._id }
//                 //     });
//                 // }

//                 // Return the article and summary
//                 res.json({ article, summary });
//             } catch (error) {
//                 console.error('Error generating GPT summary:', error);
//                 res.status(500).json({ message: 'Error generating GPT summary.' });
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching articles:', error.response ? error.response.data : error.message);
//         res.status(500).json({ message: 'Error fetching articles.' });
//     }
// };

// const fetchArticles = async (req, res) => {
//     try {
//         const { numberOfArticles } = req.body;
//         console.log("Request Body:", req.body);

//         const searchQuery = `("nurse-led quality improvement" OR "nurse-led intervention" OR "nurse-driven quality improvement") AND ("pain management" OR "postoperative pain" OR "pain assessment" OR "pain management strategies") AND ("patient education" OR "patient care" OR "pain management protocols") AND ("purpose" OR "design and method" OR "sample" OR "variables" OR "measurement" OR "data analysis" OR "findings" OR "limitations" OR "worth of practice")`;

//         await rateLimiter.consume(1);

//         // Fetch article IDs from PubMed Central
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

//         const results = apiResponse.data.esearchresult || {};
//         console.log("Search Results:", results);

//         if (!results.idlist || !results.idlist.length) {
//             return res.status(404).json({ message: "No results found for the given query." });
//         }

//         // Fetch details for each article (for demonstration, we fetch only the first one)
//         const articleId = results.idlist[0];
//         const articleResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//             params: {
//                 db: 'pmc',
//                 id: articleId,
//                 retmode: 'xml',
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/xml'
//             }
//         });

//         // Log raw XML for debugging
//         console.log("###########################################################");
//         console.log(`Raw XML for article ID ${articleId}:`);
//         console.log(articleResponse.data);

//         // Parse XML response
//         const parser = new xml2js.Parser({ explicitArray: false });
//         parser.parseString(articleResponse.data, async (err, result) => {
//             if (err) {
//                 console.error('Error parsing XML:', err);
//                 return res.status(500).json({ message: 'Error parsing XML' });
//             }

//             // Debug parsed XML structure
//             console.log("Parsed XML Structure:", JSON.stringify(result, null, 2));

//             const pubmedArticle = result.PubmedArticleSet && result.PubmedArticleSet.PubmedArticle ? result.PubmedArticleSet.PubmedArticle[0] : {};

//             const article = {
//                 title: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation.Article && pubmedArticle.MedlineCitation.Article.ArticleTitle) || 'No Title',
//                 authors: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation.Article && pubmedArticle.MedlineCitation.Article.AuthorList && pubmedArticle.MedlineCitation.Article.AuthorList.Author || [])
//                     .map(author => `${author.LastName || ''} ${author.ForeName || ''}`)
//                     .join(', ') || 'No Authors',
//                 abstract: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation.Article && pubmedArticle.MedlineCitation.Article.Abstract && pubmedArticle.MedlineCitation.Article.Abstract.AbstractText) || 'No Abstract',
//                 pubDate: (pubmedArticle.MedlineCitation && pubmedArticle.MedlineCitation.Article && pubmedArticle.MedlineCitation.Article.Journal && pubmedArticle.MedlineCitation.Article.Journal.JournalIssue && pubmedArticle.MedlineCitation.Article.Journal.JournalIssue.PubDate && pubmedArticle.MedlineCitation.Article.Journal.JournalIssue.PubDate.Year) || 'No Date'
//             };

//             console.log("Parsed Article Details:", article);

//             // Generate summaries using GPT
//             try {
//                 const summary = await generateGPTSummary(article);
//                 console.log("Generated Summary:", summary);

//                 res.json({ article, summary });
//             } catch (error) {
//                 console.error('Error generating GPT summary:', error);
//                 res.status(500).json({ message: 'Error generating GPT summary.' });
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching articles:', error.response ? error.response.data : error.message);
//         res.status(500).json({ message: 'Error fetching articles.' });
//     }
// };

// const fetchPubmed = async (query, maxResults = 10) => {
//     try {
//         const searchQuery = `("nurse-led quality improvement" OR "nurse-led intervention" OR "nurse-driven quality improvement") AND ("pain management" OR "postoperative pain" OR "pain assessment" OR "pain management strategies") AND ("patient education" OR "patient care" OR "pain management protocols") AND ("purpose" OR "design and method" OR "sample" OR "variables" OR "measurement" OR "data analysis" OR "findings" OR "limitations" OR "worth of practice")`;
//         const esearchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
//             params: {
//                 db: 'pubmed',
//                 term: searchQuery,
//                 retmax: maxResults,
//                 rettype: 'xml',
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'application/xml'
//             }
//         });

//         const parser = new xml2js.Parser();
//         const esearchData = await parser.parseStringPromise(esearchResponse.data);
//         const idList = esearchData.eSearchResult.IdList[0].Id;

//         console.log(idList)

//         if (!idList || idList.length === 0) {
//             return [];
//         }

//         const efetchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
//             params: {
//                 db: 'pubmed',
//                 id: idList.join(','),
//                 rettype: 'medline',
//                 retmode: 'text',
//                 api_key: process.env.PUBMED_API_KEY
//             },
//             headers: {
//                 'Content-Type': 'text/plain'
//             }
//         });

//         const records = efetchResponse.data.split('\n').filter(line => line.trim() !== '');
//         const papers = records.map(record => {
//             // Parse each record according to MEDLINE format
//             const fields = record.split('\n');
//             const paperInfo = {};
//             fields.forEach(field => {
//                 const [key, ...value] = field.split(/\s+/);
//                 if (key && value.length) {
//                     paperInfo[key] = value.join(' ');
//                 }
//             });
//             return {
//                 title: paperInfo['TI'] || 'No title available',
//                 authors: paperInfo['AU'] || 'No authors available',
//                 source: paperInfo['SO'] || 'No source available',
//                 abstract: paperInfo['AB'] || 'No abstract available',
//                 url: `https://pubmed.ncbi.nlm.nih.gov/${paperInfo['PMID'] || 'No PMID available'}/`
//             };
//         });


//         console.log(papers);
//         return papers;
//     } catch (error) {
//         console.error('Error fetching PubMed data:', error.message);
//         return [];
//     }
// };

