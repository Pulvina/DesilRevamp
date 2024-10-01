import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { authStart, authSuccess, authFailure } from 'redux-storage/reducers/auth';
import { AppDispatch, RootState } from 'redux-storage/store';

import '../styles.scss';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { error, isLoading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const response = await axios.post('http://localhost:3007/api/auth/admin', { email, password });
      dispatch(authSuccess(response.data));
      navigate('/');
    } catch (error: any) {
      dispatch(authFailure(error.response?.data?.message || 'An error occurred'));
    }
  };

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Sign In</h2>
      <form onSubmit={handleSubmit} className="auth-form__form">
        {error && <p className="auth-form__error">{error}</p>}
        <div className="auth-form__input-group">
          <label htmlFor="email" className="auth-form__label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-form__input"
            required
          />
        </div>
        <div className="auth-form__input-group">
          <label htmlFor="password" className="auth-form__label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-form__input"
            required
          />
        </div>
        <button type="submit" className="auth-form__button" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <p className="auth-form__switch-link">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default SignIn;