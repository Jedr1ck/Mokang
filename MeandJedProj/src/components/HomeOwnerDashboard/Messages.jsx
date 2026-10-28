import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import {
    getMessages,
    getMyBookings,
    getPresence,
    sendMessage
} from '../../services/api';

const Messages = ({ embedded = false, bookings }) => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = Number(currentUser.id);
    const currentUserRole = currentUser.role;
    const [loadedBookings, setLoadedBookings] = useState([]);
    const bookingRows = bookings ?? loadedBookings;
    const [messageRows, setMessageRows] = useState([]);
    const [presenceByUserId, setPresenceByUserId] = useState({});
    const [presenceLoaded, setPresenceLoaded] = useState(false);
    const [presenceError, setPresenceError] = useState('');
    const [activeChatId, setActiveChatId] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [messageError, setMessageError] = useState('');

    useEffect(() => {
        let isCurrent = true;
        const loadMessages = () => {
            getMessages()
                .then((rows) => {
                    if (isCurrent) setMessageRows(rows);
                })
                .catch((error) => {
                    if (isCurrent) setMessageError(error.message);
                });
            getPresence()
                .then((rows) => {
                    if (isCurrent) {
                        setPresenceByUserId(
                            Object.fromEntries(
                                rows.map((row) => [Number(row.userId), row.online === true])
                            )
                        );
                        setPresenceLoaded(true);
                        setPresenceError('');
                    }
                })
                .catch((error) => {
                    if (isCurrent) {
                        setPresenceLoaded(false);
                        setPresenceError(error.message || 'Unable to check online status.');
                    }
                });
        };

        loadMessages();
        const intervalId = window.setInterval(loadMessages, 5000);
        return () => {
            isCurrent = false;
            window.clearInterval(intervalId);
        };
    }, [currentUserId]);

    useEffect(() => {
        if (bookings !== undefined) return;

        getMyBookings()
            .then(setLoadedBookings)
            .catch((error) => setMessageError(error.message));
    }, [bookings]);

    const conversations = useMemo(() => {
        const grouped = new Map();
        const isHomeowner = currentUserRole === 'homeowner';
        const conversationFor = (recipientId, name, profilePicture, bookingId) => {
            const id = Number(recipientId);
            if (!id) return null;

            const conversation = grouped.get(id) || {
                id,
                recipientId: id,
                name: name || 'User',
                profilePicture: profilePicture || '',
                online: presenceByUserId[id] === true,
                bookingId: bookingId ?? null,
                lastMessage: 'No messages yet — start the conversation.',
                time: '',
                messages: []
            };
            if (!conversation.profilePicture && profilePicture) {
                conversation.profilePicture = profilePicture;
            }
            if (!conversation.bookingId && bookingId) {
                conversation.bookingId = bookingId;
            }
            grouped.set(id, conversation);
            return conversation;
        };

        bookingRows.forEach((booking) => {
            if (isHomeowner) {
                if (booking.providerUserId) {
                    conversationFor(
                        booking.providerUserId,
                        booking.providerName,
                        booking.providerProfilePicture,
                        booking.id
                    );
                }
            } else if (Number(booking.providerUserId) === currentUserId) {
                conversationFor(
                    booking.homeownerId,
                    booking.customerName,
                    booking.customerProfilePicture,
                    booking.id
                );
            }
        });

        messageRows.forEach((row) => {
            const isSender = Number(row.senderId) === currentUserId;
            const conversation = conversationFor(
                isSender ? row.recipientId : row.senderId,
                isSender ? row.recipientName : row.senderName,
                isSender
                    ? row.recipientProfilePicture
                    : row.senderProfilePicture,
                row.bookingId
            );
            if (!conversation) return;

            const time = new Date(row.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            conversation.messages.push({
                id: row.id,
                senderId: Number(row.senderId),
                text: row.body,
                time
            });
            conversation.lastMessage = row.body;
            conversation.time = time;
        });

        return [...grouped.values()];
    }, [bookingRows, currentUserRole, currentUserId, messageRows, presenceByUserId]);

    const activeChat =
        conversations.find((conversation) => conversation.id === activeChatId) ||
        conversations[0] ||
        null;
    const activeBooking = activeChat?.bookingId
        ? bookingRows.find(
            (booking) => Number(booking.id) === Number(activeChat.bookingId)
        )
        : null;

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!activeChat) return;

        const cleanMessage = newMessage.trim();
        if (!cleanMessage || cleanMessage.length > 1000) {
            setMessageError('Enter a message between 1 and 1,000 characters.');
            return;
        }
        setMessageError('');

        try {
            const result = await sendMessage(
                activeChat.recipientId,
                cleanMessage,
                activeChat.bookingId
            );
            setMessageRows((previousRows) => [
                ...previousRows,
                {
                    id: result.id,
                    senderId: currentUserId,
                    recipientId: activeChat.recipientId,
                    bookingId: result.bookingId,
                    body: cleanMessage,
                    createdAt: result.createdAt,
                    senderName: currentUser.fullName,
                    recipientName: activeChat.name
                }
            ]);
            setNewMessage('');
        } catch (error) { setMessageError(error.message); }
    };

    return (
        <div className={embedded ? 'messages-embedded' : 'profile-page-container'}>
            {/* Sidebar */}
            {!embedded && <HomeownerSideBar />}

            {/* Main Content Area */}
            <main className={embedded ? 'messages-embedded-main' : 'profile-main-content'} style={embedded ? { width: '100%', padding: 0 } : undefined}>
                <header className="profile-header">
                    <h2>Messages</h2>
                </header>

                <div style={embedded ? { ...chatContainerStyle, marginTop: 0, height: 'calc(100vh - 210px)' } : chatContainerStyle}>

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
                                        backgroundColor: item.id === activeChat?.id ? '#f0fdf4' : '#fff'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                    {item.profilePicture ? (
                                        <img
                                            src={item.profilePicture}
                                            alt={`${item.name} profile`}
                                            style={{ ...avatarStyle, objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={avatarStyle}>{item.name.charAt(0)}</div>
                                    )}
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
                            {conversations.length === 0 && (
                                <p style={{ padding: '16px', color: '#6b7280', fontSize: '0.85rem' }}>
                                    {currentUserRole === 'provider'
                                        ? 'Homeowner conversations will appear here for your assigned bookings.'
                                        : 'Provider conversations will appear here after a provider is assigned to a booking.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Chat Area */}
                    <div style={chatAreaStyle}>
                        {messageError && (
                            <p role="alert" style={{ margin: 0, padding: '8px 16px', color: '#dc2626', backgroundColor: '#fef2f2' }}>
                                {messageError}
                            </p>
                        )}
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div style={chatHeaderStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {activeChat.profilePicture ? (
                                            <img
                                                src={activeChat.profilePicture}
                                                alt={`${activeChat.name} profile`}
                                                style={{ ...avatarStyle, objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={avatarStyle}>{activeChat.name.charAt(0)}</div>
                                        )}
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{activeChat.name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: activeChat.online ? '#10b981' : '#9ca3af' }}>
                                                {presenceError
                                                    ? 'Status unavailable'
                                                    : !presenceLoaded
                                                        ? 'Checking status...'
                                                        : activeChat.online
                                                            ? '● Online'
                                                            : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                    {currentUserRole === 'homeowner' && activeBooking && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate('/track-booking', {
                                                    state: { booking: activeBooking }
                                                })
                                            }
                                            style={trackingButtonStyle}
                                        >
                                            Track booking
                                        </button>
                                    )}
                                </div>

                                {/* Chat Body / Message History */}
                                <div style={chatBodyStyle}>
                                    {activeChat.messages.length === 0 && (
                                        <p style={{ margin: 'auto', color: '#6b7280', textAlign: 'center' }}>
                                            No messages yet. Send a message to start talking about this booking.
                                        </p>
                                    )}
                                    {activeChat.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            style={{
                                                ...messageWrapperStyle,
                                                justifyContent: msg.senderId === currentUserId ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{
                                                ...messageBubbleStyle,
                                                backgroundColor: msg.senderId === currentUserId ? '#10b981' : '#f3f4f6',
                                                color: msg.senderId === currentUserId ? '#fff' : '#1f2937'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    display: 'block',
                                                    textAlign: 'right',
                                                    marginTop: '4px',
                                                    color: msg.senderId === currentUserId ? '#d1fae5' : '#9ca3af'
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
                                    <button type="submit" style={sendBtnStyle} aria-label="Send message">
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px', color: '#6b7280', textAlign: 'center' }}>
                                {messageError
                                    ? 'Unable to load messages. Please try again later.'
                                    : currentUserRole === 'provider'
                                        ? 'No homeowner conversations yet. Assigned booking contacts will appear here.'
                                        : 'No provider conversations yet. Once a provider is assigned to your booking, you can message them here.'}
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
    minHeight: 0,
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
    backgroundColor: '#fafafa',
    minHeight: 0,
    height: '100%'
};

const chatHeaderStyle = {
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
};

const trackingButtonStyle = {
    border: '1px solid #10b981',
    borderRadius: '6px',
    padding: '7px 12px',
    backgroundColor: '#fff',
    color: '#047857',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer'
};

const chatBodyStyle = {
    flex: 1,
    minHeight: 0,
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
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e5e7eb',
    gap: '10px',
    flexShrink: 0
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
