// Initialize database with default values
let mockDb = {
    users: [
        { username: 'coddiano', password: '12345678910', isAdmin: true, isApproved: true }
    ],
    votes: {},
    voteReasons: {}, // Store vote reasons
    comments: {},
    userCommentCount: {},
    currentUser: null,
    currentMember: null,
    pendingVoteMember: null, // Store the member being voted for while reason is being entered
    pendingVoteCard: null // Store the card element for the member being voted
};

// IndexedDB setup for persistent storage
let db;
const DB_NAME = 'friends4ever_db';
const DB_VERSION = 1;
const STORES = {
    USERS: 'users',
    VOTES: 'votes',
    VOTE_REASONS: 'voteReasons',
    COMMENTS: 'comments',
    USER_COMMENT_COUNT: 'userCommentCount'
};

// Initialize IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.error("Your browser doesn't support IndexedDB.");
            resolve(false);
            return;
        }
        
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = function(event) {
            console.error("Database error:", event.target.error);
            resolve(false);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                db.createObjectStore(STORES.USERS, { keyPath: 'username' });
            }
            
            if (!db.objectStoreNames.contains(STORES.VOTES)) {
                db.createObjectStore(STORES.VOTES, { keyPath: 'username' });
            }
            
            if (!db.objectStoreNames.contains(STORES.VOTE_REASONS)) {
                db.createObjectStore(STORES.VOTE_REASONS, { keyPath: 'username' });
            }
            
            if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
                db.createObjectStore(STORES.COMMENTS, { keyPath: 'member' });
            }
            
            if (!db.objectStoreNames.contains(STORES.USER_COMMENT_COUNT)) {
                db.createObjectStore(STORES.USER_COMMENT_COUNT, { keyPath: 'username' });
            }
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("Database initialized successfully");
            
            // Ensure admin user exists
            ensureAdminExists().then(() => {
                resolve(true);
            }).catch(error => {
                console.error("Error ensuring admin exists:", error);
                resolve(false);
            });
        };
    });
}

