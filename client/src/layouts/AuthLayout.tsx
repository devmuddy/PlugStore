import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { hideSupportWidget } from '../utils/supportWidget';

const AuthLayout = () => {
  useEffect(() => {
    hideSupportWidget();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
