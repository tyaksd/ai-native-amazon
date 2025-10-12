# Admin Authentication Setup

This document explains how the password protection for admin routes works.

## Protected Routes

The following routes are protected in production:
- `/oiu` - Admin dashboard for managing brands and products
- `/lkj` - Orders dashboard for viewing customer orders

## How It Works

### Development Environment
- In localhost/development, these routes are **always accessible** without password
- No authentication is required during development

### Production Environment
- Routes require a password to access
- Users will see a login form when accessing protected routes
- Password is stored in environment variable `ADMIN_PASSWORD`

## Setup Instructions

### 1. Set Environment Variable

Create a `.env.local` file in your project root and add:

```bash
ADMIN_PASSWORD=your_secure_password_here
```

**Important:** Choose a strong password for production!

### 2. Deploy to Production

Make sure to set the `ADMIN_PASSWORD` environment variable in your production environment (Vercel, Netlify, etc.).

## How Authentication Works

1. **Middleware Check**: Next.js middleware intercepts requests to protected routes
2. **Environment Detection**: Checks if running in production
3. **Cookie Validation**: Verifies the `admin-auth` cookie matches the password
4. **Login Form**: Shows a styled login form if authentication fails
5. **Session Management**: Password is stored in a cookie for 24 hours

## Security Features

- Password is only required in production
- Session cookies expire after 24 hours
- Clean, professional login interface
- Automatic redirect after successful authentication

## Testing

### Local Development
```bash
npm run dev
# Visit http://localhost:3000/oiu or http://localhost:3000/lkj
# Should work without password
```

### Production Testing
1. Deploy with `ADMIN_PASSWORD` environment variable set
2. Visit your production URL + `/oiu` or `/lkj`
3. Should see login form
4. Enter the password to access

## Troubleshooting

### Routes Not Protected
- Check that `NODE_ENV=production` is set
- Verify `ADMIN_PASSWORD` environment variable is set
- Clear browser cookies and try again

### Can't Access After Password
- Check that the password matches exactly
- Clear browser cookies and try again
- Check browser console for errors

## File Structure

```
├── middleware.ts                 # Next.js middleware for route protection
├── lib/auth-middleware.ts       # Authentication logic
├── app/api/admin-auth/route.ts  # Password verification endpoint
├── app/api/verify-auth/route.ts # Session verification endpoint
├── app/oiu/layout.tsx          # Admin dashboard layout with auth
├── app/lkj/layout.tsx          # Orders dashboard layout with auth
└── ADMIN_AUTH_SETUP.md         # This documentation
```
