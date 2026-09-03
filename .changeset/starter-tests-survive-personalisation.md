---
"seamless-templates": patch
---

The starter's own tests survive being scaffolded into an application.

This suite runs again inside every application built from the starter, which is
what makes it a correctness oracle rather than a formality. Two of the tests
added with the shells and the example rows asserted things that are true here and
false the moment a scaffold personalises: that the nav carries a link called
"About", which is a demo page a scaffold removes, and that the examples module is
empty, which is the first thing a scaffold fills in.

Both now test what the code does rather than what this template currently holds:
the nav test asserts every link it finds has somewhere to go and that Home is
among them, and the examples test supplies its own rows. A suite that fails in
every generated application is not an oracle, it is a false alarm, and it would
have sent every build through a repair pass it did not need.
