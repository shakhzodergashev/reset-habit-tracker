import { Link } from 'react-router';

/** Any address RESET doesn't know, e.g. a mistyped or old link. */
export function NotFoundPage() {
  return (
    <section className="card welcome">
      <h2>Page not found 🧭</h2>
      <p>
        This page doesn’t exist. The link may be old, or there may be a typo in
        the address.
      </p>
      <Link className="button button-primary" to="/">
        Back to RESET
      </Link>
    </section>
  );
}
