import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { CONTACT_BODY, CONTACT_EMAIL, CONTACT_SUBJECT } from '../constants/site';

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const [showEmailDisplay, setShowEmailDisplay] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  const mailtoLink = useMemo(() => {
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;
  }, []);

  const handleEmailClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    window.location.href = mailtoLink;

    window.setTimeout(() => {
      const hidden = typeof document.hidden === 'boolean' ? document.hidden : false;
      if (hidden) {
        return;
      }

      setShowEmailDisplay(true);
      setShowFallbackMessage(true);
    }, 1000);
  };

  const copyEmailAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = CONTACT_EMAIL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div id="contact" className="section-wrapper contact-bg">
      <section className="section-container contact-section">
        <h2 className="section-title">Join Our Mission</h2>
        <p className="contact-subheading">
          We are currently raising a pre-seed round to achieve our first flight milestone. For access to our business
          plan, detailed technical reports, and investor deck, please get in touch.
        </p>

        <div className="contact-buttons">
          <a href={mailtoLink} className="hero-button primary-contact" target="_blank" onClick={handleEmailClick}>
            <span className="button-icon">📧</span>
            Investor Relations
          </a>

          <button
            type="button"
            className="hero-button secondary-contact"
            onClick={copyEmailAddress}
            style={copied ? { backgroundColor: '#28a745' } : undefined}
          >
            <span className="button-icon">{copied ? '✅' : '📋'}</span>
            {copied ? 'Copied!' : 'Copy Email Address'}
          </button>

          <div id="email-display" className="email-display" style={{ display: showEmailDisplay ? 'block' : 'none' }}>
            {showFallbackMessage ? (
              <>
                <strong>Email client not detected.</strong>
                <br />
                Please copy this email address: <strong>{CONTACT_EMAIL}</strong>
                <br />
                <small>Subject: {CONTACT_SUBJECT}</small>
              </>
            ) : (
              <>
                <strong>Direct Email:</strong> {CONTACT_EMAIL}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
