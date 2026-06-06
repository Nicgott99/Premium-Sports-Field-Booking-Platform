# Testing Guide

## Testing Strategy

The Premium Sports Field Booking Platform uses a multi-layered testing approach to ensure code quality and reliability.

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Fast execution
- High coverage target: 80%+
- Framework: Jest

### Integration Tests
- Test multiple components working together
- Test API endpoints with mocked database
- Framework: Jest + Supertest

### End-to-End (E2E) Tests
- Test complete user workflows
- Real browser and server
- Slower but comprehensive
- Framework: Cypress or Playwright

### Performance Tests
- API response time benchmarks
- Load testing
- Memory usage monitoring

## Backend Testing

### Setup

```bash
cd backend
npm install
npm run test
```

### Test Structure

```
backend/
├── __tests__/
│   ├── auth.test.js
│   ├── users.test.js
│   ├── fields.test.js
│   ├── bookings.test.js
│   └── payments.test.js
└── [source code]
```

### Example Backend Test

```javascript
import request from 'supertest';
import app from '../server.js';

describe('User Authentication', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      // Duplicate attempt
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'DifferentPassword123!',
          firstName: 'Jane',
          lastName: 'Smith'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### Running Backend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test auth.test.js

# Run with coverage report
npm run test:coverage

# Run tests with verbose output
npm test -- --verbose
```

## Frontend Testing

### Setup

```bash
cd frontend
npm install
npm test
```

### Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── Button.test.jsx
│   │       ├── Card.test.jsx
│   │       └── Modal.test.jsx
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useAuth.test.js
│   └── pages/
│       └── __tests__/
│           └── Home.test.jsx
```

### Example Frontend Test

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm.jsx';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LoginForm Component', () => {
  it('should render login form', () => {
    renderWithRouter(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should display validation errors', async () => {
    renderWithRouter(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const mockSubmit = jest.fn();
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test
npm test LoginForm.test.jsx

# Generate coverage report
npm run test:coverage

# Update snapshots
npm test -- --updateSnapshot
```

## Coverage Requirements

### Target Coverage

| Type | Target |
|------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Viewing Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Mocking & Fixtures

### Mocking API Calls

```javascript
// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true })
  })
);

// Clear mock after each test
afterEach(() => {
  jest.clearAllMocks();
});
```

### Test Fixtures

```javascript
// fixtures/users.js
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user'
};

export const mockUsers = [mockUser, { ...mockUser, id: '456' }];
```

## Testing Best Practices

### 1. Write Testable Code
- Keep functions small and focused
- Avoid global state
- Use dependency injection
- Make side effects obvious

### 2. Test Behavior, Not Implementation
```javascript
// ❌ Bad - Testing implementation
expect(component.state.isLoading).toBe(false);

// ✅ Good - Testing behavior
expect(screen.queryByRole('spinner')).not.toBeInTheDocument();
```

### 3. Use Descriptive Test Names
```javascript
// ❌ Bad
it('works', () => { });

// ✅ Good
it('should display user profile when data is loaded', () => { });
```

### 4. Arrange-Act-Assert Pattern
```javascript
it('should update user profile', async () => {
  // Arrange
  const user = { id: '1', name: 'John' };
  const { getByRole } = render(<UserProfile user={user} />);

  // Act
  fireEvent.click(getByRole('button', { name: /edit/i }));
  fireEvent.change(getByRole('textbox'), { target: { value: 'Jane' } });
  fireEvent.click(getByRole('button', { name: /save/i }));

  // Assert
  expect(await screen.findByText('Jane')).toBeInTheDocument();
});
```

### 5. Test Edge Cases
```javascript
it('should handle empty data', () => {
  render(<UserList users={[]} />);
  expect(screen.getByText(/no users found/i)).toBeInTheDocument();
});

it('should handle errors gracefully', async () => {
  const error = new Error('API error');
  jest.spyOn(api, 'getUsers').mockRejectedValue(error);
  
  render(<UserList />);
  expect(await screen.findByText(/error loading users/i)).toBeInTheDocument();
});
```

## Continuous Integration Testing

Tests run automatically on:
- Every commit to any branch
- Every pull request
- Before deployment to production

### GitHub Actions Configuration

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:coverage
```

## Debugging Tests

### Debug Output
```javascript
import { screen } from '@testing-library/react';

it('should display user info', () => {
  render(<UserProfile />);
  screen.debug(); // Print DOM to console
});
```

### Using Node Inspector
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

### Watch Mode with Debugging
```bash
npm test -- --watch --verbose
```

## Performance Testing

### API Response Time

```javascript
it('should respond within 200ms', async () => {
  const startTime = performance.now();
  await request(app).get('/api/health');
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(200);
});
```

### Component Render Time

```javascript
it('should render within 100ms', () => {
  const startTime = performance.now();
  render(<LargeList items={items} />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100);
});
```

## Testing Checklist

- [ ] All new code has tests
- [ ] Tests pass locally
- [ ] Coverage meets 80% target
- [ ] Edge cases tested
- [ ] Error scenarios covered
- [ ] Performance acceptable
- [ ] No flaky tests
- [ ] CI/CD passes
- [ ] Code review approved

---

**Last Updated:** March 2024
**Version:** 1.0.0
