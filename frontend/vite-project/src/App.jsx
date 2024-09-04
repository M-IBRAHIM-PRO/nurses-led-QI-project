import React, { useEffect, useState } from 'react';
import SidebarMenu from './components/SidebarMenu';
import MainRoutes from './Routes';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole');
    console.log('Stored User Role:', storedUserRole);

    if (storedUserRole) {
      setUser({ role: storedUserRole });
    } else {
      console.log('Error while fetching user role');
    }
  }, []);

  return (
    <div className='flex'>
      {user && <SidebarMenu />} {/* Render SidebarMenu only when the user is logged in */}
      <MainRoutes />
    </div>
  );
}

export default App;
