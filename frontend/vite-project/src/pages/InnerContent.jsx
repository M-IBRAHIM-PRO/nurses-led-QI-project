import { Outlet, useLocation } from 'react-router-dom';

const InnerContent = () => {
    const location = useLocation();

    // Check if the current location is SignIn or SignUp
    const isAuthenticationPage = location.pathname.includes('/login') || location.pathname.includes('/register');

    return (
        <div className={`
        ${isAuthenticationPage ? '' : 'ml-6 p-1'}`}>
            <Outlet />
        </div>
    );
};

export default InnerContent;
