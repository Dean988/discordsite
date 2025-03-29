// Initialize database with default values
let mockDb = {
    users: [
        { username: 'coddiano', password: '12345678910', isAdmin: true }
    ],
    votes: {},
    voteReasons: {},
    comments: {},
    userCommentCount: {},
    currentUser: null,
    currentMember: null,
    pendingVoteMember: null,
    pendingVoteCard: null
};

// LocalStorage keys
const STORAGE_KEYS = {
    USERS: 'friends4ever_users',
    VOTES: 'friends4ever_votes',
    VOTE_REASONS: 'friends4ever_voteReasons',
    COMMENTS: 'friends4ever_comments',
    USER_COMMENT_COUNT: 'friends4ever_userCommentCount'
};

// Database Operations - semplificato con localStorage
const DbOps = {
    // User operations
    getUsers: function() {
        try {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
            return users || mockDb.users;
        } catch (e) {
            console.error('Error getting users from localStorage:', e);
            return mockDb.users;
        }
    },
    
    setUsers: function(users) {
        try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error('Error setting users in localStorage:', e);
            return false;
        }
    },
    
    addUser: function(user) {
        try {
            const users = this.getUsers();
            const existingUser = users.find(u => u.username === user.username);
            
            if (existingUser) {
                return false;
            }
            
            users.push(user);
            this.setUsers(users);
            return true;
        } catch (e) {
            console.error('Error adding user to localStorage:', e);
            return false;
        }
    },
    
    // Votes operations
    getVotes: function() {
        try {
            const votes = JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTES));
            return votes || {};
        } catch (e) {
            console.error('Error getting votes from localStorage:', e);
            return {};
        }
    },
    
    setUserVotes: function(username, votes) {
        try {
            const allVotes = this.getVotes();
            allVotes[username] = votes;
            localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(allVotes));
            return true;
        } catch (e) {
            console.error('Error setting votes in localStorage:', e);
            return false;
        }
    },
    
    // Vote reasons operations
    getVoteReasons: function() {
        try {
            const reasons = JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTE_REASONS));
            return reasons || {};
        } catch (e) {
            console.error('Error getting vote reasons from localStorage:', e);
            return {};
        }
    },
    
    setUserVoteReasons: function(username, reasons) {
        try {
            const allReasons = this.getVoteReasons();
            allReasons[username] = reasons;
            localStorage.setItem(STORAGE_KEYS.VOTE_REASONS, JSON.stringify(allReasons));
            return true;
        } catch (e) {
            console.error('Error setting vote reasons in localStorage:', e);
            return false;
        }
    },
    
    // Comments operations
    getComments: function() {
        try {
            const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS));
            return comments || {};
        } catch (e) {
            console.error('Error getting comments from localStorage:', e);
            return {};
        }
    },
    
    setMemberComments: function(member, comments) {
        try {
            const allComments = this.getComments();
            allComments[member] = comments;
            localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
            return true;
        } catch (e) {
            console.error('Error setting comments in localStorage:', e);
            return false;
        }
    },
    
    // User comment count operations
    getUserCommentCounts: function() {
        try {
            const counts = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COMMENT_COUNT));
            return counts || {};
        } catch (e) {
            console.error('Error getting user comment counts from localStorage:', e);
            return {};
        }
    },
    
    setUserCommentCount: function(username, count) {
        try {
            const allCounts = this.getUserCommentCounts();
            allCounts[username] = count;
            localStorage.setItem(STORAGE_KEYS.USER_COMMENT_COUNT, JSON.stringify(allCounts));
            return true;
        } catch (e) {
            console.error('Error setting user comment count in localStorage:', e);
            return false;
        }
    }
};