// Database Operations
const DbOps = {
    // User operations
    getUsers: function() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve([...mockDb.users]);
                return;
            }
            
            const transaction = db.transaction(STORES.USERS, 'readonly');
            const store = transaction.objectStore(STORES.USERS);
            const request = store.getAll();
            
            request.onsuccess = function() {
                resolve(request.result || []);
            };
            
            request.onerror = function(event) {
                console.error("Error getting users:", event.target.error);
                resolve([...mockDb.users]);
            };
        });
    },
    
    addUser: function(user) {
        return new Promise((resolve, reject) => {
            if (!db) {
                mockDb.users.push(user);
                resolve(true);
                return;
            }
            
            const transaction = db.transaction(STORES.USERS, 'readwrite');
            const store = transaction.objectStore(STORES.USERS);
            
            // First check if user exists
            const getRequest = store.get(user.username);
            
            getRequest.onsuccess = function() {
                if (getRequest.result) {
                    // User already exists
                    resolve(false);
                    return;
                }
                
                // Add the user
                const addRequest = store.add(user);
                
                addRequest.onsuccess = function() {
                    resolve(true);
                };
                
                addRequest.onerror = function(event) {
                    console.error("Error adding user:", event.target.error);
                    resolve(false);
                };
            };
            
            getRequest.onerror = function(event) {
                console.error("Error checking user existence:", event.target.error);
                resolve(false);
            };
        });
    },
    
    // Votes operations
    getVotes: function() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve({...mockDb.votes});
                return;
            }
            
            const transaction = db.transaction(STORES.VOTES, 'readonly');
            const store = transaction.objectStore(STORES.VOTES);
            const request = store.getAll();
            
            request.onsuccess = function() {
                const votes = {};
                (request.result || []).forEach(item => {
                    votes[item.username] = item.votes;
                });
                resolve(votes);
            };
            
            request.onerror = function(event) {
                console.error("Error getting votes:", event.target.error);
                resolve({...mockDb.votes});
            };
        });
    },
    
    setUserVotes: function(username, votes) {
        return new Promise((resolve, reject) => {
            if (!db) {
                mockDb.votes[username] = votes;
                resolve(true);
                return;
            }
            
            const transaction = db.transaction(STORES.VOTES, 'readwrite');
            const store = transaction.objectStore(STORES.VOTES);
            
            const request = store.put({ username, votes });
            
            request.onsuccess = function() {
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error("Error setting votes:", event.target.error);
                mockDb.votes[username] = votes; // Fallback
                resolve(false);
            };
        });
    },
    
    // Vote reasons operations
    getVoteReasons: function() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve({...mockDb.voteReasons});
                return;
            }
            
            const transaction = db.transaction(STORES.VOTE_REASONS, 'readonly');
            const store = transaction.objectStore(STORES.VOTE_REASONS);
            const request = store.getAll();
            
            request.onsuccess = function() {
                const voteReasons = {};
                (request.result || []).forEach(item => {
                    voteReasons[item.username] = item.reasons;
                });
                resolve(voteReasons);
            };
            
            request.onerror = function(event) {
                console.error("Error getting vote reasons:", event.target.error);
                resolve({...mockDb.voteReasons});
            };
        });
    },
    
    setUserVoteReasons: function(username, reasons) {
        return new Promise((resolve, reject) => {
            if (!db) {
                mockDb.voteReasons[username] = reasons;
                resolve(true);
                return;
            }
            
            const transaction = db.transaction(STORES.VOTE_REASONS, 'readwrite');
            const store = transaction.objectStore(STORES.VOTE_REASONS);
            
            const request = store.put({ username, reasons });
            
            request.onsuccess = function() {
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error("Error setting vote reasons:", event.target.error);
                mockDb.voteReasons[username] = reasons; // Fallback
                resolve(false);
            };
        });
    },
    
    // Comments operations
    getComments: function() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve({...mockDb.comments});
                return;
            }
            
            const transaction = db.transaction(STORES.COMMENTS, 'readonly');
            const store = transaction.objectStore(STORES.COMMENTS);
            const request = store.getAll();
            
            request.onsuccess = function() {
                const comments = {};
                (request.result || []).forEach(item => {
                    comments[item.member] = item.comments;
                });
                resolve(comments);
            };
            
            request.onerror = function(event) {
                console.error("Error getting comments:", event.target.error);
                resolve({...mockDb.comments});
            };
        });
    },
    
    setMemberComments: function(member, comments) {
        return new Promise((resolve, reject) => {
            if (!db) {
                mockDb.comments[member] = comments;
                resolve(true);
                return;
            }
            
            const transaction = db.transaction(STORES.COMMENTS, 'readwrite');
            const store = transaction.objectStore(STORES.COMMENTS);
            
            const request = store.put({ member, comments });
            
            request.onsuccess = function() {
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error("Error setting comments:", event.target.error);
                mockDb.comments[member] = comments; // Fallback
                resolve(false);
            };
        });
    },
    
    // User comment count operations
    getUserCommentCounts: function() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve({...mockDb.userCommentCount});
                return;
            }
            
            const transaction = db.transaction(STORES.USER_COMMENT_COUNT, 'readonly');
            const store = transaction.objectStore(STORES.USER_COMMENT_COUNT);
            const request = store.getAll();
            
            request.onsuccess = function() {
                const counts = {};
                (request.result || []).forEach(item => {
                    counts[item.username] = item.count;
                });
                resolve(counts);
            };
            
            request.onerror = function(event) {
                console.error("Error getting user comment counts:", event.target.error);
                resolve({...mockDb.userCommentCount});
            };
        });
    },
    
    setUserCommentCount: function(username, count) {
        return new Promise((resolve, reject) => {
            if (!db) {
                mockDb.userCommentCount[username] = count;
                resolve(true);
                return;
            }
            
            const transaction = db.transaction(STORES.USER_COMMENT_COUNT, 'readwrite');
            const store = transaction.objectStore(STORES.USER_COMMENT_COUNT);
            
            const request = store.put({ username, count });
            
            request.onsuccess = function() {
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error("Error setting user comment count:", event.target.error);
                mockDb.userCommentCount[username] = count; // Fallback
                resolve(false);
            };
        });
    }
};

