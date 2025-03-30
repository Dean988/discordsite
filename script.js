// Funzioni globali
function login(username, password) {
    console.log("Tentativo di login con:", username, password);
    
    try {
        // Verifica hardcoded per l'admin
        if (username === 'coddiano' && password === '12345678910') {
            console.log("Login admin riuscito!");
            
            // Creo l'utente admin direttamente
            const adminUser = { 
                username: 'coddiano', 
                password: '12345678910', 
                isAdmin: true 
            };
            
            // Salvo l'utente corrente
            mockDb.currentUser = adminUser;
            localStorage.setItem('currentUsername', username);
            
            // Chiudi il modal
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('hidden');
            
            // Pulisci i campi
            const usernameField = document.getElementById('username');
            const passwordField = document.getElementById('password');
            if (usernameField) usernameField.value = '';
            if (passwordField) passwordField.value = '';
            
            // Aggiorna l'UI
            const showLoginBtn = document.getElementById('show-login-btn');
            const showRegisterBtn = document.getElementById('show-register-btn');
            const userInfo = document.getElementById('user-info');
            const welcomeUser = document.getElementById('welcome-user');
            const adminBtn = document.getElementById('admin-btn');
            
            if (showLoginBtn) showLoginBtn.classList.add('hidden');
            if (showRegisterBtn) showRegisterBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (welcomeUser) welcomeUser.textContent = `Benvenuto, ${username}!`;
            if (adminBtn) adminBtn.classList.remove('hidden');
            
            // Aggiorna il display dei voti
            updateVotesDisplay();
            updateLoginState();
            
            return;
        }
        
        // Controllo utente normale
        const user = DbOps.getUserByUsername(username);
        console.log("Utente trovato:", user);
        
        // Controlla se l'utente esiste tra gli utenti approvati
        if (user && user.password === password) {
            console.log("Credenziali valide, procedo con il login");
            mockDb.currentUser = user;
            
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
            if (user.isAdmin) {
                document.getElementById('admin-btn').classList.remove('hidden');
            }
            
            console.log("Login completato con successo");
            return;
        }
        
        // Controlla se l'utente è in attesa di approvazione
        const pendingUser = DbOps.getPendingUserByUsername(username);
        if (pendingUser && pendingUser.password === password) {
            console.error("Login fallito: utente in attesa di approvazione");
            alert('Il tuo account è in attesa di approvazione da parte dell\'amministratore. Riprova più tardi.');
            return;
        }
        
        // Se arriviamo qui, le credenziali non sono valide
        console.error("Login fallito: username o password errati");
        alert('Username o password non validi. Per favore riprova.');
    } catch (error) {
        // Catturiamo l'errore ma non mostriamo alcun messaggio all'utente
        console.error("Errore durante il processo di login:", error);
        // Non mostrare l'alert
    }
}

function updateVotesDisplay() {
    const username = mockDb.currentUser ? mockDb.currentUser.username : null;
    const userVotes = username ? mockDb.votes[username] || [] : [];
    
    // Reset all vote buttons and member cards
    document.querySelectorAll('.member-card').forEach(card => {
        const voteBtn = card.querySelector('.vote-btn');
        const memberName = card.dataset.member;
        
        if (voteBtn) {
            if (userVotes.includes(memberName)) {
                voteBtn.classList.add('voted');
                voteBtn.textContent = 'Votato';
            } else {
                voteBtn.classList.remove('voted');
                voteBtn.textContent = 'Vota';
            }
        }
    });
    
    // Count all votes
    const voteCount = {};
    
    Object.values(mockDb.votes).forEach(votes => {
        votes.forEach(member => {
            voteCount[member] = (voteCount[member] || 0) + 1;
        });
    });
    
    // Update vote counts
    document.querySelectorAll('.vote-count').forEach(counter => {
        const card = counter.closest('.member-card');
        const memberName = card ? card.dataset.member : null;
        
        if (memberName) {
            counter.textContent = voteCount[memberName] || 0;
        }
    });
}

