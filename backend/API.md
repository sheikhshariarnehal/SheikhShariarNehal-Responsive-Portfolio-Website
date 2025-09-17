# Portfolio Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require an `Authorization` header with a Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": {}, // Response data
  "error": "Error message if success is false"
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate admin user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "role": "admin"
    },
    "expiresIn": "24h"
  }
}
```

#### POST /api/auth/verify
Verify if the current JWT token is valid.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "username": "admin",
      "role": "admin"
    },
    "isAuthenticated": true
  }
}
```

#### POST /api/auth/logout
Logout the current user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/profile
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "username": "admin",
      "role": "admin",
      "loginTime": "2023-12-01T10:30:00.000Z"
    }
  }
}
```

### Projects

#### GET /api/projects
Get all projects with optional filtering and pagination.

**Query Parameters:**
- `category` (optional): Filter by category (mern, android, basicweb, lamp)
- `search` (optional): Search in project name and description
- `limit` (optional): Number of projects to return (1-100)
- `offset` (optional): Number of projects to skip

**Example:**
```
GET /api/projects?category=mern&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_1",
      "name": "Responsive Portfolio",
      "desc": "A Responsive Portfolio Website...",
      "image": "ResponsivePortfolioWebsite",
      "category": "basicweb",
      "links": {
        "view": "https://example.com",
        "code": "https://github.com/example"
      }
    }
  ],
  "total": 25,
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/projects/categories
Get all unique project categories.

**Response:**
```json
{
  "success": true,
  "data": ["android", "basicweb", "lamp", "mern"]
}
```

#### GET /api/projects/:id
Get a single project by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "project_1",
    "name": "Responsive Portfolio",
    "desc": "A Responsive Portfolio Website...",
    "image": "ResponsivePortfolioWebsite",
    "category": "basicweb",
    "links": {
      "view": "https://example.com",
      "code": "https://github.com/example"
    }
  }
}
```

#### POST /api/projects
Create a new project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Project",
  "desc": "This is a new project description",
  "category": "mern",
  "image": "new-project-image",
  "links": {
    "view": "https://example.com",
    "code": "https://github.com/example"
  }
}
```

**Validation Rules:**
- `name`: Required, 1-200 characters
- `desc`: Required, 10-1000 characters
- `category`: Required, must be one of: basicweb, mern, android, lamp
- `image`: Required, string
- `links.view`: Required, valid URL
- `links.code`: Required, valid URL

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "project_1670123456789",
    "name": "New Project",
    "desc": "This is a new project description",
    "category": "mern",
    "image": "new-project-image",
    "links": {
      "view": "https://example.com",
      "code": "https://github.com/example"
    }
  }
}
```

#### PUT /api/projects/:id
Update an existing project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST /api/projects

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "project_1",
    "name": "Updated Project Name",
    // ... other fields
  }
}
```

#### DELETE /api/projects/:id
Delete a project.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": {
    "id": "project_1",
    "name": "Deleted Project",
    // ... other fields of deleted project
  }
}
```

### File Upload

#### POST /api/projects/upload
Upload a project image.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `image`: File (image/jpeg, image/jpg, image/png, image/gif, image/webp)
- Max file size: 5MB

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "project-image_1670123456789",
    "originalName": "my-project.png",
    "size": 1024000,
    "mimetype": "image/png",
    "path": "/path/to/uploaded/file"
  }
}
```

#### GET /api/projects/images/list
Get list of all uploaded project images.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "filename": "project-image_1670123456789",
      "fullName": "project-image_1670123456789.png",
      "extension": ".png"
    }
  ],
  "total": 1
}
```

#### DELETE /api/projects/images/:filename
Delete an uploaded image.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "filename": "project-image_1670123456789",
    "deletedFile": "project-image_1670123456789.png"
  }
}
```

### Health Check

#### GET /api/health
Check server health and status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:30:00.000Z",
  "uptime": 3600.123,
  "environment": "development"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Project name is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

### 404 Not Found
```json
{
  "error": "Project not found",
  "message": "The specified project does not exist"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 per IP per window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## CORS

The API supports Cross-Origin Resource Sharing (CORS) for the following origins:
- `http://localhost:3000` (Frontend development)
- `http://localhost:8080` (Portfolio development)
- Configured production URLs

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Rate Limiting**: Prevents API abuse
3. **Input Validation**: All inputs are validated and sanitized
4. **File Upload Security**: File type and size validation
5. **CORS Configuration**: Controlled cross-origin access
6. **Security Headers**: Helmet.js for security headers

## Example Usage

### JavaScript/Fetch
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Get projects
const projectsResponse = await fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const projects = await projectsResponse.json();
```

### cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get projects (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"

# Create project
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "desc": "A test project",
    "category": "mern",
    "image": "test-image",
    "links": {
      "view": "https://example.com",
      "code": "https://github.com/example"
    }
  }'
```
