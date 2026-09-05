import React, { useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

const Messages = () => {
    // Sample Chat Conversations
    const [conversations, setConversations] = useState([
        {
            id: 1,
            name: 'Mario Plumbing Services',
            avatar: 'https://via.placeholder.com/40',
            lastMessage: 'Hi! I will arrive around 2:00 PM for the sink repair.',
            time: '10:30 AM',
            unread: true,
            online: true,
            messages: [
                { id: 101, sender: 'provider', text: 'Hello! Confirmed na po ang schedule.', time: '10:00 AM' },
                { id: 102, sender: 'user', text: 'Salamat po! Anong oras po kayo darating?', time: '10:15 AM' },
                { id: 103, sender: 'provider', text: 'Hi! I will arrive around 2:00 PM for the sink repair.', time: '10:30 AM' }
            ]
        },
        {
            id: 2,
            name: 'Cool Breeze Tech',
            avatar: 'https://via.placeholder.com/40',
            lastMessage: 'Thank you for choosing our AC cleaning service.',
            time: 'Yesterday',
            unread: false,
            online: false,
            messages: [
                { id: 201, sender: 'provider', text: 'Thank you for choosing our AC cleaning service.', time: 'Yesterday' }
            ]
        },
        {
            id: 3,
            name: 'Sparky Electricians',
            avatar: 'https://via.placeholder.com/40',
            lastMessage: 'All main breakers are checked and secure.',
            time: 'Aug 25',
            unread: false,
            online: false,
            messages: [
                { id: 301, sender: 'provider', text: 'All main breakers are checked and secure.', time: 'Aug 25' }
            ]
        }
    ]);

    const [activeChatId, setActiveChatId] = useState(1);
    const [newMessage, setNewMessage] = useState('');
    const [messageError, setMessageError] = useState('');

    const activeChat = conversations.find(c => c.id === activeChatId);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const cleanMessage = newMessage.trim();
        if (!cleanMessage || cleanMessage.length > 1000) {
            setMessageError('Enter a message between 1 and 1,000 characters.');
            return;
        }
        setMessageError('');

        const updatedConversations = conversations.map(c => {
            if (c.id === activeChatId) {
                const updatedMsgs = [
                    ...c.messages,
                    {
                        id: Date.now(),
                        sender: 'user',
                        text: cleanMessage,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ];
                return { ...c, messages: updatedMsgs, lastMessage: cleanMessage, time: 'Just now' };
            }
            return c;
        });

        setConversations(updatedConversations);
        setNewMessage('');
    };

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content Area */}
            <main className="profile-main-content">
                <header className="profile-header">
                    <h2>Messages</h2>
                </header>

                <div style={chatContainerStyle}>

                    {/* Left Panel: Contact List */}
                    <div style={sidebarListStyle}>
                        <div style={{ padding: '15px', borderBottom: '1px solid #f3f4f6' }}>
                            <input
                                type="text"
                                placeholder="Search messages..."
                                style={searchInputStyle}
                            />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {conversations.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveChatId(item.id)}
                                    style={{
                                        ...contactItemStyle,
                                        backgroundColor: item.id === activeChatId ? '#f0fdf4' : '#fff'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <div style={avatarStyle}>{item.name.charAt(0)}</div>
                                        {item.online && <span style={onlineDotStyle} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {item.name}
                                            </h5>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.time}</span>
                                        </div>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: item.unread ? '#111827' : '#6b7280', fontWeight: item.unread ? 'bold' : 'normal', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {item.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Chat Area */}
                    <div style={chatAreaStyle}>
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div style={chatHeaderStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={avatarStyle}>{activeChat.name.charAt(0)}</div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{activeChat.name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: activeChat.online ? '#10b981' : '#9ca3af' }}>
                                                {activeChat.online ? '● Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Body / Message History */}
                                <div style={chatBodyStyle}>
                                    {activeChat.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            style={{
                                                ...messageWrapperStyle,
                                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{
                                                ...messageBubbleStyle,
                                                backgroundColor: msg.sender === 'user' ? '#10b981' : '#f3f4f6',
                                                color: msg.sender === 'user' ? '#fff' : '#1f2937'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    display: 'block',
                                                    textAlign: 'right',
                                                    marginTop: '4px',
                                                    color: msg.sender === 'user' ? '#d1fae5' : '#9ca3af'
                                                }}>
                                                    {msg.time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Form */}
                                <form onSubmit={handleSendMessage} style={chatInputFormStyle}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => { setNewMessage(e.target.value); setMessageError(''); }}
                                        maxLength="1000"
                                        required
                                        style={messageInputStyle}
                                    />
                                    <button type="submit" style={sendBtnStyle}>
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                    {messageError && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{messageError}</span>}
                                </form>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af' }}>
                                Select a conversation to start messaging.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// Inline Styles
const chatContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '20px',
    height: 'calc(100vh - 160px)',
    overflow: 'hidden'
};

const sidebarListStyle = {
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column'
};

const searchInputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.85rem'
};

const contactItemStyle = {
    display: 'flex',
    gap: '12px',
    padding: '12px 15px',
    cursor: 'pointer',
    borderBottom: '1px solid #f9fafb',
    alignItems: 'center'
};

const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0
};

const onlineDotStyle = {
    width: '10px',
    height: '10px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '0',
    right: '0',
    border: '2px solid #fff'
};

const chatAreaStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa'
};

const chatHeaderStyle = {
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff'
};

const chatBodyStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const messageWrapperStyle = {
    display: 'flex'
};

const messageBubbleStyle = {
    maxWidth: '65%',
    padding: '10px 14px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const chatInputFormStyle = {
    display: 'flex',
    padding: '15px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e5e7eb',
    gap: '10px'
};

const messageInputStyle = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: '0.9rem'
};

const sendBtnStyle = {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '0 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem'
};

export default Messages;
