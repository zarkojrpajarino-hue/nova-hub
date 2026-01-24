import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form';
import { Input } from './input';

// Test component that uses the form
function TestForm({ onSubmit = vi.fn() }) {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe('Form Components', () => {
  describe('Form', () => {
    it('renders form with fields', () => {
      render(<TestForm />);

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders form inputs', () => {
      render(<TestForm />);

      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<TestForm />);

      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('allows input in fields', async () => {
      const user = userEvent.setup();
      render(<TestForm />);

      const usernameInput = screen.getByPlaceholderText('Enter username');
      await user.type(usernameInput, 'johndoe');

      expect(usernameInput).toHaveValue('johndoe');
    });

    it('calls onSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const usernameInput = screen.getByPlaceholderText('Enter username');
      const emailInput = screen.getByPlaceholderText('Enter email');

      await user.type(usernameInput, 'johndoe');
      await user.type(emailInput, 'john@example.com');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('FormField', () => {
    it('renders field with control', () => {
      render(<TestForm />);

      const usernameLabel = screen.getByText('Username');
      expect(usernameLabel).toBeInTheDocument();
    });
  });

  describe('FormItem', () => {
    it('renders form item container', () => {
      render(<TestForm />);

      const usernameLabel = screen.getByText('Username');
      expect(usernameLabel.closest('div')).toBeInTheDocument();
    });

    it('applies spacing classes', () => {
      render(<TestForm />);

      const usernameLabel = screen.getByText('Username');
      const formItem = usernameLabel.closest('div');
      expect(formItem).toHaveClass('space-y-2');
    });
  });

  describe('FormLabel', () => {
    it('renders label text', () => {
      render(<TestForm />);

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates with input field', () => {
      render(<TestForm />);

      const usernameLabel = screen.getByText('Username');
      expect(usernameLabel.tagName).toBe('LABEL');
    });
  });

  describe('FormControl', () => {
    it('renders input control', () => {
      render(<TestForm />);

      const usernameInput = screen.getByPlaceholderText('Enter username');
      expect(usernameInput).toBeInTheDocument();
    });

    it('input is editable', async () => {
      const user = userEvent.setup();
      render(<TestForm />);

      const usernameInput = screen.getByPlaceholderText('Enter username');
      await user.type(usernameInput, 'test');

      expect(usernameInput).toHaveValue('test');
    });
  });

  describe('FormDescription', () => {
    it('renders description text', () => {
      render(<TestForm />);

      expect(screen.getByText('Your public display name.')).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      render(<TestForm />);

      const description = screen.getByText('Your public display name.');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('FormMessage', () => {
    it('does not render when no error', () => {
      render(<TestForm />);

      // No error messages should be visible
      const description = screen.queryByText(/error/i);
      expect(description).not.toBeInTheDocument();
    });

    function TestFormWithValidation() {
      const form = useForm({
        defaultValues: {
          username: '',
        },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              rules={{ required: 'Username is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="button"
              onClick={() =>
                form.setError('username', {
                  message: 'Username is required',
                })
              }
            >
              Trigger Error
            </button>
          </form>
        </Form>
      );
    }

    it('renders error message when validation fails', async () => {
      const user = userEvent.setup();
      render(<TestFormWithValidation />);

      const triggerButton = screen.getByText('Trigger Error');
      await user.click(triggerButton);

      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    it('error message has destructive styling', async () => {
      const user = userEvent.setup();
      render(<TestFormWithValidation />);

      const triggerButton = screen.getByText('Trigger Error');
      await user.click(triggerButton);

      const errorMessage = screen.getByText('Username is required');
      expect(errorMessage).toHaveClass('text-destructive');
    });
  });

  describe('Form composition', () => {
    function CompleteForm() {
      const form = useForm({
        defaultValues: {
          name: '',
          email: '',
          bio: '',
        },
      });

      return (
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormDescription>This is your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormDescription>We'll never share your email.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Input placeholder="Tell us about yourself" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button type="submit">Save</button>
          </form>
        </Form>
      );
    }

    it('renders complete form with multiple fields', () => {
      render(<CompleteForm />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Bio')).toBeInTheDocument();
    });

    it('renders all field descriptions', () => {
      render(<CompleteForm />);

      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
      expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
    });

    it('all inputs are editable', async () => {
      const user = userEvent.setup();
      render(<CompleteForm />);

      const nameInput = screen.getByPlaceholderText('Your name');
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const bioInput = screen.getByPlaceholderText('Tell us about yourself');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(bioInput, 'Developer');

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(bioInput).toHaveValue('Developer');
    });
  });

  describe('Form with different input types', () => {
    function MultiTypeForm() {
      const form = useForm({
        defaultValues: {
          text: '',
          email: '',
          password: '',
        },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    }

    it('renders different input types', () => {
      render(<MultiTypeForm />);

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });
});