function updateLoginState() {
    const votingPrompt = document.getElementById('voting-prompt');
    
    if (mockDb.currentUser) {
        if (votingPrompt) {
            votingPrompt.textContent = 'Clicca sulle immagini per vedere i commenti e votare il top scemo. Puoi votare fino a 3 membri.';
        }
    } else {
        if (votingPrompt) {
            votingPrompt.textContent = 'Accedi per votare il top scemo e vedere i commenti!';
        }
    }
}

// Initialize database with default values
let mockDb = {
    users: [
        { username: 'coddiano', password: '12345678910', isAdmin: true }
    ],
    pendingUsers: [], // Nuovi utenti in attesa di approvazione
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
    PENDING_USERS: 'friends4ever_pendingUsers', // Nuova chiave per utenti in attesa
    VOTES: 'friends4ever_votes',
    VOTE_REASONS: 'friends4ever_voteReasons',
    COMMENTS: 'friends4ever_comments',
    USER_COMMENT_COUNT: 'friends4ever_userCommentCount'
};

// Database Operations con localStorage
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
    
    // Pending users operations
    getPendingUsers: function() {
        try {
            const pendingUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_USERS));
            return pendingUsers || mockDb.pendingUsers;
        } catch (e) {
            console.error('Error getting pending users from localStorage:', e);
            return mockDb.pendingUsers;
        }
    },
    
    setPendingUsers: function(pendingUsers) {
        try {
            localStorage.setItem(STORAGE_KEYS.PENDING_USERS, JSON.stringify(pendingUsers));
            return true;
        } catch (e) {
            console.error('Error setting pending users in localStorage:', e);
            return false;
        }
    },
    
    getUserByUsername: function(username) {
        try {
            const users = this.getUsers();
            return users.find(u => u.username === username);
        } catch (e) {
            console.error('Error getting user by username:', e);
            return null;
        }
    },
    
    getPendingUserByUsername: function(username) {
        try {
            const pendingUsers = this.getPendingUsers();
            return pendingUsers.find(u => u.username === username);
        } catch (e) {
            console.error('Error getting pending user by username:', e);
            return null;
        }
    },
    
    addUser: function(user) {
        try {
            const users = this.getUsers();
            const existingUser = users.find(u => u.username === user.username);
            
            if (existingUser) {
                console.error('Username già esistente:', user.username);
                return false;
            }
            
            // Aggiungi l'utente alla lista degli utenti in attesa
            const pendingUsers = this.getPendingUsers();
            pendingUsers.push(user);
            this.setPendingUsers(pendingUsers);
            
            console.log('Utente aggiunto ai pendenti con successo:', user);
            return true;
        } catch (e) {
            console.error('Error adding user:', e);
            return false;
        }
    },
    
    // Funzione per approvare un utente in attesa
    approveUser: function(username) {
        try {
            const pendingUsers = this.getPendingUsers();
            const userIndex = pendingUsers.findIndex(u => u.username === username);
            
            if (userIndex === -1) {
                console.error('Utente in attesa non trovato:', username);
                return false;
            }
            
            const user = pendingUsers[userIndex];
            pendingUsers.splice(userIndex, 1);
            this.setPendingUsers(pendingUsers);
            
            // Aggiungi l'utente alla lista degli utenti approvati
            const users = this.getUsers();
            users.push(user);
            this.setUsers(users);
            
            console.log('Utente approvato con successo:', user);
            return true;
        } catch (e) {
            console.error('Error approving user:', e);
            return false;
        }
    },
    
    // Funzione per rifiutare un utente in attesa
    rejectUser: function(username) {
        try {
            const pendingUsers = this.getPendingUsers();
            const userIndex = pendingUsers.findIndex(u => u.username === username);
            
            if (userIndex === -1) {
                console.error('Utente in attesa non trovato:', username);
                return false;
            }
            
            pendingUsers.splice(userIndex, 1);
            this.setPendingUsers(pendingUsers);
            
            console.log('Utente rifiutato con successo:', username);
            return true;
        } catch (e) {
            console.error('Error rejecting user:', e);
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
            const commentsJSON = localStorage.getItem(STORAGE_KEYS.COMMENTS);
            return commentsJSON ? JSON.parse(commentsJSON) : {};
        } catch (e) {
            console.error('Error getting comments from localStorage:', e);
            return {};
        }
    },
    
    setComments: function(comments) {
        try {
            localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
            return true;
        } catch (e) {
            console.error('Error setting comments in localStorage:', e);
            return false;
        }
    },
    
    getCommentsByMemberId: function(memberId) {
        try {
            const comments = this.getComments();
            return comments[memberId] || [];
        } catch (e) {
            console.error('Error getting comments by member ID:', e);
            return [];
        }
    },
    
    setMemberComments: function(memberId, memberComments) {
        try {
            const comments = this.getComments();
            comments[memberId] = memberComments;
            this.setComments(comments);
            return true;
        } catch (e) {
            console.error('Error setting member comments:', e);
            return false;
        }
    },
    
    addComment: function(comment) {
        try {
            const comments = this.getComments();
            if (!comments[comment.memberId]) {
                comments[comment.memberId] = [];
            }
            comments[comment.memberId].push(comment);
            this.setComments(comments);
            return true;
        } catch (e) {
            console.error('Error adding comment:', e);
            return false;
        }
    },
    
    // User comment count operations
    getUserCommentCounts: function() {
        try {
            const countsJSON = localStorage.getItem(STORAGE_KEYS.USER_COMMENT_COUNT);
            return countsJSON ? JSON.parse(countsJSON) : {};
        } catch (e) {
            console.error('Error getting user comment counts from localStorage:', e);
            return {};
        }
    },
    
    setUserCommentCounts: function(counts) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_COMMENT_COUNT, JSON.stringify(counts));
            return true;
        } catch (e) {
            console.error('Error setting user comment counts in localStorage:', e);
            return false;
        }
    },
    
    getUserCommentCount: function(username) {
        try {
            const counts = this.getUserCommentCounts();
            return counts[username] || 0;
        } catch (e) {
            console.error('Error getting user comment count:', e);
            return 0;
        }
    },
    
    setUserCommentCount: function(username, count) {
        try {
            const counts = this.getUserCommentCounts();
            counts[username] = count;
            this.setUserCommentCounts(counts);
            return true;
        } catch (e) {
            console.error('Error setting user comment count in localStorage:', e);
            return false;
        }
    },
    
    incrementUserCommentCount: function(username) {
        try {
            const counts = this.getUserCommentCounts();
            counts[username] = (counts[username] || 0) + 1;
            this.setUserCommentCounts(counts);
            return true;
        } catch (e) {
            console.error('Error incrementing user comment count:', e);
            return false;
        }
    },
};

