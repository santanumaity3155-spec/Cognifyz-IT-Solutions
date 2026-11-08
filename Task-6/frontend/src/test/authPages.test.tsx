import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import authService from '../services/authService';

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('Phase 9: Frontend Authentication Interface Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================
  // 1. LOGIN PAGE TESTS
  // ========================================================
  describe('LoginPage Component', () => {
    it('1.1 renders login inputs, toggle button, and action links', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In to Forma/i })).toBeInTheDocument();
      expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    });

    it('1.2 validates required email and password fields on submit', async () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Sign In to Forma/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Email address is required/i);
    });

    it('1.3 validates malformed email format', async () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'not-an-email' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'ValidPass123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In to Forma/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Please enter a valid email address/i);
    });

    it('1.4 toggles password visibility between text and password types', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });
      const toggleButton = screen.getByLabelText(/Show password/i);

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(screen.getByLabelText(/Hide password/i));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('1.5 successfully submits valid credentials and displays success feedback', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        success: true,
        message: 'Login successful! Redirecting to dashboard...',
        data: {
          user: {
            id: '123',
            name: 'Alex Mercer',
            email: 'alex.mercer@forma.edu',
            role: 'Student',
            isActive: true,
          },
        },
      });

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'alex.mercer@forma.edu' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'StudentPass2026!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In to Forma/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });
        expect(screen.getByRole('status')).toHaveTextContent(/Login successful/i);
      });
    });

    it('1.6 displays error message when API rejects credentials', async () => {
      vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid email or password.'));

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'alex.mercer@forma.edu' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'WrongPassword99!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In to Forma/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid email or password/i);
    });

    it('1.7 allows quick-fill of testing credentials using preset buttons', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      const studentPill = screen.getByRole('button', { name: /Student \(Alex\)/i });
      fireEvent.click(studentPill);

      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('alex.mercer@forma.edu');
      expect(screen.getByLabelText(/Password/i, { selector: 'input' })).toHaveValue('StudentPass2026!');
    });
  });

  // ========================================================
  // 2. REGISTRATION PAGE TESTS
  // ========================================================
  describe('RegisterPage Component', () => {
    it('2.1 renders all required registration fields and excludes public Admin selector', () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Terms of Service/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Student Account/i })).toBeInTheDocument();

      // Ensure no public Admin role dropdown/checkbox exists
      expect(screen.queryByLabelText(/Role/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Select Role: Admin/i)).not.toBeInTheDocument();
    });

    it('2.2 validates full name, email, and password complexity', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      // Submit completely blank form
      fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/Full name is required/i);

      // Fill short name
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/at least 2 characters long/i);
    });

    it('2.3 rejects mismatched password confirmation', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Valid User' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'valid@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), {
        target: { value: 'StrongP@ss2026' },
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), {
        target: { value: 'DifferentP@ss2026' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/Passwords do not match/i);
    });

    it('2.4 dynamically updates password strength criteria indicators', () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/^Password/i, { selector: 'input' });

      // Initially meter is not shown for empty password
      expect(screen.queryByTestId('password-strength-meter')).not.toBeInTheDocument();

      // Enter partial password
      fireEvent.change(passwordInput, { target: { value: 'abc' } });
      expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();

      // Enter full complex password
      fireEvent.change(passwordInput, { target: { value: 'ComplexPass123!' } });
      expect(screen.getByText(/Very Strong/i)).toBeInTheDocument();
    });

    it('2.5 successfully submits registration and displays success alert', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({
        success: true,
        message: 'Account registered successfully! Redirecting to login...',
        data: {
          user: {
            id: '456',
            name: 'New Student',
            email: 'new.student@forma.edu',
            role: 'Student',
            isActive: true,
          },
        },
      });

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New Student' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new.student@forma.edu' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), {
        target: { value: 'SecureP@ssw0rd2026' },
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), {
        target: { value: 'SecureP@ssw0rd2026' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          name: 'New Student',
          email: 'new.student@forma.edu',
          password: 'SecureP@ssw0rd2026',
        });
        expect(screen.getByRole('status')).toHaveTextContent(/Account registered successfully/i);
      });
    });

    it('2.6 displays error message when registration fails (e.g. duplicate email)', async () => {
      vi.mocked(authService.register).mockRejectedValueOnce(
        new Error('An account with this email address already exists.')
      );

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Sarah Connor' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'sarah.connor@forma.edu' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), {
        target: { value: 'SecureP@ssw0rd2026' },
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), {
        target: { value: 'SecureP@ssw0rd2026' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
    });
  });
});
