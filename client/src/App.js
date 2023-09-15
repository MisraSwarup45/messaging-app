import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [threads, setThreads] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/threads');
      setThreads(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const messageData = {
        sender: 'Admin',
        content: newMessage,
        reply: replyMessage,
        replyingTo: replyingTo,
      };

      await axios.post('http://localhost:3001/api/messages', messageData);
      setNewMessage('');
      setReplyMessage('');
      setReplyingTo(null);
      fetchThreads();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartReply = (threadId) => {
    setReplyingTo(threadId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyMessage('');
  };

  const filteredThreads = threads.filter((thread) =>
    thread.customerMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <h1>Messaging App</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="thread-list">
        {filteredThreads.map((thread) => (
          <div className="thread" key={thread._id}>
            <div className="customer-message">
              <strong>Customer:</strong> {thread.customerMessage}
            </div>
            {thread.adminReplies.map((reply) => (
              <div className="admin-reply" key={reply._id}>
                <strong>Admin:</strong> {reply.reply}
              </div>
            ))}
            {replyingTo === thread._id && (
              <div className="reply-form">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <button type="submit">Send</button>
                  <button onClick={handleCancelReply}>Cancel</button>
                </form>
              </div>
            )}
            <div className="reply-actions">
              {!replyingTo && (
                <button onClick={() => handleStartReply(thread._id)}>Reply</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* <div className="form-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div> */}
    </div>
  );
}

export default App;
