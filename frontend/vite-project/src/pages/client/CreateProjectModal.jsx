import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';

const CreateProjectModal = ({ onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const response = await axios.post('http://localhost:5000/api/create-project', {
                title,
                description,
                searchQuery: {
                    query,
                },

            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(response.data);
            // alert(response.data.message);
            toast.success(`${response.data.message}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            onCreate();
            onClose();
        } catch (error) {
            console.error('Error creating project:', error);
            // alert('Failed to create project');
            toast.success(`Failed to create project : ${error}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleGenerateSearchStrategy = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }
            const response = await axios.post('http://localhost:5000/api/generate-search-query', {
                title,
                description,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rawQuery = response.data.searchQuery;
            setQuery(rawQuery);
        } catch (error) {
            console.error('Error generating search strategy:', error);
            alert('Error generating search strategy');
        }
    };

    // const formatSearchQuery = (query) => {
    //     return query
    //         .split('AND')
    //         .map(part => part.trim())
    //         .map(part => `(${part.replace(/(,|\sOR\s)/g, ' OR ')})`)
    //         .join(' AND ');
    // };

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
    };

    return (
        <div className="relative mx-auto mt-6 p-6 bg-white shadow-md rounded-md max-w-md">
            <ToastContainer />
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
                    <ThreeDots
                        visible={true}
                        height="80"
                        width="80"
                        color="#999fa5"
                        radius="9"
                        ariaLabel="three-dots-loading"
                    />
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-4 text-center">Project Proposal</h2>
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-600">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="mt-1 p-2 w-full border rounded-md"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-600">
                                Description
                            </label>
                            <textarea
                                id="description"
                                className="mt-1 p-2 w-full border rounded-md"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="query" className="block text-sm font-medium text-gray-600">
                                    Search Query
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateSearchStrategy}
                                    className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600"
                                >
                                    Generate
                                </button>
                            </div>
                            <textarea
                                id="query"
                                className="mt-1 p-2 w-full border rounded-md"
                                value={query}
                                onChange={handleQueryChange}
                                placeholder="Enter search keywords and phrases"
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-2"
                            >
                                Post Project
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default CreateProjectModal;
