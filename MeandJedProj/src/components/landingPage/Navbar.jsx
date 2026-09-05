import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";

function Navbar() {
    const navigate = useNavigate();
    const [recentAccounts, setRecentAccounts] = useState([]);
    const [showAccountsDropdown, setShowAccountsDropdown] = useState(false);

    // Kukunin ang mga naka-save na recent accounts mula sa LocalStorage
    useEffect(() => {
        const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
        setRecentAccounts(savedAccounts);
    }, []);

    // Handler para sa mabilisang login sa napiling account
    const handleQuickLogin = (account) => {
        alert(`Logging in as: ${account.name}`);
        setShowAccountsDropdown(false);
        navigate('/provider-auth');
    };

    // Scroll function patungo sa CTA o Hero section sa Home
    const handleGoToHomeAndRegister = () => {
        setShowAccountsDropdown(false);
        navigate('/');
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <img src={logo} alt="SmartHome Logo" />
                <div className="navbar-brand-copy">
                    <strong>SmartHome</strong>
                    <span>Service Matching</span>
                </div>
            </div>

            <ul className="navbar-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>

            <div className="navbar-buttons" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {/* Admin Button (Pinalitan ang Log in) */}
                    <button
                        className="btn btn-brand"
                        onClick={() => navigate('/admin-login')}
                    >
                        Admin
                    </button>

                    {/* Arrow Toggle Button para sa Recent Accounts */}
                    <button
                        type="button"
                        className="btn btn-brand"
                        onClick={() => setShowAccountsDropdown(!showAccountsDropdown)}
                        style={{ paddingLeft: '8px', paddingRight: '8px' }}
                    >
                        ▼
                    </button>
                </div>

                {/* Dropdown Menu ng Recent Accounts o Warning Popup */}
                {showAccountsDropdown && (
                    <div
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: '110%',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: '12px',
                            minWidth: '240px',
                            zIndex: 1000,
                            color: '#333'
                        }}
                    >
                        {recentAccounts.length > 0 ? (
                            /* KUNG MAY NAKA-SAVE NA ACCOUNT */
                            <>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Recent Accounts
                                </div>

                                {recentAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        onClick={() => handleQuickLogin(account)}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{account.name}</span>
                                        <span style={{ fontSize: '11px', color: '#777' }}>{account.email}</span>
                                    </div>
                                ))}

                                <div
                                    onClick={() => { setShowAccountsDropdown(false); navigate('/provider-auth'); }}
                                    style={{
                                        marginTop: '8px',
                                        padding: '6px',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#e65100',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Use Another Account
                                </div>
                            </>
                        ) : (
                            /* KUNG WALA PANG NAKA-SAVE NA ACCOUNT (WARNING MESSAGE) */
                            <div style={{ textAlign: 'center', padding: '6px 4px' }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚠️</div>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#d32f2f', marginBottom: '4px' }}>
                                    You don't have any account saved
                                </div>
                                <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px', lineHeight: '1.4' }}>
                                    Go to Home and select whether you want to find a service or become a provider to create one.
                                </p>
                                <button
                                    onClick={handleGoToHomeAndRegister}
                                    style={{
                                        backgroundColor: '#e65100',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}
                                >
                                    Go to Home
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;