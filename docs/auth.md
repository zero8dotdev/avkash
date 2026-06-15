## Auth System Documentation

### What it does

Manages user authentication, including login, registration, and session handling.

### Parameters

- `username`: User identifier
- `password`: User password (hashed)
- `sessionToken`: Valid session token for authenticated requests

### Usage Example

```js
const user = authenticateUser({ username: 'admin', password: 'securePass123' });
console.log(user); // { id: 1, role: 'admin' }
```

### Gotchas

- Never store passwords in plain text
- Use secure session storage (e.g., HTTP-only cookies)
- Implement rate limiting to prevent brute force attacks
