const  parse  = require('json2csv');
const fs = require('fs');

const createCSV = async (articles, summaries, filePath) => {
    try {
        const data = articles.map((article, index) => ({
            Number: index + 1,
            Title: article.title,
            Author: article.authors.join(', '),
            PubMed_URL: `https://pubmed.ncbi.nlm.nih.gov/${article.id}`,
            Citation: generateCitation(article), // Create a function to format APA citation
            Purpose: summaries[index].Purpose,
            'Design & Method': summaries[index]['Design & Method'],
            'Sample & Settings': summaries[index]['Sample & Settings'],
            'Major Variables Studied & Definitions': summaries[index]['Major Variables Studied & Definitions'],
            'Measurement of Variables': summaries[index]['Measurement of Variables'],
            'Data Analysis': summaries[index]['Data Analysis'],
            Findings: summaries[index].Findings,
            Limitations: summaries[index].Limitations,
            'Worth of Practice - Applicability': summaries[index]['Worth of Practice - Applicability']
        }));

        const csv = parse(data);
        fs.writeFileSync(filePath, csv);
    } catch (error) {
        console.error("Error creating CSV file:", error);
        throw new Error('Failed to create CSV file.');
    }
};

const generateCitation = (article) => {
    // Implement APA citation formatting here
    return `${article.authors.join(', ')} (${article.pubDate}). ${article.title}. Retrieved from https://pubmed.ncbi.nlm.nih.gov/${article.id}`;
};

module.exports = { createCSV };
