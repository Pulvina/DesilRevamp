import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { authStart, authSuccess, authFailure } from 'redux-storage/reducers/auth';
import { AppDispatch, RootState } from 'redux-storage/store';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const authenticateWithToken = async () => {
      const token = localStorage.getItem('token')

      if (token) {
        dispatch(authStart());
        try {
          const response = await axios.get('http://localhost:3007/api/auth/authenticate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          dispatch(authSuccess(response.data));
        } catch (error: any) {
          dispatch(authFailure(error.response?.data?.message || 'Authentication failed'));

          navigate('/signin');
        }
      } else {
        navigate('/signin');
      }
      setIsCheckingAuth(false);
    };
  
    authenticateWithToken();
  }, []);

  if (isCheckingAuth || isLoading) {
    return <div className="loading-overlay">Loading...</div>;
  }

  const publicPaths = ['/signin', '/signup'];

  if (publicPaths.includes(location.pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    navigate('/signin');
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;