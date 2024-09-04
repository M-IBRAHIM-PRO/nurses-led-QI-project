// SignIn.js
import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const localHostUrl=import.meta.env.LOCAL_URL;
const SignIn = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${apiBaseUrl}/api/login`, formData);
            console.log(response);

            toast.success(`${response.data.message}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });

            if (response.data.role === 'client') {
                navigate('/client/projects');
            }

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userRole', response.data.role);
            localStorage.setItem('userEmail', response.data.email);
        } catch (error) {
            console.error('Error while login user:', error);

            if (error.response) {
                toast.error(`Server error: ${error.response.data.message}`, {
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                });
            } else if (error.request) {
                toast.error(`No response received from the server`, {
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
        <div className="relative h-screen w-screen flex items-center justify-center bg-gray-900">
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
                <div className="relative max-w-md w-full p-8 bg-gray-800 shadow-lg rounded-lg border border-gray-700">
                    <h2 className="text-3xl font-bold text-center text-gray-100 mb-8">
                        Sign In
                    </h2>
                    <form onSubmit={handleSubmit}>
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
                                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
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
                                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-500 px-4 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-500 hover:to-blue-700 transition duration-300 ease-in-out"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="mt-6 text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-500 font-medium">
                            Create an account
                        </Link>.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SignIn;
