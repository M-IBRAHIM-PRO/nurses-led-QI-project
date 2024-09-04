import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditIcon from '../../assets/edit-icon.svg';
import SaveIcon from '../../assets/save-icon.svg';
import CancelIcon from '../../assets/cancel-icon.svg';
import AddIcon from '../../assets/add-icon.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const localHostUrl=import.meta.env.LOCAL_URL;

const KeyManagement = () => {
    const [loading, setLoading] = useState(true);

    const [gptKey, setGptKey] = useState('');
    const [pubMedKey, setPubMedKey] = useState('');

    const [isEditingGpt, setIsEditingGpt] = useState(false);
    const [isEditingPubMed, setIsEditingPubMed] = useState(false);

    const [newGptKey, setNewGptKey] = useState('');
    const [newPubMedKey, setNewPubMedKey] = useState('');

    useEffect(() => {
        setLoading(true);

        fetchGptKey();
        fetchPubMedKey();

        setLoading(false);
    }, []);

    const fetchGptKey = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }
            const response = await axios.get(`${apiBaseUrl}/api/gpt-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // console.log(response.data.key); // Direct access to the key
            setGptKey(response.data.key);
        } catch (error) {
            handleError(error);
        }
    };

    const fetchPubMedKey = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }
            const response = await axios.get(`${apiBaseUrl}/api/pubmed-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPubMedKey(response.data.key);
        } catch (error) {
            handleError(error);
        }
    };

    const handleError = (error) => {
        console.error('An error occurred:', error);
        if (error.response) {
            toast.error(`Server error: ${error.response.data.message || 'An unexpected server error occurred'}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            // alert(`Server error: ${error.response.data.message || 'An unexpected server error occurred'}`);
        } else if (error.request) {
            toast.error('No response received from the server', {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            // alert('No response received from the server');
        } else {
            toast.error(`Error setting up the request: ${error.message}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
            // alert(`Error setting up the request: ${error.message}`);
        }
    };

    const handleEditGptClick = () => {
        setIsEditingGpt(true);
        setNewGptKey(gptKey);
    };

    const handleEditPubMedClick = () => {
        setIsEditingPubMed(true);
        setNewPubMedKey(pubMedKey);
    };

    const handleChangeGpt = (e) => setNewGptKey(e.target.value);
    const handleChangePubMed = (e) => setNewPubMedKey(e.target.value);

    const handleGptSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }

            const response = !gptKey
                ? await axios.post(`${apiBaseUrl}/api/gpt-key`, { key: newGptKey }, { headers: { 'Authorization': `Bearer ${token}` } })
                : await axios.put(`${apiBaseUrl}/api/gpt-key`, { key: newGptKey }, { headers: { 'Authorization': `Bearer ${token}` } });

            setGptKey(newGptKey);
            setIsEditingGpt(false);
            // alert(response.data.message || 'GPT key updated successfully');
            toast.success(`${response.data.message} || 'GPT key updated successfully'`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
        } catch (error) {
            handleError(error);
        }
        finally {
            setLoading(false);
        }
    };

    const handlePubMedSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }

            const response = !gptKey
                ? await axios.post(`${apiBaseUrl}/api/pubmed-key`, { key: newPubMedKey }, { headers: { 'Authorization': `Bearer ${token}` } })
                : await axios.put(`${apiBaseUrl}/api/pubmed-key`, { key: newPubMedKey }, { headers: { 'Authorization': `Bearer ${token}` } });

            setPubMedKey(newPubMedKey);
            setIsEditingPubMed(false);
            // alert(response.data.message || 'PubMed key updated successfully');
            toast.success(`${response.data.message} || 'PubMed key updated successfully'`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
        } catch (error) {
            handleError(error);
        }
        finally {
            setLoading(false);
        }
    };

    const maskKey = (key) => {
        if (key.length <= 6) return key;
        const firstPart = key.slice(0, 3);
        const lastPart = key.slice(-3);
        const maskedPart = '*'.repeat(key.length - 6);
        return `${firstPart}${maskedPart}${lastPart}`;
    };
    return (
        <div className="relative w-full mt-6 p-6 bg-white shadow-md rounded-md">
            {loading && (
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
            )}

            <h2 className="text-2xl font-bold mb-2 text-center">Manage Keys</h2>
            <div className="text-red-500 text-xs text-center mb-4">[Do not share with others]</div>

            {/* GPT Key Section */}
            <div className="mb-6">
                {isEditingGpt ? (
                    <form onSubmit={handleGptSubmit}>
                        <div className="mb-4 flex items-center">
                            <label htmlFor="gpt-key" className="min-w-[100px] text-sm font-medium text-gray-600">GPT Key</label>
                            <input
                                type="password"
                                id="gpt-key"
                                value={newGptKey}
                                onChange={handleChangeGpt}
                                className="mt-1 p-2 border rounded-md flex-1 min-w-[400px] user-select-none"
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                            >
                                <img src={SaveIcon} alt="Save" className="w-5 h-5 mr-2" />
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditingGpt(false)}
                                className="ml-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
                            >
                                <img src={CancelIcon} alt="Cancel" className="w-5 h-5 mr-2" />
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">GPT Key</h3>
                        <div className="flex items-center mb-4">
                            {gptKey ? (
                                <>
                                    <p className="flex-1 text-gray-700 text-base font-medium truncate">
                                        <strong>{maskKey(gptKey)}</strong>
                                    </p>
                                    <button
                                        onClick={handleEditGptClick}
                                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition duration-200"
                                    >
                                        <img src={EditIcon} alt="Edit" className="w-5 h-5 mr-2" />
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <div className="flex justify-center mb-4">
                                    <button
                                        onClick={handleEditGptClick}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                                    >
                                        <img src={AddIcon} alt="Add GPT Key" className="w-5 h-5 mr-2" />
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* PubMed Key Section */}
            <div>
                {isEditingPubMed ? (
                    <form onSubmit={handlePubMedSubmit}>
                        <div className="mb-4 flex items-center">
                            <label htmlFor="pubmed-key" className="min-w-[100px] text-sm font-medium text-gray-600">PubMed Key</label>
                            <input
                                type="password"
                                id="pubmed-key"
                                value={newPubMedKey}
                                onChange={handleChangePubMed}
                                className="mt-1 p-2 border rounded-md flex-1 min-w-[400px] user-select-none"
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                            >
                                <img src={SaveIcon} alt="Save" className="w-5 h-5 mr-2" />
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditingPubMed(false)}
                                className="ml-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
                            >
                                <img src={CancelIcon} alt="Cancel" className="w-5 h-5 mr-2" />
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">PubMed Key</h3>
                        <div className="flex items-center mb-4">
                            {pubMedKey ? (
                                <>
                                    <p className="flex-1 text-gray-700 text-base font-medium truncate">
                                        <strong>{maskKey(pubMedKey)}</strong>
                                    </p>
                                    <button
                                        onClick={handleEditPubMedClick}
                                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition duration-200"
                                    >
                                        <img src={EditIcon} alt="Edit" className="w-5 h-5 mr-2" />
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <div className="flex justify-center mb-4">
                                    <button
                                        onClick={handleEditPubMedClick}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
                                    >
                                        <img src={AddIcon} alt="Add PubMed Key" className="w-5 h-5 mr-2" />
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeyManagement;
