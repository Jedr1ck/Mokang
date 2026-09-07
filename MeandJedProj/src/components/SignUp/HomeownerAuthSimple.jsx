import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../index.css';
import background from '../../assets/images/hero-background.png';

const HomeownerAuthSimple = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        age: '',
        gender: '',
        location: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRegisterSubmit = (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Hindi nagtutugma ang Password at Confirm Password.');
            return;
        }

        if (!formData.agreeTerms) {
            alert('Paki-sang-ayunan ang Terms and Conditions.');
            return;
        }

        setPasswordError('');
        const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
        const account = {
            id: Date.now(),
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            age: formData.age,
            gender: formData.gender,
            location: formData.location,
            password: formData.password,
            role: 'homeowner'
        };

        localStorage.setItem('savedAccounts', JSON.stringify([...savedAccounts, account]));
        localStorage.setItem('user', JSON.stringify(account));
        alert('Matagumpay ang iyong Registration bilang Homeowner!');
        navigate('/homeowner-dashboard');
    };

    const handleLoginSubmit = (event) => {
        event.preventDefault();
        const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
        const account = savedAccounts.find(
            (savedAccount) => savedAccount.email?.toLowerCase() === loginEmail.trim().toLowerCase()
        );

        if (!account || account.password !== loginPassword) {
            alert('Maling email o password. Pakisubukan ulit.');
            return;
        }

        localStorage.setItem('user', JSON.stringify(account));
        navigate('/homeowner-dashboard');
    };

    const toggleForm = () => {
        setIsSignUp((previous) => !previous);
        setPasswordError('');
    };

    return (
        <div
            className="auth-body d-flex justify-content-center align-items-center"
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
                <div className="form-container sign-up-container">
                    <form onSubmit={handleRegisterSubmit} className="d-flex flex-column align-items-center justify-content-center h-100 px-4 text-center">
                        <h2 className="fw-bold mb-2 theme-text">Create Account</h2>
                        <span className="small text-muted mb-2">or use your details for homeowner registration:</span>
                        <input className="form-control bg-light border-0 mb-2" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                        <input className="form-control bg-light border-0 mb-2" type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                        <input className="form-control bg-light border-0 mb-2" type="number" name="age" placeholder="Age" min="1" max="120" value={formData.age} onChange={handleChange} required />
                        <select className="form-select bg-light border-0 mb-2" name="gender" value={formData.gender} onChange={handleChange} required>
                            <option value="" disabled>Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        <input className="form-control bg-light border-0 mb-2" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
                        <input className="form-control bg-light border-0 mb-2" type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <input className="form-control bg-light border-0 mb-2" type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                        {passwordError && <div className="text-danger small mb-1">{passwordError}</div>}
                        <div className="form-check mb-3 text-start w-100">
                            <input className="form-check-input" type="checkbox" id="homeownerTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} required />
                            <label className="form-check-label small text-muted" htmlFor="homeownerTerms">I agree to the Terms and Conditions</label>
                        </div>
                        <button type="submit" className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white">Sign up</button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form onSubmit={handleLoginSubmit} className="d-flex flex-column align-items-center justify-content-center h-100 px-5 text-center">
                        <h1 className="fw-bold mb-3 theme-text">Log in</h1>
                        <span className="small text-muted mb-3">or use your homeowner account:</span>
                        <input className="form-control bg-light border-0 mb-3" type="email" placeholder="Email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
                        <input className="form-control bg-light border-0 mb-4" type="password" placeholder="Password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
                        <button type="submit" className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white">Log in</button>
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <h1 className="fw-bold text-white mb-3">Welcome Back!</h1>
                            <p className="text-white opacity-75 mb-4">To keep connected with us please login with your personal info.</p>
                            <button type="button" className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold" onClick={toggleForm}>Log in</button>
                        </div>
                        <div className="overlay-panel overlay-right d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <h1 className="fw-bold text-white mb-3">Hello, Friend!</h1>
                            <p className="text-white opacity-75 mb-4">Enter your personal details and start your journey with us.</p>
                            <button type="button" className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold" onClick={toggleForm}>SIGN UP</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeownerAuthSimple;
