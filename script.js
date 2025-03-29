// Initialize database with localStorage or default values
let mockDb = {
    users: [
        { username: 'coddiano', password: '12345678910', isAdmin: true, isApproved: true }
    ],
    pendingUsers: [],
    votes: {},
    voteReasons: {}, // Store vote reasons
    comments: {},
    userCommentCount: {},
    currentUser: null,
    currentMember: null,
    pendingVoteMember: null, // Store the member being voted for while reason is being entered
    pendingVoteCard: null // Store the card element for the member being voted
};

// Reset localStorage to remove test comments (run once)
const cleanupKey = 'friends4ever_cleaned_comments';
if (!localStorage.getItem(cleanupKey)) {
    const oldData = localStorage.getItem('friends4ever_data');
    if (oldData) {
        const parsedData = JSON.parse(oldData);
        // Manteniamo utenti e voti ma resettiamo i commenti
        parsedData.comments = {};
        parsedData.userCommentCount = {};
        localStorage.setItem('friends4ever_data', JSON.stringify(parsedData));
    }
    localStorage.setItem(cleanupKey, 'true');
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Load data from localStorage if available
    loadDataFromStorage();

    // UI Elements
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const welcomeUser = document.getElementById('welcome-user');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const commentsModal = document.getElementById('comments-modal');
    const adminModal = document.getElementById('admin-modal');
    const adminBtn = document.getElementById('admin-btn');
    const votingPrompt = document.getElementById('voting-prompt');
    
    // Comments modal elements
    const commentsModalTitle = document.getElementById('comments-modal-title');
    const memberModalImage = document.getElementById('member-modal-image');
    const memberCommentsContainer = document.getElementById('member-comments-container');
    const memberCommentFormContainer = document.getElementById('member-comment-form-container');
    const memberCommentNotVoted = document.getElementById('member-comment-not-voted');
    const memberCommentLimitReached = document.getElementById('member-comment-limit-reached');

    // Forms and Buttons
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const memberCommentForm = document.getElementById('member-comment-form');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const pendingUsersList = document.getElementById('pending-users-list');
    const closeButtons = document.querySelectorAll('.close-modal');

    // New UI Elements
    const voteReasonModal = document.getElementById('vote-reason-modal');
    const voteMemberName = document.getElementById('vote-member-name');
    const voteReasonForm = document.getElementById('vote-reason-form');
    const voteReasonText = document.getElementById('vote-reason-text');

    // Modal controls
    showLoginBtn.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
    });

    showRegisterBtn.addEventListener('click', () => {
        registerModal.classList.remove('hidden');
    });

    registerBtn.addEventListener('click', () => {
        loginModal.classList.add('hidden');
        registerModal.classList.remove('hidden');
    });

    loginBtn.addEventListener('click', () => {
        registerModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });

    adminBtn.addEventListener('click', () => {
        updateAdminPanel();
        adminModal.classList.remove('hidden');
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginModal.classList.add('hidden');
            registerModal.classList.add('hidden');
            commentsModal.classList.add('hidden');
            adminModal.classList.add('hidden');
        });
    });

    // Close modals when clicking outside of modal content
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.add('hidden');
        }
        if (e.target === registerModal) {
            registerModal.classList.add('hidden');
        }
        if (e.target === commentsModal) {
            commentsModal.classList.add('hidden');
        }
        if (e.target === adminModal) {
            adminModal.classList.add('hidden');
        }
        if (e.target === voteReasonModal) {
            voteReasonModal.classList.add('hidden');
            mockDb.pendingVoteMember = null;
            mockDb.pendingVoteCard = null;
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        logout();
    });

    // Form submissions
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        login(username, password);
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        
        register(username, password);
    });

    memberCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentText = document.getElementById('member-comment-text').value;
        
        addComment(commentText);
        document.getElementById('member-comment-text').value = '';
    });

    // Setup vote buttons
    document.querySelectorAll('.vote-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const memberCard = e.target.closest('.member-card');
            const memberName = memberCard.dataset.member;
            
            if (!mockDb.currentUser) {
                alert('Effettua l\'accesso per votare il top scemo!');
                loginModal.classList.remove('hidden');
                return;
            }
            
            const username = mockDb.currentUser.username;
            
            if (!mockDb.votes[username]) {
                mockDb.votes[username] = [];
            }
            
            const userVotes = mockDb.votes[username];
            const voteIndex = userVotes.indexOf(memberName);
            
            if (voteIndex === -1) {
                // User hasn't voted for this member yet
                if (userVotes.length >= 3) {
                    alert('Hai già espresso 3 voti. Rimuovi un voto prima di aggiungerne un altro.');
                    return;
                }
                
                // Show the vote reason modal
                mockDb.pendingVoteMember = memberName;
                mockDb.pendingVoteCard = memberCard;
                voteMemberName.textContent = memberName;
                voteReasonText.value = '';
                voteReasonModal.classList.remove('hidden');
            } else {
                // User has already voted for this member, just remove the vote
                removeVote(memberName, memberCard);
            }
        });
    });

    // Vote reason form submission
    voteReasonForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!mockDb.pendingVoteMember || !mockDb.pendingVoteCard) {
            voteReasonModal.classList.add('hidden');
            return;
        }
        
        const reason = voteReasonText.value.trim();
        
        if (!reason) {
            alert('Per favore, inserisci una motivazione per il tuo voto.');
            return;
        }
        
        console.log('Submitting vote with reason:', reason);
        
        // Complete the voting process
        const memberName = mockDb.pendingVoteMember;
        const memberCard = mockDb.pendingVoteCard;
        
        // Add vote and comment
        addVote(memberName, memberCard, reason);
        addCommentFromVote(memberName, reason);
        
        // Clear pending vote
        mockDb.pendingVoteMember = null;
        mockDb.pendingVoteCard = null;
        
        // Hide modal
        voteReasonModal.classList.add('hidden');
    });

    // Close vote reason modal when clicking on X or outside
    document.querySelectorAll('#vote-reason-modal .close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            voteReasonModal.classList.add('hidden');
            mockDb.pendingVoteMember = null;
            mockDb.pendingVoteCard = null;
        });
    });

    // Setup image click handlers
    document.querySelectorAll('.member-img').forEach(img => {
        img.addEventListener('click', (e) => {
            const memberCard = e.target.closest('.member-card');
            const memberName = memberCard.dataset.member;
            const memberImgSrc = e.target.src;
            
            openMemberComments(memberName, memberImgSrc);
        });
    });

    // Functions
    function loadDataFromStorage() {
        const savedData = localStorage.getItem('friends4ever_data');
        
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Merge salvati con default
                mockDb.users = parsedData.users || mockDb.users;
                mockDb.pendingUsers = parsedData.pendingUsers || [];
                mockDb.votes = parsedData.votes || {};
                mockDb.voteReasons = parsedData.voteReasons || {};
                mockDb.comments = parsedData.comments || {};
                mockDb.userCommentCount = parsedData.userCommentCount || {};
                
                // Assicuriamoci che l'account admin sia sempre presente
                const adminUser = { username: 'coddiano', password: '12345678910', isAdmin: true, isApproved: true };
                const hasAdmin = mockDb.users.some(user => user.username === 'coddiano');
                
                if (!hasAdmin) {
                    mockDb.users.push(adminUser);
                } else {
                    // Assicuriamoci che coddiano sia admin
                    const adminIndex = mockDb.users.findIndex(user => user.username === 'coddiano');
                    mockDb.users[adminIndex] = adminUser;
                }
                
                console.log('Data loaded from localStorage:', parsedData);
            } catch (error) {
                console.error('Error parsing data from localStorage:', error);
            }
        }
        
        // Salva i dati per aggiornare le modifiche all'admin
        saveDataToStorage();
    }
    
    function saveDataToStorage() {
        const dataToSave = {
            users: mockDb.users,
            pendingUsers: mockDb.pendingUsers,
            votes: mockDb.votes,
            voteReasons: mockDb.voteReasons,
            comments: mockDb.comments,
            userCommentCount: mockDb.userCommentCount
        };
        
        try {
            localStorage.setItem('friends4ever_data', JSON.stringify(dataToSave));
            console.log('Data saved to localStorage:', dataToSave);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }

    function login(username, password) {
        console.log('Attempting login with:', username, password);
        console.log('Available users:', mockDb.users);
        
        const user = mockDb.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            if (user.isApproved) {
                mockDb.currentUser = user;
                loginModal.classList.add('hidden');
                authButtons.classList.add('hidden');
                userInfo.classList.remove('hidden');
                welcomeUser.textContent = `Benvenuto, ${user.username}!`;
                
                // Update login state UI
                updateLoginState();
                
                if (user.isAdmin) {
                    adminBtn.classList.remove('hidden');
                }
                
                // Initialize user comment count if needed
                if (!mockDb.userCommentCount[username]) {
                    mockDb.userCommentCount[username] = 0;
                }
                
                updateVotesDisplay();
            } else {
                alert('Il tuo account è in attesa di approvazione dall\'amministratore.');
            }
        } else {
            alert('Nickname o password non validi.');
        }
    }

    function logout() {
        mockDb.currentUser = null;
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminBtn.classList.add('hidden');
        
        // Update login state UI
        updateLoginState();
        
        // Reset forms
        loginForm.reset();
        registerForm.reset();
        
        updateVotesDisplay();
    }

    function register(username, password) {
        console.log('Attempting registration with:', username);
        
        // Check if username already exists
        if (mockDb.users.some(u => u.username === username) || 
            mockDb.pendingUsers.some(u => u.username === username)) {
            alert('Username già in uso. Scegline un altro.');
            return;
        }
        
        // Password validation
        if (password.length < 8) {
            alert('La password deve essere di almeno 8 caratteri.');
            return;
        }
        
        // Add user to pending
        const newUser = {
            username: username,
            password: password,
            isAdmin: false,
            isApproved: false
        };
        
        console.log('Adding user to pending:', newUser);
        mockDb.pendingUsers.push(newUser);
        saveDataToStorage();
        
        // Update UI
        updatePendingUsersList();
        
        // Show confirmation and close modal
        alert('Registrazione completata! Attendi l\'approvazione dell\'amministratore.');
        registerModal.classList.add('hidden');
        registerForm.reset();
    }

    function toggleVote(memberName, memberCard) {
        // This function is no longer used directly, kept for compatibility
        console.warn('toggleVote is deprecated, use addVote or removeVote instead');
    }

    // New function to add a vote with a reason
    function addVote(memberName, memberCard, reason) {
        if (!mockDb.currentUser) {
            alert('Devi effettuare l\'accesso per votare.');
            loginModal.classList.remove('hidden');
            return;
        }
        
        const username = mockDb.currentUser.username;
        
        if (!mockDb.votes[username]) {
            mockDb.votes[username] = [];
        }
        
        if (!mockDb.voteReasons[username]) {
            mockDb.voteReasons[username] = {};
        }
        
        const userVotes = mockDb.votes[username];
        
        if (userVotes.length >= 3) {
            alert('Hai già espresso 3 voti. Rimuovi un voto prima di aggiungerne un altro.');
            return;
        }
        
        console.log(`Adding vote for ${memberName} by ${username}`);
        
        userVotes.push(memberName);
        mockDb.voteReasons[username][memberName] = reason;
        
        // Aggiorna il pulsante
        if (memberCard) {
            const voteBtn = memberCard.querySelector('.vote-btn');
            if (voteBtn) {
                voteBtn.textContent = 'Rimuovi Voto';
                voteBtn.classList.add('voted');
            }
        }
        
        saveDataToStorage();
        updateVotesDisplay();
        
        alert(`Hai votato per ${memberName}!`);
    }

    // New function to remove a vote
    function removeVote(memberName, memberCard) {
        if (!mockDb.currentUser) return;
        
        const username = mockDb.currentUser.username;
        
        if (!mockDb.votes[username]) return;
        
        const userVotes = mockDb.votes[username];
        const voteIndex = userVotes.indexOf(memberName);
        
        if (voteIndex === -1) return;
        
        userVotes.splice(voteIndex, 1);
        
        // Remove the vote reason
        if (mockDb.voteReasons[username] && mockDb.voteReasons[username][memberName]) {
            delete mockDb.voteReasons[username][memberName];
        }
        
        memberCard.querySelector('.vote-btn').textContent = 'Vota';
        memberCard.querySelector('.vote-btn').classList.remove('voted');
        
        // Remove user's comments for this member
        removeUserCommentsForMember(username, memberName);
        
        saveDataToStorage();
        updateVotesDisplay();
    }

    // Function to remove user's comments for a specific member
    function removeUserCommentsForMember(username, memberName) {
        if (!mockDb.comments[memberName]) return;
        
        const userCommentsCount = mockDb.comments[memberName].filter(comment => comment.author === username).length;
        
        // Filter out comments by this user for this member
        mockDb.comments[memberName] = mockDb.comments[memberName].filter(comment => comment.author !== username);
        
        // Update the user's comment count
        if (mockDb.userCommentCount[username]) {
            mockDb.userCommentCount[username] -= userCommentsCount;
            if (mockDb.userCommentCount[username] < 0) mockDb.userCommentCount[username] = 0;
        }
        
        // If this member is currently open in the comments modal, update the display
        if (mockDb.currentMember === memberName) {
            updateMemberCommentsDisplay();
            
            // Update the comment form visibility
            if (userCommentsCount > 0 && mockDb.userCommentCount[username] < 3) {
                memberCommentLimitReached.classList.add('hidden');
                memberCommentNotVoted.classList.remove('hidden');
                memberCommentFormContainer.classList.add('hidden');
            }
        }
        
        alert('I tuoi commenti per questo membro sono stati rimossi perché hai tolto il voto.');
    }

    function updateVotesDisplay() {
        // Reset all vote counts
        document.querySelectorAll('.vote-count').forEach(count => {
            count.textContent = '0';
        });
        
        document.querySelectorAll('.vote-btn').forEach(btn => {
            if (!btn.classList.contains('hidden')) {
                btn.textContent = 'Vota';
                btn.classList.remove('voted');
            }
        });
        
        // Count all votes
        const voteCounts = {};
        
        for (const username in mockDb.votes) {
            const userVotes = mockDb.votes[username];
            
            userVotes.forEach(member => {
                if (!voteCounts[member]) {
                    voteCounts[member] = 0;
                }
                voteCounts[member]++;
            });
        }
        
        // Update display
        for (const member in voteCounts) {
            const memberCard = document.querySelector(`.member-card[data-member="${member}"]`);
            if (memberCard) {
                memberCard.querySelector('.vote-count').textContent = voteCounts[member];
            }
        }
        
        // Mark current user's votes
        if (mockDb.currentUser) {
            const username = mockDb.currentUser.username;
            if (mockDb.votes[username]) {
                mockDb.votes[username].forEach(member => {
                    const memberCard = document.querySelector(`.member-card[data-member="${member}"]`);
                    if (memberCard) {
                        memberCard.querySelector('.vote-btn').textContent = 'Rimuovi Voto';
                        memberCard.querySelector('.vote-btn').classList.add('voted');
                    }
                });
            }
        }
    }

    function openMemberComments(memberName, imgSrc) {
        mockDb.currentMember = memberName;
        
        // Update modal content
        commentsModalTitle.textContent = `Commenti su ${memberName}`;
        memberModalImage.src = imgSrc;
        memberModalImage.alt = memberName;
        
        updateMemberCommentsDisplay();
        
        // Show/hide comment form based on user status
        if (mockDb.currentUser) {
            const username = mockDb.currentUser.username;
            
            // Check if user has voted for this member
            const hasVoted = mockDb.votes[username] && mockDb.votes[username].includes(memberName);
            
            // Check if user has reached comment limit
            const commentCount = mockDb.userCommentCount[username] || 0;
            const hasReachedLimit = commentCount >= 3;
            
            memberCommentFormContainer.classList.add('hidden');
            memberCommentNotVoted.classList.add('hidden');
            memberCommentLimitReached.classList.add('hidden');
            
            if (hasReachedLimit) {
                memberCommentLimitReached.classList.remove('hidden');
            } else if (hasVoted) {
                memberCommentFormContainer.classList.remove('hidden');
            } else {
                memberCommentNotVoted.classList.remove('hidden');
            }
        } else {
            memberCommentFormContainer.classList.add('hidden');
            memberCommentNotVoted.classList.add('hidden');
            memberCommentLimitReached.classList.add('hidden');
        }
        
        commentsModal.classList.remove('hidden');
    }

    function addComment(text) {
        if (!mockDb.currentUser || !mockDb.currentMember) {
            return;
        }
        
        const username = mockDb.currentUser.username;
        const memberName = mockDb.currentMember;
        
        // Check if user has voted for this member
        const hasVoted = mockDb.votes[username] && mockDb.votes[username].includes(memberName);
        if (!hasVoted) {
            alert('Devi votare questa persona per poter commentare.');
            return;
        }
        
        // Check if user has reached comment limit
        const commentCount = mockDb.userCommentCount[username] || 0;
        if (commentCount >= 3) {
            alert('Hai raggiunto il limite di 3 commenti.');
            return;
        }
        
        // Initialize member comments array if needed
        if (!mockDb.comments[memberName]) {
            mockDb.comments[memberName] = [];
        }
        
        const comment = {
            id: Date.now(), // Unique ID for the comment
            text,
            timestamp: new Date().toLocaleString(),
            author: username
        };
        
        mockDb.comments[memberName].push(comment);
        mockDb.userCommentCount[username] = commentCount + 1;
        
        saveDataToStorage();
        updateMemberCommentsDisplay();
        
        // Check if user reached comment limit after adding this comment
        if (mockDb.userCommentCount[username] >= 3) {
            memberCommentFormContainer.classList.add('hidden');
            memberCommentLimitReached.classList.remove('hidden');
        }
    }

    function updateMemberCommentsDisplay() {
        memberCommentsContainer.innerHTML = '';
        
        if (!mockDb.currentMember || !mockDb.comments[mockDb.currentMember] || mockDb.comments[mockDb.currentMember].length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Non ci sono ancora commenti per questo membro.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#999';
            memberCommentsContainer.appendChild(emptyMessage);
            return;
        }
        
        mockDb.comments[mockDb.currentMember].forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.dataset.id = comment.id;
            
            const commentText = document.createElement('p');
            commentText.textContent = comment.text;
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = comment.timestamp;
            
            commentElement.appendChild(commentText);
            commentElement.appendChild(timestamp);
            
            // Add delete button for admin
            if (mockDb.currentUser && mockDb.currentUser.isAdmin) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-comment-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = 'Elimina commento';
                deleteBtn.addEventListener('click', () => deleteComment(comment.id, mockDb.currentMember));
                
                commentElement.appendChild(deleteBtn);
            }
            
            memberCommentsContainer.appendChild(commentElement);
        });
    }

    function deleteComment(commentId, memberName) {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
        const commentIndex = mockDb.comments[memberName].findIndex(c => c.id === commentId);
        if (commentIndex === -1) return;
        
        const comment = mockDb.comments[memberName][commentIndex];
        const authorUsername = comment.author;
        
        // Decrement the author's comment count
        if (authorUsername && mockDb.userCommentCount[authorUsername]) {
            mockDb.userCommentCount[authorUsername]--;
        }
        
        // Remove the comment
        mockDb.comments[memberName].splice(commentIndex, 1);
        saveDataToStorage();
        
        // Update the display
        updateMemberCommentsDisplay();
    }

    function updateAdminPanel() {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
        updatePendingUsersList();
        
        // Create a simplified admin panel
        let adminContent = document.querySelector('.admin-modal-content');
        
        // Clear existing content (except pending users)
        const pendingUsersSection = document.getElementById('pending-users');
        adminContent.innerHTML = '';
        adminContent.appendChild(document.createElement('span')).className = 'close-modal';
        adminContent.querySelector('.close-modal').innerHTML = '&times;';
        adminContent.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('admin-modal').classList.add('hidden');
        });
        
        const title = document.createElement('h2');
        title.textContent = 'Pannello Amministratore';
        adminContent.appendChild(title);
        
        adminContent.appendChild(pendingUsersSection);
        
        // Add voting statistics section
        const statisticsSection = document.createElement('div');
        statisticsSection.id = 'voting-statistics';
        statisticsSection.className = 'admin-section';
        
        const statsTitle = document.createElement('h3');
        statsTitle.textContent = 'Statistiche di Voto';
        statisticsSection.appendChild(statsTitle);
        
        // Get all members
        const members = Array.from(document.querySelectorAll('.member-card'))
            .map(card => card.dataset.member);
        
        // Create a table for votes
        const votesTable = document.createElement('table');
        votesTable.className = 'admin-table';
        
        const tableHeader = document.createElement('tr');
        const memberHeader = document.createElement('th');
        memberHeader.textContent = 'Membro';
        const votesHeader = document.createElement('th');
        votesHeader.textContent = 'Numero di Voti';
        
        tableHeader.appendChild(memberHeader);
        tableHeader.appendChild(votesHeader);
        votesTable.appendChild(tableHeader);
        
        members.forEach(member => {
            const memberVoters = [];
            
            // Find users who voted for this member
            Object.entries(mockDb.votes).forEach(([username, votes]) => {
                if (votes.includes(member)) {
                    memberVoters.push(username);
                }
            });
            
            const tableRow = document.createElement('tr');
            
            const memberCell = document.createElement('td');
            memberCell.textContent = member;
            
            const votesCell = document.createElement('td');
            votesCell.textContent = memberVoters.length;
            
            tableRow.appendChild(memberCell);
            tableRow.appendChild(votesCell);
            votesTable.appendChild(tableRow);
        });
        
        statisticsSection.appendChild(votesTable);
        adminContent.appendChild(statisticsSection);
        
        // Add comment management section
        const commentsSection = document.createElement('div');
        commentsSection.id = 'comments-management';
        commentsSection.className = 'admin-section';
        
        const commentsTitle = document.createElement('h3');
        commentsTitle.textContent = 'Gestione Commenti';
        commentsSection.appendChild(commentsTitle);
        
        let hasAnyComments = false;
        
        const commentsTable = document.createElement('table');
        commentsTable.className = 'admin-table';
        
        const commentsHeader = document.createElement('tr');
        const memberCommentHeader = document.createElement('th');
        memberCommentHeader.textContent = 'Membro';
        const commentTextHeader = document.createElement('th');
        commentTextHeader.textContent = 'Commento';
        const commentDateHeader = document.createElement('th');
        commentDateHeader.textContent = 'Data';
        const commentActionHeader = document.createElement('th');
        commentActionHeader.textContent = 'Azioni';
        
        commentsHeader.appendChild(memberCommentHeader);
        commentsHeader.appendChild(commentTextHeader);
        commentsHeader.appendChild(commentDateHeader);
        commentsHeader.appendChild(commentActionHeader);
        commentsTable.appendChild(commentsHeader);
        
        members.forEach(member => {
            const memberComments = mockDb.comments[member] || [];
            
            if (memberComments.length > 0) {
                hasAnyComments = true;
                
                memberComments.forEach(comment => {
                    const commentRow = document.createElement('tr');
                    
                    const memberCell = document.createElement('td');
                    memberCell.textContent = member;
                    
                    const commentCell = document.createElement('td');
                    commentCell.textContent = comment.text;
                    
                    const dateCell = document.createElement('td');
                    dateCell.textContent = comment.timestamp;
                    
                    const actionCell = document.createElement('td');
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'admin-delete';
                    deleteBtn.textContent = 'Elimina';
                    deleteBtn.addEventListener('click', () => {
                        deleteComment(comment.id, member);
                        updateAdminPanel();
                    });
                    actionCell.appendChild(deleteBtn);
                    
                    commentRow.appendChild(memberCell);
                    commentRow.appendChild(commentCell);
                    commentRow.appendChild(dateCell);
                    commentRow.appendChild(actionCell);
                    commentsTable.appendChild(commentRow);
                });
            }
        });
        
        if (hasAnyComments) {
            commentsSection.appendChild(commentsTable);
        } else {
            const noComments = document.createElement('p');
            noComments.textContent = 'Nessun commento presente nel sistema.';
            noComments.style.textAlign = 'center';
            commentsSection.appendChild(noComments);
        }
        
        adminContent.appendChild(commentsSection);
    }

    function updatePendingUsersList() {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
        pendingUsersList.innerHTML = '';
        
        if (mockDb.pendingUsers.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Non ci sono utenti in attesa di approvazione.';
            emptyMessage.style.color = '#999';
            pendingUsersList.appendChild(emptyMessage);
            return;
        }
        
        mockDb.pendingUsers.forEach((user, index) => {
            console.log('Processing pending user:', user);
            
            const userItem = document.createElement('li');
            userItem.className = 'pending-user';
            
            const userInfo = document.createElement('span');
            userInfo.textContent = user.username;
            
            const approveBtn = document.createElement('button');
            approveBtn.className = 'approve-btn';
            approveBtn.textContent = 'Approva';
            approveBtn.addEventListener('click', () => {
                approveUser(index);
            });
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'reject-btn';
            rejectBtn.textContent = 'Rifiuta';
            rejectBtn.addEventListener('click', () => {
                rejectUser(index);
            });
            
            userItem.appendChild(userInfo);
            userItem.appendChild(approveBtn);
            userItem.appendChild(rejectBtn);
            
            pendingUsersList.appendChild(userItem);
        });
        
        console.log('Updated pending users list with', mockDb.pendingUsers.length, 'users');
    }

    function approveUser(index) {
        const user = mockDb.pendingUsers[index];
        user.isApproved = true;
        mockDb.users.push(user);
        mockDb.pendingUsers.splice(index, 1);
        
        saveDataToStorage();
        updatePendingUsersList();
        alert(`L'utente ${user.username} è stato approvato.`);
    }

    function rejectUser(index) {
        const username = mockDb.pendingUsers[index].username;
        mockDb.pendingUsers.splice(index, 1);
        
        saveDataToStorage();
        updatePendingUsersList();
        alert(`L'utente ${username} è stato rifiutato.`);
    }

    // New function to add a comment from vote reason
    function addCommentFromVote(memberName, text) {
        if (!mockDb.currentUser) return;
        
        const username = mockDb.currentUser.username;
        
        // Check if user has reached comment limit
        const commentCount = mockDb.userCommentCount[username] || 0;
        if (commentCount >= 3) {
            // User has reached limit, don't add the comment
            return;
        }
        
        // Initialize member comments array if needed
        if (!mockDb.comments[memberName]) {
            mockDb.comments[memberName] = [];
        }
        
        const comment = {
            id: Date.now(), // Unique ID for the comment
            text: text,
            timestamp: new Date().toLocaleString(),
            author: username
        };
        
        mockDb.comments[memberName].push(comment);
        mockDb.userCommentCount[username] = commentCount + 1;
        
        saveDataToStorage();
    }

    // Fix login state
    function updateLoginState() {
        const isLoggedIn = !!mockDb.currentUser;
        
        // I pulsanti di voto sono sempre visibili, non nasconderli per chi non è loggato
        
        // Update voting prompt text
        if (isLoggedIn) {
            votingPrompt.textContent = "Puoi votare fino a 3 membri. I voti sono anonimi e possono essere cambiati.";
        } else {
            votingPrompt.textContent = "Accedi per votare fino a 3 membri. I voti sono anonimi e possono essere cambiati.";
        }
    }

    // Initialize UI based on current login state
    updateLoginState();
    
    // Set initial vote counts
    updateVotesDisplay();
}); 