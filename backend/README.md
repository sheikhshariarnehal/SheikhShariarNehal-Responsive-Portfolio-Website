# Portfolio Backend & Admin Dashboard

A professional backend application with admin dashboard for managing portfolio projects. Built with Node.js, Express.js, and modern web technologies.

## Features

### Backend API
- **RESTful API** for CRUD operations on projects
- **JWT Authentication** for secure admin access
- **File Upload System** for project images
- **Data Validation** and error handling
- **Rate Limiting** and security middleware
- **CORS Configuration** for cross-origin requests

### Admin Dashboard
- **Professional UI** with Bootstrap 5
- **Project Management** - Create, Read, Update, Delete projects
- **Image Upload** with drag-and-drop support
- **Search and Filtering** capabilities
- **Responsive Design** for all devices
- **Real-time Validation** and feedback

### Data Management
- Uses existing `projects/projects.json` as database
- **Automatic Backups** before any modifications
- **Data Integrity** validation and error recovery
- **Compatible Format** with existing frontend

## Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` file with your settings:
- Change `JWT_SECRET` to a secure random string
- Update `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Configure CORS URLs for your frontend

### 3. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

### 4. Access Admin Dashboard

Open your browser and go to:
- **Dashboard**: `http://localhost:5000/dashboard`
- **Login**: `http://localhost:5000/dashboard/login`

Default credentials:
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Public Endpoints
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/categories` - Get all categories
- `GET /api/health` - Health check

### Protected Endpoints (Require Authentication)
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/upload` - Upload project image

### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

## Project Structure

```
backend/
├── public/dashboard/          # Admin dashboard frontend
│   ├── assets/               # CSS, JS, and other assets
│   ├── login.html           # Login page
│   ├── admin.html           # Dashboard home
│   ├── projects.html        # Projects management
│   └── add-project.html     # Add new project
├── routes/                   # API route handlers
│   ├── auth.js              # Authentication routes
│   ├── projects.js          # Project CRUD routes
│   └── dashboard.js         # Dashboard routes
├── middleware/               # Custom middleware
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload handling
├── utils/                    # Utility functions
│   └── projectManager.js    # Project data management
├── uploads/                  # Uploaded files storage
├── backups/                  # Automatic data backups
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin123` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |
| `ALLOWED_FILE_TYPES` | Allowed image types | `image/jpeg,image/jpg,image/png,image/gif,image/webp` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `PORTFOLIO_URL` | Portfolio URL for CORS | `http://localhost:8080` |

### Security Features

- **JWT Authentication** with configurable expiration
- **Rate Limiting** to prevent abuse
- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **File Upload Validation** with type and size limits
- **Input Validation** and sanitization

## Deployment

### Production Setup

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-very-secure-secret-key
   ADMIN_PASSWORD=your-secure-password
   ```

2. **Install Dependencies**:
   ```bash
   npm ci --only=production
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

### Recommended Deployment Platforms

- **Heroku**: Easy deployment with git integration
- **DigitalOcean App Platform**: Scalable and affordable
- **AWS EC2**: Full control and customization
- **Vercel**: Serverless deployment option

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Integration with Frontend Portfolio

### API Integration

Update your frontend portfolio to fetch projects from the backend:

```javascript
// Replace static import with API call
const response = await fetch('https://your-backend-domain.com/api/projects');
const data = await response.json();
const projects = data.data;
```

### CORS Configuration

Make sure to add your portfolio domain to the CORS configuration in `.env`:

```bash
PORTFOLIO_URL=https://your-portfolio-domain.com
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS configuration in `.env`
2. **File Upload Fails**: Verify file size and type limits
3. **Authentication Issues**: Check JWT secret and token expiration
4. **Projects Not Loading**: Verify `projects.json` file path and permissions

### Logs and Debugging

Enable detailed logging in development:
```bash
NODE_ENV=development npm run dev
```

Check server logs for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue on GitHub