// Ensure admin user exists
function ensureAdminExists() {
    const users = DbOps.getUsers();
    const adminExists = users.some(user => user.username === 'coddiano');
    
    if (!adminExists) {
        DbOps.addUser({ username: 'coddiano', password: '12345678910', isAdmin: true });
    }
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initApp();
    
    function initApp() {
        // Ensure admin exists
        ensureAdminExists();
        
        // Load data
        loadDataFromStorage();
        
        // Setup UI
        setupUI();
        
        // Check if user is already logged in
        const savedUsername = localStorage.getItem('currentUsername');
        if (savedUsername) {
            const users = DbOps.getUsers();
            const user = users.find(u => u.username === savedUsername);
            if (user) {
                mockDb.currentUser = user;
                updateLoginState();
                updateVotesDisplay();
            } else {
                localStorage.removeItem('currentUsername');
            }
        }
    }

    function setupUI() {
        console.log("Inizializzazione dell'interfaccia utente");
        
        // UI Elements
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        const commentsModal = document.getElementById('comments-modal');
        const adminModal = document.getElementById('admin-modal');
        const votingPrompt = document.getElementById('voting-prompt');
        
        // Verifico che gli elementi esistano
        console.log("Login modal:", loginModal);
        console.log("Register modal:", registerModal);
        
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
        const adminBtn = document.getElementById('admin-btn');
        const closeButtons = document.querySelectorAll('.close-modal');
        
        // Verifico che i form esistano
        console.log("Login form:", loginForm);
        console.log("Register form:", registerForm);
        
        // Verifico che gli input esistano
        console.log("Username input:", document.getElementById('username'));
        console.log("Password input:", document.getElementById('password'));
        console.log("Reg username input:", document.getElementById('reg-username'));
        console.log("Reg password input:", document.getElementById('reg-password'));

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

        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                updateAdminPanel();
                adminModal.classList.remove('hidden');
            });
        }

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                loginModal.classList.add('hidden');
                registerModal.classList.add('hidden');
                commentsModal.classList.add('hidden');
                adminModal.classList.add('hidden');
                voteReasonModal.classList.add('hidden');
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
            console.log("Form di login inviato");
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            console.log("Tentativo di login con:", username, password);
            
            login(username, password);
        });

        // Handler diretto al pulsante di submit
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        if (loginSubmitBtn) {
            loginSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Pulsante di login cliccato");
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                console.log("Tentativo di login con:", username, password);
                
                login(username, password);
            });
        }

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Form di registrazione inviato");
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            console.log("Tentativo di registrazione con:", username, password);
            
            register(username, password);
        });

        // Handler diretto al pulsante di submit
        const registerSubmitBtn = document.getElementById('register-submit-btn');
        if (registerSubmitBtn) {
            registerSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Pulsante di registrazione cliccato");
                const username = document.getElementById('reg-username').value;
                const password = document.getElementById('reg-password').value;
                console.log("Tentativo di registrazione con:", username, password);
                
                register(username, password);
            });
        }

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

        // Initialize UI based on current login state
        updateLoginState();
        
        // Set initial vote counts
        updateVotesDisplay();
    }

    // Functions
    function loadDataFromStorage() {
        console.log("Caricamento dati da localStorage");
        
        // Load users
        const users = DbOps.getUsers();
        if (users && users.length > 0) {
            mockDb.users = users;
        }
        
        // Load votes
        const votes = DbOps.getVotes();
        if (votes) {
            mockDb.votes = votes;
        }
        
        // Load vote reasons
        const voteReasons = DbOps.getVoteReasons();
        if (voteReasons) {
            mockDb.voteReasons = voteReasons;
        }
        
        // Load comments
        const comments = DbOps.getComments();
        if (comments) {
            mockDb.comments = comments;
        }
        
        // Load user comment counts
        const userCommentCount = DbOps.getUserCommentCounts();
        if (userCommentCount) {
            mockDb.userCommentCount = userCommentCount;
        }
        
        console.log('Data loaded successfully:', mockDb);
    }
    
    function login(username, password) {
        console.log("Tentativo di login con:", username, password);
        
        // Refresh users from localStorage
        mockDb.users = DbOps.getUsers();
        
        // Debug: mostra gli utenti disponibili
        console.log("Utenti disponibili:", mockDb.users);
        
        const validUser = mockDb.users.find(user => 
            user.username === username && user.password === password
        );
        
        console.log("Utente trovato:", validUser);
        
        if (validUser) {
            mockDb.currentUser = validUser;
            
            // Salva login state
            localStorage.setItem('currentUsername', username);
            
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
            // Update UI
            updateLoginState();
            updateVotesDisplay();
            
            // Update header login/logout buttons
            document.getElementById('show-login-btn').classList.add('hidden');
            document.getElementById('show-register-btn').classList.add('hidden');
            document.getElementById('user-info').classList.remove('hidden');
            
            // Set user welcome
            document.getElementById('welcome-user').textContent = `Benvenuto, ${username}!`;
            
            // Show admin panel button if admin
            if (validUser.isAdmin) {
                document.getElementById('admin-btn').classList.remove('hidden');
            }
            
            console.log("Login completato con successo");
        } else {
            console.error("Login fallito: username o password errati");
            alert('Username o password non validi. Per favore riprova.');
        }
    }

    function register(username, password) {
        console.log("Tentativo di registrazione con:", username);
        
        if (!username || !password) {
            alert('Username e password sono obbligatori.');
            return;
        }
        
        if (username.length < 3) {
            alert('Username deve essere di almeno 3 caratteri.');
            return;
        }
        
        if (password.length < 5) {
            alert('La password deve essere di almeno 5 caratteri.');
            return;
        }
        
        // Refresh users from localStorage
        mockDb.users = DbOps.getUsers();
        
        // Debug: mostra gli utenti disponibili prima della registrazione
        console.log("Utenti disponibili prima della registrazione:", mockDb.users);
        
        const existingUser = mockDb.users.find(user => user.username === username);
        if (existingUser) {
            console.error("Registrazione fallita: username già in uso");
            alert('Username già in uso. Scegline un altro.');
            return;
        }
        
        const newUser = { username, password, isAdmin: false };
        const success = DbOps.addUser(newUser);
        
        if (success) {
            // Refresh the users array
            mockDb.users = DbOps.getUsers();
            
            console.log("Registrazione completata con successo");
            console.log("Utenti disponibili dopo la registrazione:", mockDb.users);
            
            alert('Registrazione completata! Ora puoi accedere.');
            
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            
            // Pre-compila il form di login con il nuovo username
            document.getElementById('username').value = username;
        } else {
            console.error("Registrazione fallita: errore nell'aggiunta dell'utente");
            alert('Si è verificato un errore durante la registrazione. Riprova.');
        }
    }
    
    function logout() {
        mockDb.currentUser = null;
        localStorage.removeItem('currentUsername');
        
        // Update UI
        updateLoginState();
        
        // Update header login/logout buttons
        document.getElementById('show-login-btn').classList.remove('hidden');
        document.getElementById('show-register-btn').classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
        
        // Hide admin panel button
        if (document.getElementById('admin-btn')) {
            document.getElementById('admin-btn').classList.add('hidden');
        }
    }

    function updateLoginState() {
        const isLoggedIn = !!mockDb.currentUser;
        
        // Update voting prompt text
        if (votingPrompt) {
            if (isLoggedIn) {
                votingPrompt.textContent = "Puoi votare fino a 3 membri. I voti sono anonimi e possono essere cambiati.";
            } else {
                votingPrompt.textContent = "Accedi per votare fino a 3 membri. I voti sono anonimi e possono essere cambiati.";
            }
        }
    }

    function updateVotesDisplay() {
        // Reset all vote counts
        document.querySelectorAll('.vote-count').forEach(count => {
            count.textContent = '0';
        });
        
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.textContent = 'Vota';
            btn.classList.remove('voted');
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

    function addVote(memberName, memberCard, reason) {
        if (!mockDb.currentUser) {
            alert('Devi effettuare l\'accesso per votare.');
            document.getElementById('login-modal').classList.remove('hidden');
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
        
        // Save the vote to the database
        DbOps.setUserVotes(username, userVotes);
        DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
        
        updateVotesDisplay();
        
        alert(`Hai votato per ${memberName}!`);
    }

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
        
        // Update button
        memberCard.querySelector('.vote-btn').textContent = 'Vota';
        memberCard.querySelector('.vote-btn').classList.remove('voted');
        
        // Remove user's comments for this member
        removeUserCommentsForMember(username, memberName);
        
        // Save changes
        DbOps.setUserVotes(username, userVotes);
        DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
        
        updateVotesDisplay();
    }

    function removeUserCommentsForMember(username, memberName) {
        if (!mockDb.comments[memberName]) return;
        
        const userCommentsCount = mockDb.comments[memberName].filter(comment => comment.author === username).length;
        if (userCommentsCount === 0) return;
        
        // Filter out comments by this user for this member
        mockDb.comments[memberName] = mockDb.comments[memberName].filter(comment => comment.author !== username);
        
        // Update the user's comment count
        if (mockDb.userCommentCount[username]) {
            mockDb.userCommentCount[username] -= userCommentsCount;
            if (mockDb.userCommentCount[username] < 0) mockDb.userCommentCount[username] = 0;
            
            // Save to database
            DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
        }
        
        // Save the updated comments
        DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        
        // If this member is currently open in the comments modal, update the display
        if (mockDb.currentMember === memberName) {
            updateMemberCommentsDisplay();
            
            // Update the comment form visibility
            if (userCommentsCount > 0 && mockDb.userCommentCount[username] < 3) {
                document.getElementById('member-comment-limit-reached').classList.add('hidden');
                document.getElementById('member-comment-not-voted').classList.remove('hidden');
                document.getElementById('member-comment-form-container').classList.add('hidden');
            }
        }
        
        alert('I tuoi commenti per questo membro sono stati rimossi perché hai tolto il voto.');
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
        
        if (!mockDb.comments[memberName]) return;
        
        const commentIndex = mockDb.comments[memberName].findIndex(c => c.id === commentId);
        if (commentIndex === -1) return;
        
        const comment = mockDb.comments[memberName][commentIndex];
        const authorUsername = comment.author;
        
        // Decrement the author's comment count
        if (authorUsername && mockDb.userCommentCount[authorUsername]) {
            mockDb.userCommentCount[authorUsername]--;
            DbOps.setUserCommentCount(authorUsername, mockDb.userCommentCount[authorUsername]);
        }
        
        // Remove the comment
        mockDb.comments[memberName].splice(commentIndex, 1);
        DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        
        // Update the display
        updateMemberCommentsDisplay();
    }

    function updateAdminPanel() {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
        // Create a simplified admin panel
        let adminContent = document.querySelector('.admin-modal-content');
        
        // Clear existing content
        adminContent.innerHTML = '';
        adminContent.appendChild(document.createElement('span')).className = 'close-modal';
        adminContent.querySelector('.close-modal').innerHTML = '&times;';
        adminContent.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('admin-modal').classList.add('hidden');
        });
        
        const title = document.createElement('h2');
        title.textContent = 'Pannello Amministratore';
        adminContent.appendChild(title);
        
        // Create users section
        const usersSection = document.createElement('div');
        usersSection.id = 'registered-users';
        usersSection.className = 'admin-section';
        
        const usersTitle = document.createElement('h3');
        usersTitle.textContent = 'Utenti Registrati';
        usersSection.appendChild(usersTitle);
        
        const usersList = document.createElement('ul');
        usersList.id = 'registered-users-list';
        
        // Add all non-admin users
        const nonAdminUsers = mockDb.users.filter(user => !user.isAdmin);
        
        if (nonAdminUsers.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Nessun utente registrato.';
            emptyMessage.style.color = '#999';
            usersList.appendChild(emptyMessage);
        } else {
            nonAdminUsers.forEach(user => {
                const userItem = document.createElement('li');
                userItem.className = 'registered-user';
                
                const userInfo = document.createElement('span');
                userInfo.textContent = user.username;
                
                userItem.appendChild(userInfo);
                usersList.appendChild(userItem);
            });
        }
        
        usersSection.appendChild(usersList);
        adminContent.appendChild(usersSection);
        
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
            let voteCount = 0;
            
            // Count votes for this member
            Object.values(mockDb.votes).forEach(votes => {
                if (votes.includes(member)) {
                    voteCount++;
                }
            });
            
            const tableRow = document.createElement('tr');
            
            const memberCell = document.createElement('td');
            memberCell.textContent = member;
            
            const votesCell = document.createElement('td');
            votesCell.textContent = voteCount;
            
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
                    deleteBtn.addEventListener('click', () => deleteComment(comment.id, member));
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

    // Function to add a comment from vote reason
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
        
        // Save to database
        DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
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
        
        // Save to database
        DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
        
        updateMemberCommentsDisplay();
        
        // Check if user reached comment limit after adding this comment
        if (mockDb.userCommentCount[username] >= 3) {
            memberCommentFormContainer.classList.add('hidden');
            memberCommentLimitReached.classList.remove('hidden');
        }
    }
}); 