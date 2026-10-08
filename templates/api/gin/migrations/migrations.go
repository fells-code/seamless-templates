// Package migrations holds the SQL migrations, embedded in the binary and run in
// filename order on boot.
package migrations

import "embed"

//go:embed *.sql
var Files embed.FS
