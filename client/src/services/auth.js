// src/services/auth.js
const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async ({ full_name, email, password }) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to register');
    }

    return await response.json();
  } catch (error) {
    console.error('Register Error:', error);
    throw error;
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to login');
    }

    return await response.json();
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};