// Ensure admin user exists
function ensureAdminExists() {
    console.log('Verifica esistenza admin...');
    const users = DbOps.getUsers();
    const adminExists = users.some(user => user.username === 'coddiano');
    
    if (!adminExists) {
        console.log('Admin non trovato, creazione...');
        DbOps.addUser({ 
            username: 'coddiano', 
            password: '12345678910', 
            isAdmin: true 
        });
        console.log('Admin creato');
    } else {
        console.log('Admin già esistente');
    }
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initApp();
    
    function initApp() {
        console.log('Inizializzazione app...');
        
        // Ensure admin exists
        ensureAdminExists();
        
        // Load data
        loadDataFromStorage();
        
        // Setup UI
        setupUI();
        
        // Check if user is already logged in
        const savedUsername = localStorage.getItem('currentUsername');
        if (savedUsername) {
            const user = DbOps.getUserByUsername(savedUsername);
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
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Form di login inviato");
            
            // Ottieni direttamente i valori dagli input
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            if (!usernameInput || !passwordInput) {
                console.error("Input del form non trovati");
                alert("Si è verificato un errore interno. Ricarica la pagina e riprova.");
                return;
            }
            
            const username = usernameInput.value;
            const password = passwordInput.value;
            
            console.log("Tentativo di login con:", username, password);
            
            // Chiamata diretta alla funzione login
            login(username, password);
        });

        // Handler diretto al pulsante di submit
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        if (loginSubmitBtn) {
            loginSubmitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Pulsante di login cliccato");
                
                // Ottieni direttamente i valori dagli input
                const usernameInput = document.getElementById('username');
                const passwordInput = document.getElementById('password');
                
                if (!usernameInput || !passwordInput) {
                    console.error("Input del form non trovati");
                    alert("Si è verificato un errore interno. Ricarica la pagina e riprova.");
                    return;
                }
                
                const username = usernameInput.value;
                const password = passwordInput.value;
                
                console.log("Tentativo di login con:", username, password);
                
                // Chiamata diretta alla funzione login
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

        // Setup image click handlers
        document.querySelectorAll('.member-img').forEach(img => {
            img.addEventListener('click', (e) => {
                const memberCard = e.target.closest('.member-card');
                const memberName = memberCard.dataset.member;
                const memberImgSrc = e.target.src;
                
                openMemberComments(memberName, memberImgSrc);
            });
        });

        // Setup click handlers for the member names and cards
        document.querySelectorAll('.member-name').forEach(nameEl => {
            nameEl.addEventListener('click', (e) => {
                const memberCard = e.target.closest('.member-card');
                const memberName = memberCard.dataset.member;
                const memberImg = memberCard.querySelector('.member-img');
                const memberImgSrc = memberImg ? memberImg.src : '';
                
                openMemberComments(memberName, memberImgSrc);
            });
        });

        // Add click event to the entire card (except the vote button)
        document.querySelectorAll('.member-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Skip if clicking on vote button
                if (e.target.classList.contains('vote-btn') || e.target.closest('.vote-btn')) {
                    return;
                }
                
                const memberName = card.dataset.member;
                const memberImg = card.querySelector('.member-img');
                const memberImgSrc = memberImg ? memberImg.src : '';
                
                openMemberComments(memberName, memberImgSrc);
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

        // Initialize UI based on current login state
        updateLoginState();
        
        // Set initial vote counts
        updateVotesDisplay();
    }

    // Functions
    function loadDataFromStorage() {
        console.log("Caricamento e pulizia dati da localStorage");
        
        // Load users
        mockDb.users = DbOps.getUsers();
        console.log('Utenti caricati:', mockDb.users);
        
        // Load pending users
        mockDb.pendingUsers = DbOps.getPendingUsers();
        console.log('Utenti in attesa caricati:', mockDb.pendingUsers);
        
        // Assicurati che l'utente admin esista sempre
        if (!mockDb.users.some(user => user.username === 'coddiano')) {
            mockDb.users.push({ 
                username: 'coddiano', 
                password: '12345678910', 
                isAdmin: true 
            });
            DbOps.setUsers(mockDb.users);
            console.log('Utente admin creato perché mancante');
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
        
        // Pulisci vecchi dati di test che potrebbero interferire
        localStorage.removeItem('pending_users');
        localStorage.removeItem('friends4ever_pendingUsers');
        localStorage.removeItem('currentUser');
        
        console.log('Dati caricati con successo:', mockDb);
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
        
        // Check if username exists among approved users
        const existingUser = DbOps.getUserByUsername(username);
        if (existingUser) {
            console.error("Registrazione fallita: username già in uso");
            alert('Username già in uso. Scegline un altro.');
            return;
        }
        
        // Check if username exists among pending users
        const pendingUser = DbOps.getPendingUserByUsername(username);
        if (pendingUser) {
            console.error("Registrazione fallita: username già in attesa di approvazione");
            alert('Username già in attesa di approvazione. Attendi che l\'amministratore approvi la tua richiesta o scegli un altro username.');
            return;
        }
        
        const newUser = { username, password, isAdmin: false };
        const success = DbOps.addUser(newUser);
        
        if (success) {
            console.log("Registrazione in attesa di approvazione");
            
            alert('Registrazione completata! La tua richiesta è in attesa di approvazione da parte dell\'amministratore. Riprova ad accedere più tardi.');
            
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
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

    function openMemberComments(memberName, memberImgSrc) {
        mockDb.currentMember = memberName;
        
        const commentsModal = document.getElementById('comments-modal');
        const commentsModalTitle = document.getElementById('comments-modal-title');
        const memberModalImage = document.getElementById('member-modal-image');
        const memberCommentsContainer = document.getElementById('member-comments-container');
        const memberCommentFormContainer = document.getElementById('member-comment-form-container');
        const memberCommentNotVoted = document.getElementById('member-comment-not-voted');
        const memberCommentLimitReached = document.getElementById('member-comment-limit-reached');
        
        // Set modal title and image
        commentsModalTitle.textContent = `Commenti su ${memberName}`;
        memberModalImage.src = memberImgSrc;
        
        // Clear previous comments
        memberCommentsContainer.innerHTML = '';
        
        // Update comments display
        updateMemberCommentsDisplay();
        
        // Update comment form visibility
        if (!mockDb.currentUser) {
            memberCommentFormContainer.classList.add('hidden');
            memberCommentNotVoted.classList.add('hidden');
            memberCommentLimitReached.classList.add('hidden');
            
            const loginMessage = document.createElement('p');
            loginMessage.textContent = 'Accedi per commentare!';
            loginMessage.style.textAlign = 'center';
            memberCommentsContainer.appendChild(loginMessage);
        } else {
            const username = mockDb.currentUser.username;
            const hasVoted = mockDb.votes[username] && mockDb.votes[username].includes(memberName);
            const commentCount = mockDb.userCommentCount[username] || 0;
            
            if (!hasVoted) {
                memberCommentFormContainer.classList.add('hidden');
                memberCommentNotVoted.classList.remove('hidden');
                memberCommentLimitReached.classList.add('hidden');
            } else if (commentCount >= 3) {
                memberCommentFormContainer.classList.add('hidden');
                memberCommentNotVoted.classList.add('hidden');
                memberCommentLimitReached.classList.remove('hidden');
            } else {
                memberCommentFormContainer.classList.remove('hidden');
                memberCommentNotVoted.classList.add('hidden');
                memberCommentLimitReached.classList.add('hidden');
            }
        }
        
        // Show modal
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
        
        // Verifica se l'utente ha commenti per questo membro prima di rimuovere il voto
        const hasComments = mockDb.comments[memberName] && 
                           mockDb.comments[memberName].some(comment => comment.author === username);
        
        if (hasComments) {
            const conferma = confirm(`Rimuovendo il voto per ${memberName}, verranno eliminati anche tutti i tuoi commenti. Vuoi continuare?`);
            if (!conferma) return;
        }
        
        userVotes.splice(voteIndex, 1);
        
        // Remove the vote reason
        if (mockDb.voteReasons[username] && mockDb.voteReasons[username][memberName]) {
            delete mockDb.voteReasons[username][memberName];
        }
        
        // Update button and display
        if (memberCard) {
            const voteBtn = memberCard.querySelector('.vote-btn');
            if (voteBtn) {
                voteBtn.textContent = 'Vota';
                voteBtn.classList.remove('voted');
            }
            
            // Update vote count immediately on this specific card
            const voteCountEl = memberCard.querySelector('.vote-count');
            if (voteCountEl) {
                const currentCount = parseInt(voteCountEl.textContent || '0');
                voteCountEl.textContent = Math.max(0, currentCount - 1);
            }
        }
        
        // Remove user's comments for this member
        removeUserCommentsForMember(username, memberName);
        
        // Save changes
        DbOps.setUserVotes(username, userVotes);
        DbOps.setUserVoteReasons(username, mockDb.voteReasons[username]);
        
        // Update all vote displays to ensure consistency
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
        
        // Non mostriamo l'alert qui perché già mostrato nella funzione removeVote tramite il confirm
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
        
        // Create pending users section
        const pendingUsersSection = document.createElement('div');
        pendingUsersSection.id = 'pending-users';
        pendingUsersSection.className = 'admin-section';
        
        const pendingUsersTitle = document.createElement('h3');
        pendingUsersTitle.textContent = 'Utenti in Attesa di Approvazione';
        pendingUsersSection.appendChild(pendingUsersTitle);
        
        const pendingUsersList = document.createElement('ul');
        pendingUsersList.id = 'pending-users-list';
        
        // Get pending users
        mockDb.pendingUsers = DbOps.getPendingUsers();
        
        if (mockDb.pendingUsers.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Nessun utente in attesa di approvazione.';
            emptyMessage.style.color = '#999';
            pendingUsersList.appendChild(emptyMessage);
        } else {
            mockDb.pendingUsers.forEach(user => {
                const userItem = document.createElement('li');
                userItem.className = 'pending-user';
                
                const userInfo = document.createElement('span');
                userInfo.textContent = user.username;
                userItem.appendChild(userInfo);
                
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'admin-buttons';
                
                const approveBtn = document.createElement('button');
                approveBtn.className = 'admin-approve';
                approveBtn.textContent = 'Approva';
                approveBtn.addEventListener('click', () => {
                    const success = DbOps.approveUser(user.username);
                    if (success) {
                        alert(`Utente ${user.username} approvato con successo!`);
                        updateAdminPanel(); // Refresh panel
                    } else {
                        alert(`Errore nell'approvazione dell'utente ${user.username}.`);
                    }
                });
                
                const rejectBtn = document.createElement('button');
                rejectBtn.className = 'admin-reject';
                rejectBtn.textContent = 'Rifiuta';
                rejectBtn.addEventListener('click', () => {
                    const confirmed = confirm(`Sei sicuro di voler rifiutare l'utente ${user.username}?`);
                    if (confirmed) {
                        const success = DbOps.rejectUser(user.username);
                        if (success) {
                            alert(`Utente ${user.username} rifiutato.`);
                            updateAdminPanel(); // Refresh panel
                        } else {
                            alert(`Errore nel rifiuto dell'utente ${user.username}.`);
                        }
                    }
                });
                
                buttonsContainer.appendChild(approveBtn);
                buttonsContainer.appendChild(rejectBtn);
                userItem.appendChild(buttonsContainer);
                
                pendingUsersList.appendChild(userItem);
            });
        }
        
        pendingUsersSection.appendChild(pendingUsersList);
        adminContent.appendChild(pendingUsersSection);
        
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
        const votersHeader = document.createElement('th');
        votersHeader.textContent = 'Chi ha votato';
        
        tableHeader.appendChild(memberHeader);
        tableHeader.appendChild(votesHeader);
        tableHeader.appendChild(votersHeader);
        votesTable.appendChild(tableHeader);
        
        members.forEach(member => {
            let voteCount = 0;
            let voters = [];
            
            // Count votes for this member and collect voter usernames
            Object.entries(mockDb.votes).forEach(([username, votes]) => {
                if (votes.includes(member)) {
                    voteCount++;
                    voters.push(username);
                }
            });
            
            const tableRow = document.createElement('tr');
            
            const memberCell = document.createElement('td');
            memberCell.textContent = member;
            
            const votesCell = document.createElement('td');
            votesCell.textContent = voteCount;
            
            const votersCell = document.createElement('td');
            votersCell.textContent = voters.join(', ') || 'Nessuno';
            
            tableRow.appendChild(memberCell);
            tableRow.appendChild(votesCell);
            tableRow.appendChild(votersCell);
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
        const commentAuthorHeader = document.createElement('th');
        commentAuthorHeader.textContent = 'Autore';
        const commentDateHeader = document.createElement('th');
        commentDateHeader.textContent = 'Data';
        const commentActionHeader = document.createElement('th');
        commentActionHeader.textContent = 'Azioni';
        
        commentsHeader.appendChild(memberCommentHeader);
        commentsHeader.appendChild(commentTextHeader);
        commentsHeader.appendChild(commentAuthorHeader);
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
                    
                    const authorCell = document.createElement('td');
                    authorCell.textContent = comment.author || 'Anonimo';
                    
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
                    commentRow.appendChild(authorCell);
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

    // Setup member cards
    setupMemberCards();
    
    // Setup vote and comment modals
    document.getElementById('vote-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitVote();
    });
    
    document.getElementById('comment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitComment();
    });
    
    document.getElementById('close-comments-btn').addEventListener('click', function() {
        document.getElementById('comments-modal').classList.add('hidden');
    });
});

// Aggiungi gli event listener per le immagini e i nomi dei membri
function setupMemberCards() {
    console.log("Configurazione delle card dei membri...");
    
    // Ottieni tutte le immagini dei membri
    const memberImages = document.querySelectorAll('.member-img');
    const memberNames = document.querySelectorAll('.member-name');
    
    // Aggiungi event listener alle immagini
    memberImages.forEach(img => {
        img.addEventListener('click', function() {
            // Ottieni il nome del membro dal data attribute
            const memberName = this.closest('.member-card').getAttribute('data-member');
            const memberImgSrc = this.src;
            openMemberComments(memberName, memberImgSrc);
        });
    });
    
    // Aggiungi event listener ai nomi
    memberNames.forEach(name => {
        name.addEventListener('click', function() {
            // Ottieni il nome del membro dal data attribute
            const memberName = this.closest('.member-card').getAttribute('data-member');
            const memberImg = this.closest('.member-card').querySelector('.member-img');
            const memberImgSrc = memberImg ? memberImg.src : '';
            openMemberComments(memberName, memberImgSrc);
        });
    });
    
    // Aggiungi event listener ai pulsanti di voto
    const voteButtons = document.querySelectorAll('.vote-btn');
    voteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Verifica che l'utente sia loggato
            if (!mockDb.currentUser) {
                alert('Devi accedere prima di poter votare!');
                return;
            }
            
            const memberCard = e.target.closest('.member-card');
            const memberName = memberCard.dataset.member;
            
            // Se l'utente ha già votato per questo membro, rimuovi il voto
            if (button.classList.contains('voted')) {
                removeVote(memberName, memberCard);
                return;
            }
            
            // Se l'utente non ha ancora votato per questo membro, mostra il modal per la motivazione
            mockDb.pendingVoteMember = memberName;
            mockDb.pendingVoteCard = memberCard;
            document.getElementById('vote-member-name').textContent = memberName;
            document.getElementById('vote-reason-text').value = '';
            document.getElementById('vote-reason-modal').classList.remove('hidden');
        });
    });
}

