import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import photo from '../assets/react.svg';
import DashboardIcon from '../assets/dashboard.svg'; // Example icon
import ProjectsIcon from '../assets/project.svg';  // Example icon
import KeysIcon from '../assets/key.svg';  // Example icon
import navigationItems from '../config/SidebarMenuLinks';

const SidebarMenu = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    const navigate = useNavigate();

    const Logout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('email');
        localStorage.removeItem('token');
        console.log('User logged out successfully');
        navigate('/login');
    };

    return (
        <>
            <button
                className="fixed top-4 left-4 z-50 p-2 text-gray-500 md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <aside
                className={`fixed top-0 left-0 z-40 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-r-md transition-transform md:translate-x-0 md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:w-64 w-64`}
                aria-label="Sidebar"
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    <a href="#" className="flex items-center ps-2.5 mb-5">
                        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">ERP</span>
                    </a>

                    <div className='flex items-center ps-2.5 mb-5 gap-3'>
                        <div className='w-12 h-12'>
                            <img src={photo} alt="Profile" className='w-full h-full rounded-full object-cover' />
                        </div>
                        <div className='text-white'>
                            <div className="text-sm font-medium">{userEmail}</div>
                        </div>
                    </div>

                    <ul className="space-y-2 font-medium">
                        {userRole && navigationItems[userRole] && (
                            <>
                                {navigationItems[userRole].map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            to={item.to}
                                            className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                        >
                                            <img src={item.icon} alt={item.name} className="w-6 h-6" />
                                            <span className="ms-3">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}
                        <li>
                            <button
                                onClick={Logout}
                                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                            >
                                <svg
                                    className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 18 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                                    />
                                </svg>
                                <span className="flex-1 ms-3 whitespace-nowrap">Log out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default SidebarMenu;
