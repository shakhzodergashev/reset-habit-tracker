import { Link } from 'react-router';
import { SUPPORT_EMAIL } from '../legal';
import './LegalPage.css';

/** /support: how to get help, plus answers to the most common questions. */
export function SupportPage() {
  return (
    <article className="card legal">
      <h2>Support</h2>
      <p>
        Something not working, an idea, or a question about your data? Email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll get
        back to you as soon as we can.
      </p>

      <h3>Common questions</h3>

      <h4>I ticked a habit on the wrong day.</h4>
      <p>
        Pick that day in the week strip on Today, then tap the habit again to
        untick it.
      </p>

      <h4>My days start at the wrong time.</h4>
      <p>
        RESET uses your time zone to decide when a day ends. Check it on the
        Profile page; if you travelled, a “Switch to …” button appears there.
      </p>

      <h4>How do I change my password?</h4>
      <p>Profile → Password → Change password.</p>

      <h4>How do I delete my account?</h4>
      <p>
        Profile → Delete account. This deletes everything, for good. See the{' '}
        <Link to="/privacy">privacy policy</Link> for details.
      </p>
    </article>
  );
}
