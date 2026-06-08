# Contributing to Premium Sports Field Booking Platform

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Table of Contents

- [Development Setup](#development-setup)
- [Development Process](#development-process)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Proposing Features](#proposing-features)
- [License](#license)

## Development Setup

### Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- MongoDB v6.0 or higher
- Redis server
- Git

### Local Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform.git
   cd Premium-Sports-Field-Booking-Platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure .env with your local settings
   npm run dev
   ```

3. **Frontend Setup (in a new terminal)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database Setup**
   - Ensure MongoDB is running locally or use MongoDB Atlas
   - Run seeder: `cd backend && npm run seed`

The application will be accessible at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## Development Process

We use GitHub to host code, track issues and feature requests, as well as accept pull requests.

### Workflow

1. **Check existing issues** - Before starting work, check if there's an existing issue for your change
2. **Create an issue** - If no issue exists, create one describing the problem/feature
3. **Create a branch** - Follow branch naming conventions (see below)
4. **Make changes** - Implement your changes following code style guidelines
5. **Test locally** - Ensure all tests pass and no linting errors
6. **Push and create PR** - Push your branch and create a pull request

## Branch Naming Convention

Use descriptive branch names that follow this pattern:

```
<type>/<description>
```

Types:
- `feature/` - New feature (e.g., `feature/user-authentication`)
- `fix/` - Bug fix (e.g., `fix/booking-date-validation`)
- `docs/` - Documentation updates (e.g., `docs/api-endpoints`)
- `refactor/` - Code refactoring (e.g., `refactor/booking-service`)
- `test/` - Test additions or improvements (e.g., `test/add-booking-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, or tool changes

### Examples

```
feat(auth): add two-factor authentication

Implement 2FA support using Firebase and TOTP codes.
Closes #123

fix(bookings): resolve double booking issue

Prevent overlapping bookings by adding validation check.
Fixes #456

docs(api): update endpoint documentation

Add request/response examples for all API endpoints.
```

## Pull Request Process

1. **Create a descriptive PR title** - Use the same format as commit messages
2. **Link to related issues** - Use "Closes #123" to auto-link issues
3. **Provide PR description** including:
   - What changes were made
   - Why these changes were made
   - How to test the changes
   - Any breaking changes
   - Screenshots/videos for UI changes

4. **Ensure all checks pass**:
   - ✅ Tests pass (`npm test`)
   - ✅ Linting passes (`npm run lint`)
   - ✅ No console errors/warnings
   - ✅ Code coverage maintained (if applicable)

5. **Request review** - At least one maintainer review is required

6. **Address review comments** - Push additional commits or update existing ones

7. **Squash commits** - Before merging, squash commits into logical units

## Code Style Guidelines

### General Rules

- 2 spaces for indentation (not tabs)
- Semicolons required
- Single quotes for strings (except when escaping)
- Maximum line length: 120 characters
- No trailing whitespace

### JavaScript/Node.js Rules

```javascript
// ✅ Good
const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

// ❌ Bad
const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    return data
  } catch(err) {
    console.log(err)
  }
}
```

### React Rules

```javascript
// ✅ Good
const UserCard = ({ user, onEdit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateUser(user.id);
      onEdit(user);
    } finally {
      setIsLoading(false);
    }
  }, [user, onEdit]);

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={handleEdit} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Edit'}
      </button>
    </div>
  );
};

// ❌ Bad
export const UserCard = (props) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const handleEdit = () => {
    setIsLoading(true)
    updateUser(props.user.id).then(res => {
      setIsLoading(false)
      props.onEdit(props.user)
    })
  }
  return <div className='user-card'><h3>{props.user.name}</h3><button onClick={handleEdit} disabled={isLoading}>Edit</button></div>
}
```

### Running Linting

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

## Testing Guidelines

### Running Tests

```bash
# Backend
cd backend
npm test
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# Frontend
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

### Writing Tests

- Write tests for all new functionality
- Aim for at least 80% code coverage
- Use descriptive test names
- Test both happy paths and error cases
- Mock external dependencies appropriately

### Test File Naming

- Backend: `src/__tests__/<module>.test.js`
- Frontend: `src/components/__tests__/<Component>.test.jsx`

## Reporting Bugs

### Before Submitting

- Search existing issues to avoid duplicates
- Check the latest development version to see if it's already fixed
- Verify it's reproducible in a fresh environment

### Great Bug Reports Include

- **Title**: Clear, descriptive summary
- **Environment**: OS, Node version, npm version, browser (for frontend)
- **Steps to Reproduce**: Specific steps with sample code if possible
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots/Videos**: For UI-related bugs
- **Additional Context**: Any relevant logs, error messages, or configuration

### Bug Report Template

```markdown
## Description
Brief description of the issue

## Environment
- OS: [e.g., Windows 10, macOS 12]
- Node version: [e.g., v18.0.0]
- Browser: [if frontend issue]
- Version: [e.g., 1.0.0]

## Steps to Reproduce
1. First step
2. Second step
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Additional Context
Any other relevant information
```

## Proposing Features

### Before Proposing

- Check existing issues and pull requests to avoid duplicates
- Consider if the feature aligns with the project's goals
- Think about potential impact on existing functionality

### Feature Request Template

```markdown
## Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature be implemented?

## Alternatives Considered
Other approaches you've considered

## Additional Context
Any mockups, examples, or relevant links
```

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## References

This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/master/CONTRIBUTING.md)