// Ensure admin user exists
async function ensureAdminExists() {
    const users = await DbOps.getUsers();
    const adminUser = { username: 'coddiano', password: '12345678910', isAdmin: true, isApproved: true };
    
    // Check if admin exists
    const adminExists = users.some(user => user.username === 'coddiano');
    
    if (!adminExists) {
        // Add admin user
        return DbOps.addUser(adminUser);
    }
    
    return true;
}

// Reset localStorage to remove test comments (run once)
const cleanupKey = 'friends4ever_cleaned_comments';
if (!localStorage.getItem(cleanupKey)) {
    localStorage.clear(); // Clear all localStorage data
    localStorage.setItem(cleanupKey, 'true');
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize IndexedDB first
    initIndexedDB().then(async (success) => {
        console.log("IndexedDB initialization:", success ? "successful" : "failed");
        
        // Then load data
        await loadDataFromStorage();
        
        // Continue with UI setup
        setupUI();
    });

    function setupUI() {
        console.log("Inizializzazione dell'interfaccia utente");
        
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
        const pendingUsersList = document.getElementById('pending-users-list');
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

        // Aggiungo anche l'handler direttamente al pulsante di submit
        document.getElementById('login-submit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Pulsante di login cliccato");
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            console.log("Tentativo di login con:", username, password);
            
            login(username, password);
        });

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Form di registrazione inviato");
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            console.log("Tentativo di registrazione con:", username, password);
            
            register(username, password);
        });

        // Aggiungo anche l'handler direttamente al pulsante di submit
        document.getElementById('register-submit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Pulsante di registrazione cliccato");
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            console.log("Tentativo di registrazione con:", username, password);
            
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

        // Initialize UI based on current login state
        updateLoginState();
        
        // Set initial vote counts
        updateVotesDisplay();
    }

    // Functions
    async function loadDataFromStorage() {
        try {
            // Load users
            mockDb.users = await DbOps.getUsers();
            
            // Load votes
            mockDb.votes = await DbOps.getVotes();
            
            // Load vote reasons
            mockDb.voteReasons = await DbOps.getVoteReasons();
            
            // Load comments
            mockDb.comments = await DbOps.getComments();
            
            // Load user comment counts
            mockDb.userCommentCount = await DbOps.getUserCommentCounts();
            
            console.log('Data loaded successfully:', mockDb);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    async function saveDataToStorage() {
        try {
            // This is just a sample implementation for one type of data
            // In a real application, you would save all types of data
            
            if (mockDb.currentUser) {
                const username = mockDb.currentUser.username;
                
                // Save votes
                if (mockDb.votes[username]) {
                    await DbOps.setUserVotes(username, mockDb.votes[username]);
                }
                
                // Save vote reasons
                if (mockDb.voteReasons[username]) {
                    await DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
                }
                
                // Save comment count
                if (mockDb.userCommentCount[username] !== undefined) {
                    await DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
                }
            }
            
            // Save all comments
            for (const member in mockDb.comments) {
                if (mockDb.comments[member] && mockDb.comments[member].length > 0) {
                    await DbOps.setMemberComments(member, mockDb.comments[member]);
                }
            }
            
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async function login(username, password) {
        console.log("Tentativo di login con:", username, password);
        
        // Debug: mostra gli utenti disponibili
        console.log("Utenti disponibili:", mockDb.users);
        
        const validUser = mockDb.users.find(user => user.username === username && user.password === password);
        console.log("Utente trovato:", validUser);
        
        if (validUser) {
            mockDb.currentUser = validUser;
            
            // Save login state
            localStorage.setItem('currentUser', username);
            
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
            // Update UI
            updateLoginState();
            updateVotesDisplay();
            
            // Update header login/logout buttons
            document.getElementById('login-btn').classList.add('hidden');
            document.getElementById('register-btn').classList.add('hidden');
            document.getElementById('user-section').classList.remove('hidden');
            
            // Show admin panel if admin
            if (validUser.isAdmin) {
                document.getElementById('user-info').textContent = 'Admin Panel';
            } else {
                document.getElementById('user-info').textContent = username;
            }
            
            console.log("Login completato con successo");
        } else {
            console.error("Login fallito: username o password errati");
            alert('Username o password non validi.');
        }
    }

    async function register(username, password) {
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
        
        // Debug: mostra gli utenti disponibili prima della registrazione
        console.log("Utenti disponibili prima della registrazione:", mockDb.users);
        
        const existingUser = mockDb.users.find(user => user.username === username);
        if (existingUser) {
            console.error("Registrazione fallita: username già in uso");
            alert('Username già in uso. Scegline un altro.');
            return;
        }
        
        const newUser = { username, password, isAdmin: false };
        const success = await DbOps.addUser(newUser);
        
        if (success) {
            // Aggiungi manualmente alla lista mockDb.users per assicurarci che sia disponibile
            mockDb.users.push(newUser);
            
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
        localStorage.removeItem('currentUser');
        
        // Update UI
        updateLoginState();
        
        // Update header login/logout buttons
        document.getElementById('login-btn').classList.remove('hidden');
        document.getElementById('register-btn').classList.remove('hidden');
        document.getElementById('user-section').classList.add('hidden');
    }

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

    async function addVote(memberName, memberCard, reason) {
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
        await DbOps.setUserVotes(username, userVotes);
        await DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
        
        updateVotesDisplay();
        
        alert(`Hai votato per ${memberName}!`);
    }

    async function removeVote(memberName, memberCard) {
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
        await removeUserCommentsForMember(username, memberName);
        
        // Save changes
        await DbOps.setUserVotes(username, userVotes);
        await DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
        
        updateVotesDisplay();
    }

    async function removeUserCommentsForMember(username, memberName) {
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
            await DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
        }
        
        // Save the updated comments
        await DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        
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

    async function deleteComment(commentId, memberName) {
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
            await DbOps.setUserCommentCount(authorUsername, mockDb.userCommentCount[authorUsername]);
        }
        
        // Remove the comment
        mockDb.comments[memberName].splice(commentIndex, 1);
        await DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        
        // Update the display
        updateMemberCommentsDisplay();
    }

    function updateAdminPanel() {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
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
        
        // Create empty pending users section
        const newPendingUsersSection = document.createElement('div');
        newPendingUsersSection.id = 'pending-users';
        newPendingUsersSection.className = 'admin-section';
        
        const pendingTitle = document.createElement('h3');
        pendingTitle.textContent = 'Utenti Registrati';
        newPendingUsersSection.appendChild(pendingTitle);
        
        const usersList = document.createElement('ul');
        usersList.id = 'pending-users-list';
        
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
                userItem.className = 'pending-user';
                
                const userInfo = document.createElement('span');
                userInfo.textContent = user.username;
                
                userItem.appendChild(userInfo);
                usersList.appendChild(userItem);
            });
        }
        
        newPendingUsersSection.appendChild(usersList);
        adminContent.appendChild(newPendingUsersSection);
        
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
    async function addCommentFromVote(memberName, text) {
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
        await DbOps.setMemberComments(memberName, mockDb.comments[memberName]);
        await DbOps.setUserCommentCount(username, mockDb.userCommentCount[username]);
    }

    // Initialize the app
    cleanupLocalStorage();
    initApp();
}); 