import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackButton } from './FeedbackButton';

describe('FeedbackButton', () => {
  beforeEach(() => {
    global.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders feedback button with correct label', () => {
    render(<FeedbackButton />);
    const button = screen.getByTestId('feedback-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('💬 Feedback');
  });

  test('opens GitHub issue URL when clicked', () => {
    render(<FeedbackButton />);
    const button = screen.getByTestId('feedback-button');

    fireEvent.click(button);

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('github.com'),
      '_blank'
    );
    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('issues/new'),
      '_blank'
    );
  });

  test('uses custom repository URL when provided', () => {
    const customRepo = 'https://github.com/custom/repo';
    render(<FeedbackButton repositoryUrl={customRepo} />);
    const button = screen.getByTestId('feedback-button');

    fireEvent.click(button);

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining(customRepo),
      '_blank'
    );
  });

  test('has proper accessibility attributes', () => {
    render(<FeedbackButton />);
    const button = screen.getByTestId('feedback-button');

    expect(button).toHaveAttribute('aria-label', 'Send feedback');
  });

  test('opens link in new window', () => {
    render(<FeedbackButton />);
    const button = screen.getByTestId('feedback-button');

    fireEvent.click(button);

    expect(global.open).toHaveBeenCalledWith(
      expect.any(String),
      '_blank'
    );
  });
});
