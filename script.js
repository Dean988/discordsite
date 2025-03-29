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

// Firebase configuration - IMPORTANTE: sostituire con le vostre credenziali Firebase!
const firebaseConfig = {
    apiKey: "AIzaSyBrXoMdW-HxdHfJ-MzZTCIYL0XcLx8c8eM",
    authDomain: "friends4ever-topscemo.firebaseapp.com",
    projectId: "friends4ever-topscemo",
    storageBucket: "friends4ever-topscemo.appspot.com",
    messagingSenderId: "658901472382",
    appId: "1:658901472382:web:5a1932e9e5d98c7896da9b",
    databaseURL: "https://friends4ever-topscemo-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
let firebaseApp, firebaseDB;
let firebaseInitialized = false;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseDB = firebase.database();
    firebaseInitialized = true;
    console.log("Firebase initialized successfully!");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Se Firebase non è disponibile, useremo solo localStorage
    firebaseInitialized = false;
}

// Real Backend with Firebase
const Backend = {
    // User Service
    UserService: {
        getPendingUsers: async function() {
            console.log("Backend: Fetching pending users");
            
            if (firebaseInitialized) {
                try {
                    const snapshot = await firebaseDB.ref('pendingUsers').once('value');
                    const pendingUsers = snapshot.val() || [];
                    return Array.isArray(pendingUsers) ? pendingUsers : Object.values(pendingUsers);
                } catch (error) {
                    console.error("Error fetching pending users from Firebase:", error);
                    // Fallback to localStorage
                    return JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                }
            } else {
                // Use localStorage if Firebase is not available
                return JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
            }
        },
        
        addPendingUser: async function(user) {
            console.log("Backend: Adding pending user", user);
            
            if (firebaseInitialized) {
                try {
                    // Get current pending users
                    const pendingUsers = await this.getPendingUsers();
                    
                    // Check if user already exists
                    if (pendingUsers.some(u => u.username === user.username)) {
                        console.log("Backend: User already exists");
                        return false;
                    }
                    
                    // Add the new user
                    pendingUsers.push(user);
                    
                    // Save to Firebase
                    await firebaseDB.ref('pendingUsers').set(pendingUsers);
                    
                    // Also save to localStorage as a backup
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                    
                    console.log("Backend: Pending users updated in Firebase", pendingUsers);
                    return true;
                } catch (error) {
                    console.error("Error adding pending user to Firebase:", error);
                    
                    // Fallback to localStorage
                    const localPendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                    if (localPendingUsers.some(u => u.username === user.username)) {
                        return false;
                    }
                    localPendingUsers.push(user);
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(localPendingUsers));
                    
                    return true;
                }
            } else {
                // Use localStorage if Firebase is not available
                const pendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                
                // Check if user already exists
                if (pendingUsers.some(u => u.username === user.username)) {
                    console.log("Backend: User already exists");
                    return false;
                }
                
                // Add the new user
                pendingUsers.push(user);
                
                // Save to localStorage
                localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                
                console.log("Backend: Pending users updated in localStorage", pendingUsers);
                return true;
            }
        },
        
        approveUser: async function(username) {
            console.log("Backend: Approving user", username);
            
            if (firebaseInitialized) {
                try {
                    // Get pending users from Firebase
                    const pendingUsers = await this.getPendingUsers();
                    
                    // Find the user to approve
                    const userIndex = pendingUsers.findIndex(u => u.username === username);
                    if (userIndex === -1) {
                        console.log("Backend: User not found");
                        return false;
                    }
                    
                    // Get the user and mark as approved
                    const user = pendingUsers[userIndex];
                    user.isApproved = true;
                    
                    // Remove from pending users
                    pendingUsers.splice(userIndex, 1);
                    
                    // Save updated pending users list
                    await firebaseDB.ref('pendingUsers').set(pendingUsers);
                    
                    // Get current approved users
                    const snapshot = await firebaseDB.ref('users').once('value');
                    const approvedUsers = snapshot.val() || [];
                    const usersList = Array.isArray(approvedUsers) ? approvedUsers : Object.values(approvedUsers);
                    
                    // Add the user to approved users
                    usersList.push(user);
                    
                    // Save approved users
                    await firebaseDB.ref('users').set(usersList);
                    
                    // Update local storage too as a fallback
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                    
                    // Update approved users in localStorage
                    const localData = JSON.parse(localStorage.getItem('friends4ever_data') || '{}');
                    localData.users = localData.users || [];
                    localData.users.push(user);
                    localStorage.setItem('friends4ever_data', JSON.stringify(localData));
                    
                    console.log("Backend: User approved and added to users list in Firebase");
                    return true;
                } catch (error) {
                    console.error("Error approving user in Firebase:", error);
                    
                    // Fallback to localStorage
                    const localPendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                    const userIndex = localPendingUsers.findIndex(u => u.username === username);
                    
                    if (userIndex === -1) {
                        return false;
                    }
                    
                    const user = localPendingUsers[userIndex];
                    user.isApproved = true;
                    
                    localPendingUsers.splice(userIndex, 1);
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(localPendingUsers));
                    
                    const localData = JSON.parse(localStorage.getItem('friends4ever_data') || '{}');
                    localData.users = localData.users || [];
                    localData.users.push(user);
                    localStorage.setItem('friends4ever_data', JSON.stringify(localData));
                    
                    return true;
                }
            } else {
                // Use localStorage if Firebase is not available
                const pendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                
                // Find the user to approve
                const userIndex = pendingUsers.findIndex(u => u.username === username);
                if (userIndex === -1) {
                    console.log("Backend: User not found");
                    return false;
                }
                
                // Get the user and mark as approved
                const user = pendingUsers[userIndex];
                user.isApproved = true;
                
                // Remove from pending users
                pendingUsers.splice(userIndex, 1);
                localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                
                // Add to approved users
                const currentData = JSON.parse(localStorage.getItem('friends4ever_data') || '{}');
                currentData.users = currentData.users || [];
                currentData.users.push(user);
                localStorage.setItem('friends4ever_data', JSON.stringify(currentData));
                
                console.log("Backend: User approved and added to users list in localStorage");
                return true;
            }
        },
        
        rejectUser: async function(username) {
            console.log("Backend: Rejecting user", username);
            
            if (firebaseInitialized) {
                try {
                    // Get pending users from Firebase
                    const pendingUsers = await this.getPendingUsers();
                    
                    // Find the user to reject
                    const userIndex = pendingUsers.findIndex(u => u.username === username);
                    if (userIndex === -1) {
                        console.log("Backend: User not found");
                        return false;
                    }
                    
                    // Remove the user
                    pendingUsers.splice(userIndex, 1);
                    
                    // Save updated pending users list
                    await firebaseDB.ref('pendingUsers').set(pendingUsers);
                    
                    // Update local storage too as a fallback
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                    
                    console.log("Backend: User rejected and removed from pending list in Firebase");
                    return true;
                } catch (error) {
                    console.error("Error rejecting user in Firebase:", error);
                    
                    // Fallback to localStorage
                    const localPendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                    const userIndex = localPendingUsers.findIndex(u => u.username === username);
                    
                    if (userIndex === -1) {
                        return false;
                    }
                    
                    localPendingUsers.splice(userIndex, 1);
                    localStorage.setItem('friends4ever_pending_users', JSON.stringify(localPendingUsers));
                    
                    return true;
                }
            } else {
                // Use localStorage if Firebase is not available
                const pendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
                
                // Find the user to reject
                const userIndex = pendingUsers.findIndex(u => u.username === username);
                if (userIndex === -1) {
                    console.log("Backend: User not found");
                    return false;
                }
                
                // Remove the user
                pendingUsers.splice(userIndex, 1);
                localStorage.setItem('friends4ever_pending_users', JSON.stringify(pendingUsers));
                
                console.log("Backend: User rejected and removed from pending list in localStorage");
                return true;
            }
        }
    }
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
    async function loadDataFromStorage() {
        // Always load base data from localStorage first
        const savedData = localStorage.getItem('friends4ever_data');
        
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Merge salvati con default
                mockDb.users = parsedData.users || mockDb.users;
                mockDb.votes = parsedData.votes || {};
                mockDb.voteReasons = parsedData.voteReasons || {};
                mockDb.comments = parsedData.comments || {};
                mockDb.userCommentCount = parsedData.userCommentCount || {};
                
                console.log('Base data loaded from localStorage:', parsedData);
            } catch (error) {
                console.error('Error parsing data from localStorage:', error);
            }
        }
        
        // Try to load data from Firebase if available
        if (firebaseInitialized) {
            try {
                // Load users
                const usersSnapshot = await firebaseDB.ref('users').once('value');
                const firebaseUsers = usersSnapshot.val();
                if (firebaseUsers) {
                    mockDb.users = Array.isArray(firebaseUsers) ? firebaseUsers : Object.values(firebaseUsers);
                }
                
                // Load pending users
                mockDb.pendingUsers = await Backend.UserService.getPendingUsers();
                
                // Load other data if needed
                const votesSnapshot = await firebaseDB.ref('votes').once('value');
                const firebaseVotes = votesSnapshot.val();
                if (firebaseVotes) {
                    mockDb.votes = firebaseVotes;
                }
                
                const voteReasonsSnapshot = await firebaseDB.ref('voteReasons').once('value');
                const firebaseVoteReasons = voteReasonsSnapshot.val();
                if (firebaseVoteReasons) {
                    mockDb.voteReasons = firebaseVoteReasons;
                }
                
                const commentsSnapshot = await firebaseDB.ref('comments').once('value');
                const firebaseComments = commentsSnapshot.val();
                if (firebaseComments) {
                    mockDb.comments = firebaseComments;
                }
                
                const userCommentCountSnapshot = await firebaseDB.ref('userCommentCount').once('value');
                const firebaseUserCommentCount = userCommentCountSnapshot.val();
                if (firebaseUserCommentCount) {
                    mockDb.userCommentCount = firebaseUserCommentCount;
                }
                
                console.log('Data loaded from Firebase:', mockDb);
            } catch (error) {
                console.error('Error loading data from Firebase:', error);
                // If Firebase fails, we'll use the data loaded from localStorage
            }
        } else {
            // If Firebase is not available, load pending users from localStorage
            mockDb.pendingUsers = JSON.parse(localStorage.getItem('friends4ever_pending_users') || '[]');
        }
        
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
        
        console.log('Final data state after loading:', mockDb);
        
        // Salva i dati per aggiornare le modifiche all'admin
        saveDataToStorage();
    }
    
    async function saveDataToStorage() {
        const dataToSave = {
            users: mockDb.users,
            votes: mockDb.votes,
            voteReasons: mockDb.voteReasons,
            comments: mockDb.comments,
            userCommentCount: mockDb.userCommentCount
        };
        
        // Save to localStorage first as a fallback
        try {
            localStorage.setItem('friends4ever_data', JSON.stringify(dataToSave));
            console.log('Data saved to localStorage:', dataToSave);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
        
        // Then try to save to Firebase if available
        if (firebaseInitialized) {
            try {
                await firebaseDB.ref('users').set(dataToSave.users);
                await firebaseDB.ref('votes').set(dataToSave.votes);
                await firebaseDB.ref('voteReasons').set(dataToSave.voteReasons);
                await firebaseDB.ref('comments').set(dataToSave.comments);
                await firebaseDB.ref('userCommentCount').set(dataToSave.userCommentCount);
                
                console.log('Data saved to Firebase successfully');
            } catch (error) {
                console.error('Error saving data to Firebase:', error);
                // We still have the data in localStorage as a backup
            }
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
        
        // Add user to pending via backend
        const newUser = {
            username: username,
            password: password,
            isAdmin: false,
            isApproved: false
        };
        
        console.log('Adding user to pending:', newUser);
        
        // Usa il backend simulato per aggiungere l'utente
        const added = Backend.UserService.addPendingUser(newUser);
        
        if (added) {
            // Aggiorna anche il mockDb locale
            mockDb.pendingUsers = Backend.UserService.getPendingUsers();
            
            // Show confirmation and close modal
            alert('Registrazione completata! Attendi l\'approvazione dell\'amministratore.');
            registerModal.classList.add('hidden');
            registerForm.reset();
            
            // Update UI if admin is logged in
            if (mockDb.currentUser && mockDb.currentUser.isAdmin) {
                updatePendingUsersList();
            }
        } else {
            alert('Errore nella registrazione. Riprova.');
        }
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

    async function updatePendingUsersList() {
        if (!mockDb.currentUser || !mockDb.currentUser.isAdmin) {
            return;
        }
        
        console.log('Updating pending users list. Current pending users:', mockDb.pendingUsers);
        
        // Ricarica gli utenti in attesa dal backend
        mockDb.pendingUsers = await Backend.UserService.getPendingUsers();
        console.log('Refreshed pending users from backend:', mockDb.pendingUsers);
        
        pendingUsersList.innerHTML = '';
        
        if (mockDb.pendingUsers.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Non ci sono utenti in attesa di approvazione.';
            emptyMessage.style.color = '#999';
            pendingUsersList.appendChild(emptyMessage);
            return;
        }
        
        mockDb.pendingUsers.forEach((user) => {
            console.log('Processing pending user:', user);
            
            const userItem = document.createElement('li');
            userItem.className = 'pending-user';
            
            const userInfo = document.createElement('span');
            userInfo.textContent = user.username;
            
            const approveBtn = document.createElement('button');
            approveBtn.className = 'approve-btn';
            approveBtn.textContent = 'Approva';
            approveBtn.addEventListener('click', () => {
                approveUser(user.username);
            });
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'reject-btn';
            rejectBtn.textContent = 'Rifiuta';
            rejectBtn.addEventListener('click', () => {
                rejectUser(user.username);
            });
            
            userItem.appendChild(userInfo);
            userItem.appendChild(approveBtn);
            userItem.appendChild(rejectBtn);
            
            pendingUsersList.appendChild(userItem);
        });
        
        console.log('Updated pending users list with', mockDb.pendingUsers.length, 'users');
    }

    async function approveUser(username) {
        console.log('Approving user:', username);
        const success = await Backend.UserService.approveUser(username);
        
        if (success) {
            // Ricarica i dati
            await loadDataFromStorage();
            updatePendingUsersList();
            alert(`L'utente ${username} è stato approvato.`);
        } else {
            alert('Errore nell\'approvazione dell\'utente.');
        }
    }

    async function rejectUser(username) {
        console.log('Rejecting user:', username);
        const success = await Backend.UserService.rejectUser(username);
        
        if (success) {
            // Aggiorna l'array degli utenti in attesa
            mockDb.pendingUsers = await Backend.UserService.getPendingUsers();
            updatePendingUsersList();
            alert(`L'utente ${username} è stato rifiutato.`);
        } else {
            alert('Errore nel rifiutare l\'utente.');
        }
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
    
    // Check for pending users if admin is logged in
    if (mockDb.currentUser && mockDb.currentUser.isAdmin) {
        updatePendingUsersList();
    }
    
    // Listen for real-time updates from Firebase if initialized
    if (firebaseInitialized) {
        // Listen for changes in pending users
        firebaseDB.ref('pendingUsers').on('value', (snapshot) => {
            console.log('Real-time update for pending users received');
            const pendingUsers = snapshot.val() || [];
            mockDb.pendingUsers = Array.isArray(pendingUsers) ? pendingUsers : Object.values(pendingUsers);
            
            // Update UI if admin is logged in
            if (mockDb.currentUser && mockDb.currentUser.isAdmin) {
                updatePendingUsersList();
            }
        });
    }
}); 