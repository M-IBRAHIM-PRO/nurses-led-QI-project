import axios from "axios";
import React, { useState, useEffect } from "react";
import { ThreeDots } from 'react-loader-spinner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

const ViewProjectModal = ({ project, onClose }) => {
    const [numberOfArticles, setNumberOfArticles] = useState(10);
    const [searchQuery, setSearchQuery] = useState(project.searchQuery.query);
    const [gptKey, setGptKey] = useState(null);
    const [email, setEmail] = useState("");
    const [showAddCollaborator, setShowAddCollaborator] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGptKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("http://localhost:5000/api/gpt-key", {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setGptKey(response.data.key);
        } catch (error) {
            toast.error("Failed to get GPT API !", {
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            setError("Failed to fetch GPT key. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDocument = async () => {
        setLoading(true);
        setError(null);
        const userEmail = localStorage.getItem('userEmail');
        if (!gptKey) {
            setError("GPT key is not available.");
            toast.error("GPT Key not available.. Visit keys", {
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            setLoading(false);
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            setError("No token found. Please log in.");
            toast.error("No token found. Please log in", {
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            setLoading(false);
            return;
        }
        try {
            const response = await axios.post(
                "http://localhost:5000/api/generate-document",
                { projectId: project._id, userEmail, numberOfArticles, searchQuery, gptKey },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success("Document Generate Successfully !", {
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            console.log(response.data.fileLink)
            const link = document.createElement('a');
            link.href = response.data.fileLink; // Set the href to the file URL
            link.download = 'TOE.csv'; // Optionally set a default file name
            document.body.appendChild(link); // Append the link to the document
            link.click(); // Programmatically click the link to trigger the download
            document.body.removeChild(link);
        } catch (error) {
            // // setError("Failed to generate document. Please try again.");
            // toast.error(`Failed to generate document. Please try again. ${error}`, {
            //     autoClose: 2000,
            //     hideProgressBar: true,
            //     closeOnClick: true,
            // });

            if (error.response && error.response.status === 404) {
                toast.error("No papers found for the given query.", {
                    autoClose: 5000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            } else {
                toast.error(`Failed to generate document. ${error.message}`, {
                    autoClose: 5000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSearchStrategy = async (title, description) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }
            const response = await axios.post('http://localhost:5000/api/generate-search-query', { title, description }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSearchQuery(response.data.searchQuery);
        } catch (error) {
            setError('Error generating search strategy.');
        } finally {
            setLoading(false);
        }
    };

    const handleNumberOfArticlesChange = (e) => {
        const value = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
        setNumberOfArticles(value);
    };

    const handleAddCollaborator = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token found. Please log in.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/add-collaborator', { projectId: project._id, email }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(response.data.message, {
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            setEmail("");
            setShowAddCollaborator(false);
        } catch (error) {
            setError('Failed to add collaborator. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGptKey();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',  // Short month (e.g., 'Aug')
            day: '2-digit',  // Day of the month (e.g., '27')
            year: 'numeric', // Full year (e.g., '2024')
            hour: '2-digit', // 2-digit hour (e.g., '08')
            minute: '2-digit', // 2-digit minute (e.g., '16')
            hour12: true      // 12-hour clock (e.g., 'PM')
        }).format(date);
    };

    return (
        <div className="bg-white rounded-md shadow-lg p-6 max-w-4xl mx-auto">
            <ToastContainer />
            <h2 className="text-2xl font-bold mb-4">Project Details</h2>

            {/* Display loading spinner */}
            {loading && (
                <div className="flex justify-center items-center mb-4">
                    <ThreeDots
                        visible={true}
                        height="80"
                        width="80"
                        color="#999fa5"
                        radius="9"
                        ariaLabel="three-dots-loading"
                    />
                </div>
            )}



            <div className="mb-4">
                <p className="text-gray-800 text-lg font-semibold">Project Title:</p>
                <p className="text-gray-600">{project.title}</p>
            </div>

            <div className="mb-4">
                <p className="text-gray-800 text-lg font-semibold">Description:</p>
                <p className="text-gray-600">{project.description}</p>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="query" className="text-gray-800 font-medium">Search Query</label>
                    <button
                        type="button"
                        onClick={() => handleGenerateSearchStrategy(project.title, project.description)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                    >
                        Generate
                    </button>
                </div>
                <textarea
                    id="query"
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search keywords and phrases"
                    required
                />
            </div>

            {/* Collaborators Section */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">Collaborators:</h3>
                    <button
                        type="button"
                        onClick={() => setShowAddCollaborator(!showAddCollaborator)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                    >
                        {showAddCollaborator ? 'Cancel' : 'Add Collaborator'}
                    </button>
                </div>
                {showAddCollaborator && (
                    <div className="mb-4">
                        <input
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter collaborator's email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleAddCollaborator}
                            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                )}
                {project.collaborators && project.collaborators.length > 0 ? (
                    <ul className="list-disc pl-5">
                        {project.collaborators.map((collaborator) => (
                            <li key={collaborator._id} className="text-gray-700">
                                <a
                                    href={`mailto:${collaborator.email}`}
                                    className="text-blue-600 hover:underline"
                                >
                                    {collaborator.email}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No collaborators yet.</p>
                )}
            </div>

            {/* Documents Section */}
            <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Documents:</h3>
                {project.documents && project.documents.length > 0 ? (

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left border border-gray-300 bg-white">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">Document</th>
                                    <th className="px-4 py-2">Created By</th>
                                    <th className="px-4 py-2">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {project.documents.map((document, index) => (
                                    <tr key={document._id} className="border-b">
                                        <td className="px-4 py-2">
                                            <a
                                                href={document.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Document_{index + 1}
                                            </a>
                                        </td>
                                        <td className="px-4 py-2">{document.createdBy.email || 'unknown'}</td>
                                        <td className="px-4 py-2">{Date(document.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-600">No documents available.</p>
                )}
            </div>

            <div className="flex justify-end mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                    Close
                </button>
                <button
                    type="button"
                    disabled={loading}
                    onClick={handleGenerateDocument}
                    className={`ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Generate Document
                </button>
            </div>
        </div>
    );
};

export default ViewProjectModal;
