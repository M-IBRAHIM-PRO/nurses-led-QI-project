import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentTextIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/solid';
import ViewProjectModal from './ViewProjectModal';
import CreateProjectModal from './CreateProjectModal';
import image from '../../assets/nodata.png'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';

const ClientProject = () => {
    const [ownedProjects, setOwnedProjects] = useState([]);
    // const [collaborativeProjects, setCollaborativeProjects] = useState([]);
    const [otherProjects, setOtherProjects] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchData, setSearchData] = useState('');
    const [filterType, setFilterType] = useState('Owned');

    const [showViewProjectModal, setShowViewProjectModal] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [contact, setContact] = useState();
    const [showContactModal, setShowContactModal] = useState(false);
    const fetchAllProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }
            const response = await axios.get('http://localhost:5000/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOwnedProjects(response.data.involvedProjects || []);
            // setCollaborativeProjects(response.data.collaboratorProjects || []);
            setOtherProjects(response.data.notInvolvedProjects || []);
            getFilteredProjects(response.data);
        } catch (error) {
            console.error('Error fetching all projects:', error);
        }
    };
    useEffect(() => {
        fetchAllProjects();
    }, []);

    useEffect(() => {
        getFilteredProjects();
    }, [filterType, ownedProjects, otherProjects]);

    const getFilteredProjects = () => {
        const projects = filterType === 'Owned' ? ownedProjects :
            filterType === 'Other' ? otherProjects : [];
        setProjects(projects);
    };

    const handleOpenCreateProjectModal = () => {
        setShowCreateProjectModal(true);
    };

    const handleCloseCreateProjectModal = () => {
        setShowCreateProjectModal(false);
    };

    const handleViewProject = (projectId) => {
        console.log(projectId)
        const project = projects.find((p) => p._id === projectId);
        setSelectedProject(project);
        setShowViewProjectModal(true);
    };

    const handleCloseViewProjectModal = () => {
        setShowViewProjectModal(false);
        fetchAllProjects();
    };

    const handleContactEmployeeClick = (email) => {
        setContact(email);
        setShowContactModal(true);
    };

    const handleCloseContactModal = () => {
        setShowContactModal(false);
    };
    const handleCreateProject = () => {
        fetchAllProjects(); // Refresh the project list
        handleCloseCreateProjectModal();
    };


    const handleRequestCollaboration = async (projectId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Please log in.');
                return;
            }

            // Make sure the URL is correct and the API route exists
            await axios.post(`http://localhost:5000/api/projects/${projectId}/request-collaboration`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // alert('Collaboration request sent!');
            toast.success(`Collaboration request sent!`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
        } catch (error) {
            console.error('Error requesting collaboration:', error.response ? error.response.data : error.message);
            toast.error(`Error requesting collaboration: ${error}`, {
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
            });
        }
    };

    return (
        <div className="w-full mx-auto mt-2 p-6 bg-white shadow-md rounded-md">
            <ToastContainer />
            <h2 className="text-2xl font-bold mb-4 text-center">Manage Projects</h2>

            <div className="text-right mb-4">
                <button
                    onClick={handleOpenCreateProjectModal}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    Create Project
                </button>
            </div>

            <div className="flex justify-around mb-4">
                <div className="p-4 bg-blue-200 rounded-md flex items-center cursor-pointer mr-6" onClick={() => setFilterType('Owned')}>
                    <UsersIcon className="h-8 w-8 mr-2" />
                    <div>
                        <h3 className="text-xl font-bold">Personal Projects</h3>
                        <p className="text-2xl font-bold">{ownedProjects.length}</p>
                    </div>
                </div>

                <div className="p-4 bg-green-200 rounded-md flex items-center cursor-pointer" onClick={() => setFilterType('Other')}>
                    <CheckCircleIcon className="h-8 w-8 mr-2" />
                    <div>
                        <h3 className="text-xl font-bold">Other Projects</h3>
                        <p className="text-2xl font-bold">{otherProjects.length}</p>
                    </div>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6">
                    <img
                        src={image}
                        alt="No Projects Found"
                        className="w-64 h-64 mb-4"
                    />
                    <p className="text-gray-600 text-lg">
                        No projects found for the selected filter.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="p-2 border rounded-md"
                            value={searchData}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="p-2 border rounded"
                        >
                            <option value="Owned">Owned Projects</option>
                            <option value="Other">Other Projects</option>
                        </select>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg w-full">
                        <table className="w-full text-sm text-left bg-white border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Project Title</th>
                                    <th scope="col" className="px-6 py-3">Owner</th>
                                    <th scope="col" className="px-6 py-3">Created At</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects
                                    .filter((project) =>
                                        searchData.toLowerCase() === '' ||
                                        project.title.toLowerCase().includes(searchData.toLowerCase())
                                    )
                                    .map((project) => (
                                        <tr key={project._id} className="bg-white border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600">
                                            <td className="px-6 py-4">{project.title}</td>
                                            <td className="px-6 py-4">{project.owner?.username || 'N/A'}</td>
                                            <td className="px-6 py-4">{project.createdAt}</td>
                                            <td className="px-6 py-4">
                                                {filterType === 'Owned' && (
                                                    <button
                                                        onClick={() => handleViewProject(project._id)}
                                                        className="mr-2 bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                                {filterType === 'Other' && (
                                                    <button
                                                        onClick={() => handleRequestCollaboration(project._id)}
                                                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                                                    >
                                                        Request Collaboration
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showCreateProjectModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                            role="dialog" aria-modal="true" aria-labelledby="modal-headline"
                        >
                            <CreateProjectModal onClose={handleCloseCreateProjectModal} onCreate={handleCreateProject} />
                        </div>
                    </div>
                </div>
            )}

            {showViewProjectModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                            role="dialog" aria-modal="true" aria-labelledby="modal-headline"
                        >
                            <ViewProjectModal onClose={handleCloseViewProjectModal} project={selectedProject} />
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ClientProject;
