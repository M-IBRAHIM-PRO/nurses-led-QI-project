from flask import Flask, request, jsonify
from Bio import Entrez, Medline
import openai
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 



@app.route('/pubmed-search', methods=['POST'])
def pubmed_search():
    data = request.json
    query = data.get('query')
    email = data.get('email')
    max_results = data.get('max_results', 10)
    openai_api_key = data.get('api_key')

    print(f"Received request with data: {data}")

    if not query or not email or not openai_api_key:
        print("Error: Missing required parameters.")
        return jsonify({"error": "Query, email, and API key are required"}), 400

    # Set the OpenAI API key
    openai.api_key = openai_api_key
    Entrez.email = email

    # Fetch papers from PubMed
    try:
        papers = fetch_pubmed(query, max_results)
        print(f"Fetched {len(papers)} papers from PubMed.")
    except Exception as e:
        print(f"Error fetching papers from PubMed: {e}")
        return jsonify({"error": "Failed to fetch papers from PubMed"}), 500

    if not papers:
        print("No papers found for the given query.")
        return jsonify({"error": "No papers found for the given query"}), 404
    
    # Analyze each paper using GPT
    analyzed_papers = []
    for paper in papers:
        print(f"Analyzing paper: {paper['title']}")
        try:
            analysis = generate_chatgpt_analysis(paper)
            if analysis:
                analyzed_papers.append({
                    "Title": paper['title'],
                    "Authors": ', '.join(paper['authors']) if paper['authors'] else "No authors available",
                    "Citation (APA Format)": generate_citation_apa(paper),
                    "Purpose": extract_section(analysis, "Purpose"),
                    "Design & Method": extract_section(analysis, "Design & Method"),
                    "Sample & Settings": extract_section(analysis, "Sample & Settings"),
                    "Major Variables Studied & Definitions": extract_section(analysis, "Major Variables Studied and Definitions"),
                    "Measurement of Variables": extract_section(analysis, "Measurement"),
                    "Data Analysis": extract_section(analysis, "Data Analysis"),
                    "Findings": extract_section(analysis, "Findings"),
                    "Limitations": extract_section(analysis, "Limitations"),
                    "Worth of Practice - Applicability": extract_section(analysis, "Practical Implications"),
                    "URL": paper['url'],
                })
        except Exception as e:
            print(f"Error analyzing paper {paper['title']}: {e}")
            analyzed_papers.append({
                "Title": paper['title'],
                "Authors": ', '.join(paper['authors']) if paper['authors'] else "No authors available",
                "Citation (APA Format)": generate_citation_apa(paper),
                "Error": f"Failed to analyze paper: {e}",
                "URL": paper['url'],
            })
    
    return jsonify(analyzed_papers)

def fetch_pubmed(query, max_results=10):
    print(f"Searching PubMed for query: {query}")
    try:
        handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
        record = Entrez.read(handle)
        handle.close()
        id_list = record["IdList"]
        print(f"Found {len(id_list)} paper IDs.")
        
        if not id_list:
            print("No paper IDs found.")
            return []

        handle = Entrez.efetch(db="pubmed", id=id_list, rettype="medline", retmode="text")
        records = Medline.parse(handle)

        papers = []
        for record in records:
            paper_info = {
                "title": record.get("TI", "No title available"),
                "authors": record.get("AU", []),
                "source": record.get("SO", "No source available"),
                "abstract": record.get("AB", "No abstract available"),
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{record.get('PMID', 'No PMID available')}/",
                "publication_year": record.get("DP", "No publication year available"),
                "pmid": record.get("PMID", "No PMID available"),
            }
            papers.append(paper_info)

        print(f"Returning {len(papers)} papers.")
        return papers
    except Exception as e:
        print(f"Error while fetching PubMed data: {e}")
        raise
def generate_chatgpt_analysis(paper_info, model="gpt-4", max_tokens=300):
    # Define a prompt that instructs GPT to infer missing information
    prompt = f"""
    Please analyze the following PubMed-listed academic paper with a focus on its relevance to a nurse-led Quality Improvement (QI) project. If any of the specified fields mentioned below (like Data Analysis, Limitations, Findings, Practical Implications ) are not explicitly mentioned in the paper, use your expertise and context from the given details to make reasonable assumptions and generate content. Fill all the mentined fields

    - Purpose: What specific goal or objective is the study aiming to achieve, particularly in the context of nursing practice or healthcare improvement?
    - Design & Method: How was the research conducted, and what study design was used? Emphasize aspects relevant to healthcare settings.
    - Sample & Settings: Who were the participants, and where was the study conducted? Focus on details pertinent to nursing or clinical environments.
    - Major Variables Studied and Definitions: What were the key variables studied, and how are they defined? Highlight variables important to nursing or patient care.
    - Measurement: How were the variables measured? Consider the tools or methods used, especially those relevant to nursing practices.
    - Data Analysis: What statistical or analytical methods were used to analyze the data? If not explicitly mentioned, provide a reasonable assumption based on typical methods in similar studies.
    - Findings: What were the main results of the study? If not specified, infer plausible findings that align with the study's purpose and context.
    - Limitations: What are the limitations of the study? If not described, suggest possible limitations based on common constraints in similar studies.
    - Practical Implications: How can the findings be applied in nursing practice or to improve healthcare quality? Focus on actionable insights for nurse-led initiatives.

    Paper Details:
    - Title: {paper_info.get('title', 'N/A')}
    - Abstract: {paper_info.get('abstract', 'N/A')}
    - Authors: {', '.join(paper_info.get('authors', []))}
    - Source: {paper_info.get('source', 'N/A')}
    """

    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert research analyst tasked with analyzing academic papers."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.5,
            top_p=1.0
        )
        analysis = response.choices[0].message['content'].strip()
        print(f"Analysis for paper {paper_info.get('title', 'N/A')}: {analysis}")
        return analysis
    except Exception as e:
        print(f"Error during ChatGPT analysis: {e}")
        return None


def generate_citation_apa(paper):
    authors = ', '.join(paper['authors']) if paper['authors'] else "No authors available"
    year = paper['publication_year'] if paper['publication_year'] else "No year available"
    title = paper['title']
    source = paper['source']
    return f"{authors} ({year}). {title}. {source}."

def extract_section(text, section):
    pattern = rf"{section}:(.*?)(?=\n[A-Z]|$|(?=\n\s*-\s*[A-Z]))"
    match = re.search(pattern, text, re.DOTALL)
    result = match.group(1).strip() if match else "N/A"
    print(f"Extracted section '{section}': {result}")
    return result

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)