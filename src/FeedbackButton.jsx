export function FeedbackButton({ repositoryUrl = 'https://github.com/anthropics/claude-code' }) {
  const handleFeedbackClick = () => {
    const feedbackUrl = `${repositoryUrl}/issues/new?template=feedback.md&title=Feedback:`;
    window.open(feedbackUrl, '_blank');
  };

  return (
    <button
      onClick={handleFeedbackClick}
      className="feedback-button"
      aria-label="Send feedback"
      data-testid="feedback-button"
    >
      💬 Feedback
    </button>
  );
}
