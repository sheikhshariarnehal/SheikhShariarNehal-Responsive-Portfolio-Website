const request = require('supertest');
const app = require('../server');
const projectManager = require('../utils/projectManager');

describe('Projects API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter projects by category', async () => {
      const response = await request(app)
        .get('/api/projects?category=mern')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(project => {
        expect(project.category).toBe('mern');
      });
    });

    it('should search projects', async () => {
      const response = await request(app)
        .get('/api/projects?search=portfolio')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return projects containing 'portfolio' in name or description
    });
  });

  describe('GET /api/projects/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/projects/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const newProject = {
        name: 'Test Project',
        desc: 'This is a test project for automated testing',
        category: 'mern',
        image: 'test-project',
        links: {
          view: 'https://example.com',
          code: 'https://github.com/example'
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProject.name);
      expect(response.body.data.desc).toBe(newProject.desc);
    });

    it('should reject project without authentication', async () => {
      const newProject = {
        name: 'Test Project',
        desc: 'This is a test project',
        category: 'mern',
        image: 'test-project',
        links: {
          view: 'https://example.com',
          code: 'https://github.com/example'
        }
      };

      await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect(401);
    });

    it('should reject project with invalid data', async () => {
      const invalidProject = {
        name: '', // Empty name
        desc: 'Test',
        category: 'invalid-category',
        image: 'test',
        links: {
          view: 'not-a-url',
          code: 'also-not-a-url'
        }
      };

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProject)
        .expect(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProjectId;

    beforeAll(async () => {
      // Create a test project
      const testProject = {
        name: 'Update Test Project',
        desc: 'This project will be updated',
        category: 'basicweb',
        image: 'update-test',
        links: {
          view: 'https://example.com',
          code: 'https://github.com/example'
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProject);

      testProjectId = response.body.data.id;
    });

    it('should update an existing project', async () => {
      const updatedData = {
        name: 'Updated Test Project',
        desc: 'This project has been updated',
        category: 'mern',
        image: 'updated-test',
        links: {
          view: 'https://updated-example.com',
          code: 'https://github.com/updated-example'
        }
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
    });

    it('should return 404 for non-existent project', async () => {
      const updatedData = {
        name: 'Updated Project',
        desc: 'Updated description',
        category: 'mern',
        image: 'updated',
        links: {
          view: 'https://example.com',
          code: 'https://github.com/example'
        }
      };

      await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let testProjectId;

    beforeEach(async () => {
      // Create a test project for deletion
      const testProject = {
        name: 'Delete Test Project',
        desc: 'This project will be deleted',
        category: 'android',
        image: 'delete-test',
        links: {
          view: 'https://example.com',
          code: 'https://github.com/example'
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProject);

      testProjectId = response.body.data.id;
    });

    it('should delete an existing project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