// Funzione per aprire i commenti di un membro
function openComments(memberId) {
    // Redirecting to the original openMemberComments function
    // Ottengo il nome del membro e l'immagine dalla card
    const memberCard = document.querySelector(`.member-card[data-member="${memberId}"]`);
    if (memberCard) {
        const memberName = memberId; // Il memberID è già il nome del membro
        const memberImg = memberCard.querySelector('.member-img');
        const memberImgSrc = memberImg ? memberImg.src : '';
        
        openMemberComments(memberName, memberImgSrc);
    } else {
        console.error(`Membro non trovato con ID: ${memberId}`);
    }
}

// Funzione per inviare un commento
function submitComment() {
    // Verifica che l'utente sia loggato
    if (!mockDb.currentUser) {
        alert('Devi accedere prima di poter commentare!');
        return;
    }
    
    // Ottieni i dati dal form
    const memberId = document.getElementById('comment-member-id').value;
    const commentText = document.getElementById('comment-text').value.trim();
    
    if (!commentText) {
        alert('Per favore, inserisci un commento.');
        return;
    }
    
    // Verifica il numero di commenti per questo utente
    const userCommentCount = DbOps.getUserCommentCount(mockDb.currentUser.username);
    if (userCommentCount >= 5) {
        alert('Hai raggiunto il limite massimo di 5 commenti.');
        return;
    }
    
    // Crea il nuovo commento
    const newComment = {
        id: `comment_${Date.now()}`,
        memberId: memberId,
        username: mockDb.currentUser.username,
        text: commentText,
        timestamp: Date.now()
    };
    
    // Aggiungi il commento
    DbOps.addComment(newComment);
    
    // Incrementa il contatore dei commenti dell'utente
    DbOps.incrementUserCommentCount(mockDb.currentUser.username);
    
    // Aggiorna la visualizzazione dei commenti
    openComments(memberId);
    
    // Pulisci il campo di testo
    document.getElementById('comment-text').value = '';
} 