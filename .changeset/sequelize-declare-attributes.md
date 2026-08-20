---
"seamless-templates": patch
---

fix(templates): declare Sequelize model attributes instead of using public class fields

The `User` model in both API starters (`express` and `fastify`) declared its
attributes as `public id!: string`. Sequelize installs its attribute getters and
setters on the prototype, and a public class field is emitted as an own property
initialised to undefined, which shadows them: `user.id` reads undefined while
`user.get("id")` returns the row's value. Sequelize warns about this at model
init. `declare` emits no field at all, so the accessors survive.

Whether the field is emitted depends on `useDefineForClassFields`, which follows
`target`. Both starters compile at `target: ES2020`, where the field is erased
and the shadowing does not occur, so this is a guard rather than a repair of
behaviour anyone is seeing today. It matters because the guard is what keeps a
later `target` bump from silently breaking every model: at ES2022 the same code
returns undefined for every attribute, and the first symptom is a query built
with an undefined parameter on a handler that filters by `req.appUser.id`.
