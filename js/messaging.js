// Messaging System for DeniFinder

class MessagingSystem {
    constructor() {
        this.currentUser = null;
        this.conversations = [];
        this.activeConversation = null;
        this.unreadCount = 0;
        this.unsubscribeMessages = null; // To hold the listener's unsubscribe function
    }

    async init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.loadConversations();
        // Real-time updates are now handled by listeners set on conversation open
        const urlParams = new URLSearchParams(window.location.search);
        const convoId = urlParams.get('conversationId');
        if (convoId) {
            await this.loadConversationById(convoId);
        }
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('deniFinderCurrentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            // Standardize the user ID property to 'id' for consistency within the messaging system
            if (this.currentUser.uid && !this.currentUser.id) {
                this.currentUser.id = this.currentUser.uid;
            }
            // Add a default avatar if one isn't present for the current user
            if (!this.currentUser.avatar) {
                this.currentUser.avatar = 'images/deniM.png'; // A default placeholder for the current user
            }
        } else {
            // Handle case where user isn't logged in
            alert('You must be logged in to view messages.');
            window.location.href = 'signin.html';
        }
    }

    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Send button
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Conversation list
        const conversationList = document.getElementById('conversationList');
        if (conversationList) {
            conversationList.addEventListener('click', (e) => {
                if (e.target.closest('.conversation-item')) {
                    const conversationId = e.target.closest('.conversation-item').dataset.conversationId;
                    this.openConversation(conversationId);
                }
            });
        }

        // New message button
        const newMessageBtn = document.getElementById('newMessageBtn');
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', () => {
                this.showNewMessageModal();
            });
        }
    }

    async loadConversations() {
        try {
            // In a real app, this would fetch from Firestore
            const conversations = await this.fetchConversations();
            this.conversations = conversations;
            this.displayConversations();
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    async fetchConversations() {
        if (!this.currentUser) return [];

        try {
            const db = firebase.firestore();
            const conversationsSnapshot = await db.collection('conversations')
                .where('participants', 'array-contains', this.currentUser.id)
                .orderBy('lastTimestamp', 'desc')
                .get();

            if (conversationsSnapshot.empty) {
                return [];
            }

            const conversationsPromises = conversationsSnapshot.docs.map(async (doc) => {
                const conversationData = doc.data();
                const conversationId = doc.id;
                const otherParticipantId = conversationData.participants.find(id => id !== this.currentUser.id);

                if (!otherParticipantId) return null;

                const userDoc = await db.collection('users').doc(otherParticipantId).get();
                const userData = userDoc.exists ? userDoc.data() : { displayName: 'Unknown User', avatar: 'images/deniM.png' };

                let propertyData = { title: 'No property specified', image: 'images/deniM.png' };
                if (conversationData.propertyId) {
                    const propertyDoc = await db.collection('properties').doc(conversationData.propertyId).get();
                    if (propertyDoc.exists) {
                        const pData = propertyDoc.data();
                        propertyData = {
                            id: propertyDoc.id,
                            title: pData.title,
                            image: (pData.images && pData.images[0]) ? pData.images[0] : 'images/deniM.png'
                        };
                    }
                }
                
                return {
                    id: conversationId,
                participants: [
                        { id: this.currentUser.id, name: this.currentUser.displayName || 'Me', avatar: this.currentUser.avatar || 'images/deniM.png' },
                        { id: otherParticipantId, name: userData.displayName || 'User', avatar: userData.avatarUrl || userData.avatar || 'images/deniM.png' }
                ],
                lastMessage: {
                        text: conversationData.lastMessage || '...',
                        timestamp: conversationData.lastTimestamp.toDate(),
                    },
                    property: propertyData,
                    unreadCount: conversationData.unreadCounts ? (conversationData.unreadCounts[this.currentUser.id] || 0) : 0
                };
            });

            const resolvedConversations = await Promise.all(conversationsPromises);
            return resolvedConversations.filter(c => c !== null);

        } catch (error) {
            console.error("Error fetching conversations from Firestore:", error);
            this.showError("Could not load conversations.");
            return [];
        }
    }

    displayConversations() {
        const conversationList = document.getElementById('conversationList');
        if (!conversationList) return;

        if (this.conversations.length === 0) {
            conversationList.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                    <button onclick="messagingSystem.showNewMessageModal()" class="btn-primary">
                        Start a Conversation
                    </button>
                </div>
            `;
            return;
        }

        conversationList.innerHTML = this.conversations.map(conversation => 
            this.createConversationItem(conversation)
        ).join('');
    }

    createConversationItem(conversation) {
        const otherParticipant = conversation.participants.find(p => p.id !== this.currentUser.id);
        const isActive = this.activeConversation && this.activeConversation.id === conversation.id;
        const unreadClass = conversation.unreadCount > 0 ? 'unread' : '';

        return `
            <div class="conversation-item ${isActive ? 'active' : ''} ${unreadClass}" 
                 data-conversation-id="${conversation.id}">
                <div class="conversation-avatar">
                    <img src="${conversation.property.image}" alt="${conversation.property.title}">
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <h4>${otherParticipant.name}</h4>
                        <span class="conversation-time">${this.formatTime(conversation.lastMessage.timestamp)}</span>
                    </div>
                    <p class="conversation-property">${conversation.property.title}</p>
                    <p class="conversation-preview">${conversation.lastMessage.text}</p>
                    ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
    }

    getOtherParticipant(conversation) {
        return conversation.participants.find(p => p.id !== this.currentUser.id);
    }

    async openConversation(conversationId) {
        try {
            const conversation = this.conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            this.activeConversation = conversation;
            this.markConversationAsRead(conversationId);

            // Detach any existing listener before starting a new one
            if (this.unsubscribeMessages) {
                this.unsubscribeMessages();
            }
            this.startMessagesListener(conversationId); // Replaces loadMessages

            this.updateConversationUI();

            // Update chat header with selected user's info
            const otherParticipant = this.getOtherParticipant(conversation);
            const chatUserName = document.getElementById('chatUserName');
            const chatUserAvatar = document.getElementById('chatUserAvatar');
            const chatUserStatus = document.getElementById('chatUserStatus');

            if (otherParticipant) {
                chatUserName.textContent = otherParticipant.name;
                chatUserAvatar.src = otherParticipant.avatar || 'images/deniM.png';
                chatUserStatus.textContent = 'Online'; // Replace with real status later
                chatUserStatus.className = 'online';
            }
        } catch (error) {
            console.error('Error opening conversation:', error);
        }
    }

    async loadConversationById(convoId) {
        // Load conversation from Firestore
        if (!window.DeniFinderFirebase || !window.DeniFinderFirebase.dbService) return;
        const convoResult = await window.DeniFinderFirebase.dbService.getDocument('conversations', convoId);
        if (!convoResult.success) return;
        const convo = convoResult.data;
        this.activeConversation = { id: convoId, ...convo };
        // Load user info for participants
        const currentUser = JSON.parse(localStorage.getItem('deniFinderCurrentUser'));
        const otherUserId = convo.participants.find(uid => uid !== currentUser.uid);
        let otherUser = { displayName: 'User', avatar: 'images/deniM.png' };
        if (otherUserId) {
            const userResult = await window.DeniFinderFirebase.dbService.getDocument('users', otherUserId);
            if (userResult.success) {
                otherUser = userResult.data;
            }
        }
        // Update chat header
        document.getElementById('chatUserName').textContent = otherUser.displayName || 'User';
        document.getElementById('chatUserAvatar').src = otherUser.avatarUrl || otherUser.avatar || 'images/deniM.png';
        document.getElementById('chatUserStatus').textContent = otherUser.email || '';
        
        // Use the real-time listener for messages
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
        this.startMessagesListener(convoId);
    }

    // REMOVED loadMessages and fetchMessages as they are replaced by the real-time listener

    displayMessages(messages) {
        const messagesContainer = document.getElementById('messagesList');
        if (!messagesContainer) return;

        if (messages.length === 0) {
            messagesContainer.innerHTML = `<div class="empty-state"><i class="fas fa-comment-dots"></i><h3>No messages yet</h3><p>Send a message to start the conversation.</p></div>`;
            return;
        }

        messagesContainer.innerHTML = messages.map(message => 
            this.createMessageItem(message)
        ).join('');

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageItem(message) {
        if (message.type === 'property') {
            return this.createPropertyCard(message);
        }
        const isOwnMessage = message.sender === this.currentUser.id;
        const messageClass = isOwnMessage ? 'own-message' : 'other-message';
        const otherParticipant = this.getOtherParticipant(this.activeConversation);

        const avatarUrl = isOwnMessage 
            ? (this.currentUser.avatar || 'images/deniM.png') 
            : (otherParticipant.avatar || 'images/deniM.png');
        
        const avatarHtml = `
            <div class="message-avatar">
                <img src="${avatarUrl}" alt="Avatar">
            </div>
        `;

        const messageContentHtml = `
            <div class="message-content">
                <p class="message-text">${message.text}</p>
                <div class="message-meta">
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    ${isOwnMessage ? `<span class="message-status ${message.read ? 'read' : 'sent'}"><i class="fas fa-${message.read ? 'check-double' : 'check'}"></i></span>` : ''}
                </div>
            </div>
        `;

        if (isOwnMessage) {
            return `<div class="message-item ${messageClass}">${messageContentHtml}${avatarHtml}</div>`;
        } else {
            return `<div class="message-item ${messageClass}">${avatarHtml}${messageContentHtml}</div>`;
        }
    }

    createPropertyCard(message) {
        const isOwnMessage = message.sender === this.currentUser.id;
        const messageClass = isOwnMessage ? 'own-message' : 'other-message';
        // Logic to fetch property details and render a card
        // For now, a placeholder:
        return `
            <div class="message-item ${messageClass}">
                <div class="message-content property-card">
                    <p><strong>Shared Property:</strong></p>
                    <p>${message.text}</p>
                    <a href="/property-details.html?id=${message.propertyId}" target="_blank" class="btn-primary">View Property</a>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !this.activeConversation) return;

        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        const otherParticipant = this.getOtherParticipant(this.activeConversation);
        if (!otherParticipant) {
            this.showError("Conversation partner not found.");
            return;
        }

        try {
            // Create message object
            const message = {
                conversationId: this.activeConversation.id,
                text: messageText,
                sender: this.currentUser.id,
                receiver: otherParticipant.id,
                timestamp: new Date(),
                read: false
            };

            // Save to Firestore, listener will update UI
            await this.saveMessage(message);

            // Clear input and update conversation list
            messageInput.value = '';
            messageInput.style.height = 'auto'; // Reset height
            this.updateConversationLastMessage(message);

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    async saveMessage(message) {
        // Real save to Firestore
        try {
            await firebase.firestore().collection('messages').add(message);
        } catch (error) {
            console.error("Error saving message to Firestore:", error);
            throw error; // Re-throw to be caught by sendMessage
        }
    }

    addMessageToUI(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const messageHTML = this.createMessageItem(message);
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateConversationLastMessage(message) {
        if (!this.activeConversation) return;

        this.activeConversation.lastMessage = message;
        this.activeConversation.unreadCount = 0;

        // Update conversation item in list
        const conversationItem = document.querySelector(`[data-conversation-id="${this.activeConversation.id}"]`);
        if (conversationItem) {
            const preview = conversationItem.querySelector('.conversation-preview');
            const time = conversationItem.querySelector('.conversation-time');
            const unreadBadge = conversationItem.querySelector('.unread-badge');

            if (preview) preview.textContent = message.text;
            if (time) time.textContent = this.formatTime(message.timestamp);
            if (unreadBadge) unreadBadge.remove();
            conversationItem.classList.remove('unread');
        }
    }

    markConversationAsRead(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            this.updateUnreadCount();
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
        
        // Update unread count in UI
        const unreadBadge = document.getElementById('unreadBadge');
        if (unreadBadge) {
            if (this.unreadCount > 0) {
                unreadBadge.textContent = this.unreadCount;
                unreadBadge.style.display = 'block';
            } else {
                unreadBadge.style.display = 'none';
            }
        }
    }

    updateConversationUI() {
        // Update active conversation styling
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.conversationId === this.activeConversation.id) {
                item.classList.add('active');
            }
        });

        // Update conversation header
        const conversationHeader = document.getElementById('conversationHeader');
        if (conversationHeader && this.activeConversation) {
            const otherParticipant = this.activeConversation.participants.find(p => p.id !== this.currentUser.id);
            conversationHeader.innerHTML = `
                <div class="conversation-info">
                    <h3>${otherParticipant.name}</h3>
                    <p>${this.activeConversation.property.title}</p>
                </div>
                <div class="conversation-actions">
                    <button onclick="messagingSystem.viewProperty('${this.activeConversation.property.id}')" class="btn-secondary">
                        <i class="fas fa-home"></i> View Property
                    </button>
                </div>
            `;
        }
    }

    showNewMessageModal() {
        // Create and show new message modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>New Message</h3>
                    <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>To:</label>
                        <select id="recipientSelect">
                            <option value="">Select recipient...</option>
                            <option value="landlord1">Mary Smith (Landlord)</option>
                            <option value="landlord2">Student Housing Ltd</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Property:</label>
                        <select id="propertySelect">
                            <option value="">Select property...</option>
                            <option value="prop1">Modern 2-Bedroom Apartment</option>
                            <option value="prop2">Student Hostel - Near University</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="newMessageText" placeholder="Type your message..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">Cancel</button>
                    <button onclick="messagingSystem.createNewConversation()" class="btn-primary">Send Message</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async createNewConversation() {
        const recipientSelect = document.getElementById('recipientSelect');
        const propertySelect = document.getElementById('propertySelect');
        const messageText = document.getElementById('newMessageText');

        if (!recipientSelect.value || !propertySelect.value || !messageText.value.trim()) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            // Create new conversation
            const newConversation = {
                id: `conv_${Date.now()}`,
                participants: [
                    { id: this.currentUser.id, name: this.currentUser.firstName, role: this.currentUser.role },
                    { id: recipientSelect.value, name: recipientSelect.options[recipientSelect.selectedIndex].text.split(' ')[0], role: 'landlord' }
                ],
                property: {
                    id: propertySelect.value,
                    title: propertySelect.options[propertySelect.selectedIndex].text
                },
                unreadCount: 0
            };

            // Add to conversations list
            this.conversations.unshift(newConversation);
            this.displayConversations();

            // Close modal
            document.querySelector('.modal').remove();

            // Open the new conversation
            this.openConversation(newConversation.id);

            // Send the initial message
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = messageText.value;
                this.sendMessage();
            }

        } catch (error) {
            console.error('Error creating conversation:', error);
            this.showError('Failed to create conversation');
        }
    }

    viewProperty(propertyId) {
        // Navigate to property details
        window.location.href = `property-details.html?id=${propertyId}`;
    }

    startMessagesListener(conversationId) {
        const messagesContainer = document.getElementById('messagesList');
        if (!messagesContainer) return;
        messagesContainer.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>`;

        this.unsubscribeMessages = firebase.firestore()
            .collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.displayMessages(messages);
            }, error => {
                console.error("Error fetching real-time messages:", error);
                messagesContainer.innerHTML = `<div class="empty-state"><h3>Error loading messages</h3></div>`;
            });
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return timestamp.toLocaleDateString();
    }

    showError(message) {
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showPropertyPicker() {
        const modal = document.getElementById('propertyPickerModal');
        modal.classList.remove('hidden');
        this.loadUserProperties();
    }

    closePropertyPicker() {
        const modal = document.getElementById('propertyPickerModal');
        modal.classList.add('hidden');
    }

    async loadUserProperties() {
        const propertyPickerList = document.getElementById('propertyPickerList');
        propertyPickerList.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>`;

        try {
            const db = firebase.firestore();
            const propertiesSnapshot = await db.collection('properties')
                .where('ownerId', '==', this.currentUser.id)
                .get();

            if (propertiesSnapshot.empty) {
                propertyPickerList.innerHTML = '<p>You have no properties to share.</p>';
                return;
            }

            propertyPickerList.innerHTML = '';
            propertiesSnapshot.forEach(doc => {
                const property = { id: doc.id, ...doc.data() };
                const propertyItem = document.createElement('div');
                propertyItem.className = 'property-picker-item';
                propertyItem.innerHTML = `
                    <img src="${(property.images && property.images[0]) || 'images/deniM.png'}" alt="${property.title}">
                    <div class="property-picker-info">
                        <h4>${property.title}</h4>
                        <p>${property.location}</p>
                    </div>
                    <button class="btn-primary" onclick="messagingSystem.sendPropertyMessage('${property.id}')">Send</button>
                `;
                propertyPickerList.appendChild(propertyItem);
            });
        } catch (error) {
            console.error("Error loading user properties:", error);
            propertyPickerList.innerHTML = '<p>Error loading properties.</p>';
        }
    }

    async sendPropertyMessage(propertyId) {
        this.closePropertyPicker();
        const messageText = `Check out this property: [Property ID: ${propertyId}]`;
        // Future: Send a structured message with property details
        // For now, send as text and we will render it as a card
        
        const otherParticipant = this.getOtherParticipant(this.activeConversation);
        if (!otherParticipant) return;

        const message = {
            conversationId: this.activeConversation.id,
            text: messageText,
            type: 'property', // Custom message type
            propertyId: propertyId,
            sender: this.currentUser.id,
            receiver: otherParticipant.id,
            timestamp: new Date(),
            read: false
        };

        await this.saveMessage(message);
        this.updateConversationLastMessage(message);
    }
}

// Initialize messaging system
const messagingSystem = new MessagingSystem();
document.addEventListener('DOMContentLoaded', () => {
    messagingSystem.init();
}); 