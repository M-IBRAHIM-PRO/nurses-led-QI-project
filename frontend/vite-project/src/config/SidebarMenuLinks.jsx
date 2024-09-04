import DashboardIcon from '../assets/dashboard.svg'; // Example icon
import ProjectsIcon from '../assets/project.svg';  // Example icon
import KeysIcon from '../assets/key.svg';  // Example icon

export const navigationItems = {
    // admin: [
    //     {
    //         name: 'Dashboard',
    //         to: '/admin/dashboard',
    //         text: '',
    //     },
    //     {
    //         name: 'Manage Projects',
    //         to: '/admin/projects',
    //         text: '',

    //     },
    //     {
    //         name: 'Manage Clients',
    //         to: '/admin/clients',
    //         text: ''
    //     },
    //     {
    //         name: 'Manage Employees',
    //         to: '/admin/employees',
    //         text: ''
    //     },
       
    // ],
    client: [
        
        {
            name: 'Projects',
            to: '/client/projects',
            text: '',
            icon: ProjectsIcon

        },
        {
            name: 'Keys',
            to: '/client/keys',
            text: '',
            icon: KeysIcon   
        },
    ],
    // employee: [
    //     {
    //         name: 'Dashboard',
    //         to: '/employee/dashboard',
    //         text: '',
    //     },
    //     {
    //         name: 'Projects',
    //         to: '/employee/projects',
    //         text: '',

    //     },
    //     {
    //         name: 'Contact',
    //         to: '/employee/contact',
    //         text: ''
    //     },
    //     {
    //         name: 'Report Bugs',
    //         to: '/employee/bugs',
    //         text: ''
    //     },
    // ],
}
export default navigationItems