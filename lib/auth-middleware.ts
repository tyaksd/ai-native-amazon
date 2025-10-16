import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const PROTECTED_ROUTES = ['/oiu', '/lkj', '/sora', '/sns'] // sora2 and sns re-enabled

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function checkAuth(request: NextRequest): { isAuthenticated: boolean; response?: NextResponse } {
  // Skip authentication in development/localhost
  if (!isProduction()) {
    return { isAuthenticated: true }
  }

  // Check if route is protected
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return { isAuthenticated: true }
  }

  // Check for password in session storage or cookie
  const authToken = request.cookies.get('admin-auth')?.value
  
  if (authToken === ADMIN_PASSWORD) {
    return { isAuthenticated: true }
  }

  // Return login page
  const loginHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Access Required</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .login-header h1 {
                color: #333;
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
            }
            .login-header p {
                color: #666;
                margin: 0;
                font-size: 0.9rem;
            }
            .form-group {
                margin-bottom: 1.5rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 500;
            }
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 5px;
                font-size: 1rem;
                transition: border-color 0.3s;
                box-sizing: border-box;
            }
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            .login-button {
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 0.75rem;
                border-radius: 5px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .login-button:hover {
                transform: translateY(-1px);
            }
            .error-message {
                color: #e53e3e;
                font-size: 0.9rem;
                margin-top: 0.5rem;
                text-align: center;
            }
            .hidden {
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1>🔐 Admin Access</h1>
                <p>Please enter the admin password to continue</p>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-button">Access Dashboard</button>
                <div id="errorMessage" class="error-message hidden"></div>
            </form>
        </div>
        
        <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const errorMessage = document.getElementById('errorMessage');
                
                try {
                    const response = await fetch('/api/admin-auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ password: password })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Set cookie and redirect
                        document.cookie = 'admin-auth=' + password + '; path=/; max-age=86400'; // 24 hours
                        window.location.reload();
                    } else {
                        errorMessage.textContent = 'Invalid password. Please try again.';
                        errorMessage.classList.remove('hidden');
                    }
                } catch (error) {
                    errorMessage.textContent = 'An error occurred. Please try again.';
                    errorMessage.classList.remove('hidden');
                }
            });
        </script>
    </body>
    </html>
  `

  return {
    isAuthenticated: false,
    response: new NextResponse(loginHtml, {
      status: 401,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
