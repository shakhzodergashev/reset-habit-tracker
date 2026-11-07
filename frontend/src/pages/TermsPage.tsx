import { Link } from 'react-router';
import {
  GOVERNING_COUNTRY,
  MINIMUM_AGE,
  POLICIES_UPDATED,
  SUPPORT_EMAIL,
} from '../legal';
import './LegalPage.css';

/** /terms: the simple rules for using RESET. */
export function TermsPage() {
  return (
    <article className="card legal">
      <h2>Terms of use</h2>
      <p className="legal-updated">Last updated: {POLICIES_UPDATED}</p>
      <p>
        By creating an account or using RESET, you agree to these terms. They
        are short, so please read them.
      </p>

      <h3>1. Who can use RESET</h3>
      <p>You must be at least {MINIMUM_AGE} years old to use RESET.</p>

      <h3>2. Your account</h3>
      <p>
        Keep your password to yourself. You are responsible for what happens in
        your account. If you think someone else knows your password, change it
        on the Profile page.
      </p>

      <h3>3. Fair use</h3>
      <p>
        Don’t try to break, overload or get into parts of RESET that aren’t
        yours, and don’t use it for anything illegal. We may close accounts that
        do.
      </p>

      <h3>4. Your content</h3>
      <p>
        Your habits are yours. We only use them to run RESET for you, as the{' '}
        <Link to="/privacy">privacy policy</Link> explains.
      </p>

      <h3>5. The service</h3>
      <p>
        RESET is free, and we work hard to keep it running and your data safe.
        But it is provided “as is”: we can’t promise it will always be available
        or free of mistakes, and we may change or stop features. RESET is a
        motivation tool, not medical or professional advice.
      </p>

      <h3>6. Ending</h3>
      <p>
        You can delete your account at any time (Profile → Delete account). If
        RESET ever closes, we will tell you in advance where we can.
      </p>

      <h3>7. Changes and law</h3>
      <p>
        We may update these terms; the date at the top shows the latest version,
        and important changes will be announced in the app. These terms are
        governed by the laws of {GOVERNING_COUNTRY}.
      </p>

      <h3>Questions?</h3>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </article>
  );
}
