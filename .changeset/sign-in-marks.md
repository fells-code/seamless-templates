---
"seamless-templates": patch
---

feat(kit): mark the generated sign-in screen with Seamless Auth and Seamless Idea

Every generated application is shared with the handful of people it was made
for, and every one of them signs in. That screen is the largest owned surface the
company has, it grows with the fleet, it costs nothing, and it said nothing at
all.

`AuthFrame` now carries two lines under the form:

- **Secured by Seamless Auth**, to `seamlessauth.com`. Most of the people
  reading it are about to use passwordless sign in for the first time, and
  naming it is the only distribution the auth product gets from the fleet.
- **Made with Seamless Idea**, to `seamlessidea.com`.

Restraint is the whole design. They sit under the sign-in screens rather than
beside them, at footnote size in the muted ink role, centred, with no logo and no
lockup. A generated application has to feel like its owner's, and a banner across
the top would undo the thing that makes personal software worth having. Both
links open in a new tab so that nobody mid-sign-in loses the page, and they carry
`noopener` without `noreferrer`, because the referrer is the only way either
product ever sees that a generated application sent someone.

There is no switch to turn them off. The templates are copied into the owner's
project, so the lines can always be deleted; whether a paid tier removes them is
a decision for the CLI rather than a prop on the kit.
