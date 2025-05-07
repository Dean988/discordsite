# Friends4Ever - Voting and Commenting System

A web application that allows users to vote and comment on group members. The system includes user registration, admin approval, voting with reasons, and commenting functionality.

## Features

- **User Management**
  - User registration with admin approval
  - Secure login system
  - Admin panel for user management
  - User authentication and authorization

- **Voting System**
  - Vote for up to 3 members
  - Add reasons for votes
  - Remove votes (with associated comments)
  - Real-time vote count updates

- **Commenting System**
  - Comment on members you've voted for
  - Up to 3 comments per user
  - Anonymous comments visible to all users
  - Admin can delete inappropriate comments

- **Admin Features**
  - Approve/reject new user registrations
  - View all registered users
  - Monitor voting statistics
  - Manage comments
  - Delete inappropriate content

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Dean988/simulationgemini2.5.git
```

2. Open `index.html` in your web browser

## Usage

### For Users
1. Register a new account
2. Wait for admin approval
3. Log in with approved credentials
4. Vote for members (up to 3)
5. Add comments to members you've voted for
6. View comments by clicking on member images/names

### For Admins
1. Log in with admin credentials (default: username: coddiano, password: 12345678910)
2. Access admin panel
3. Approve/reject new user registrations
4. Monitor voting statistics
5. Manage comments

## Technical Details

- Built with vanilla JavaScript
- Uses localStorage for data persistence
- Responsive design
- No external dependencies

## Security Features

- Password protection
- Admin approval system
- Comment moderation
- Vote validation
- User session management

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
