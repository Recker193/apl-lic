# MVP decisions

Locked for the current backend MVP. Changing them requires an explicit update of this file.

- Registration is invite-only. Role and school come from the invitation, never from the client body.
- `ADMIN` is school-scoped. The first school and admin are created only by `npm run bootstrap:admin`.
- Student posts use the `Announcement` model. `GroupMembership.canPost` controls write access.
- HTTP DELETE archives or cancels content (`PUBLISHED | ARCHIVED | CANCELLED`).
- School events are published only by `ADMIN`.
- A `SubjectGroup` has one teacher. A teacher may own multiple groups.
- Students do not upload homework files. They only update personal assignment progress.
- Email uses SMTP (Mailhog locally). Tokens are never written to application logs.
- Push notifications are out of scope.
- Files are stored on local disk and downloaded through an authenticated endpoint.
- GDPR retention and parental consent are production obligations, not product features in this MVP.
