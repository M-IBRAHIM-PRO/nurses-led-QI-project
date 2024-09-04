const axios = require('axios');

const generateGPTSummary = async (article) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: `Based on the following article details, generate a detailed summary including the following fields:

1. Purpose
2. Design & Method
3. Sample & Settings
4. Major Variables Studied & Definitions
5. Measurement of Variables
6. Data Analysis
7. Findings
8. Limitations
9. Worth of Practice - Applicability

Article Details:
Title: ${article.title}
Authors: ${article.authors}
Abstract: ${article.abstract}
Publication Date: ${article.pubDate}`,

            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GPT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Error generating GPT summary:", error);
        throw new Error('Failed to generate GPT summary.');
    }
};

module.exports = { generateGPTSummary };
