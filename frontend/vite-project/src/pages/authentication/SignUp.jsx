// SignUp.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        apiKey: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/register', formData);
            toast.success('User created successfully', {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            navigate('/login');
        } catch (error) {
            if (error.response) {
                toast.error(`Server error: ${error.response.data.message}`, {
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            } else if (error.request) {
                toast.error('No response received from the server', {
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            } else {
                toast.error(`Error setting up the request: ${error.message}`, {
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            <ToastContainer />
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                    <ThreeDots
                        visible={true}
                        height="80"
                        width="80"
                        color="#e5e7eb"
                        radius="9"
                        ariaLabel="three-dots-loading"
                    />
                </div>
            ) : (
                <div className="relative max-w-md w-full p-8 bg-gray-900 shadow-lg rounded-lg border border-gray-700">
                    <h2 className="text-3xl font-bold text-center text-gray-100 mb-6">
                        Sign Up
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                                PubMed API Key{' '}
                                <a
                                    href="https://account.ncbi.nlm.nih.gov/settings/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    (Generate key from this link)
                                </a>
                            </label>
                            <input
                                type="text"
                                id="apiKey"
                                name="apiKey"
                                value={formData.apiKey}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition duration-300 ease-in-out"
                        >
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-6 text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                            Login to account
                        </Link>.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SignUp;
