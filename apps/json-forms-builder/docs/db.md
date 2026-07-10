# Database

## Tree structure

Type ORM supports two ways to efficiently store tree structures:

- Materialized Path (aka Path Enumeration)
- Closure Table

Currently materialized path is used as there is no extra table involved and TypeORM is responsible for the code to manage the path column.

An AI summary of the different approaches:

Both Materialized Path and Closure Tables offer effective ways to store hierarchical data, but they make different trade-offs regarding read/write performance, storage size, and complexity.

__Materialized Path (Path Enumeration)__

This method stores a node's full lineage as a delimited string (e.g., /1/4/9/) directly in the node's row.

__Pros:__
- __Simple Schema:__ Requires only one extra column in your existing table.
- Fast Path Lookups: Fetching direct descendants or all ancestors of a node requires no joins; you simply run a fast prefix scan (e.g., WHERE path LIKE `'/1/4/%'`)
- __Human-Readable:__ The path string is easy to read and understand at a glance.

__Cons:__
- __Write Costs:__ If you move a node or subtree, you must update the path strings (and all descendant path strings) for every affected row, which can be expensive.
- __No Referential Integrity:__ Standard database foreign keys cannot enforce the integrity of arbitrary string columns.
- __String Parsing Limits:__ Deep hierarchies can make path strings unwieldy, and standard LIKE `'%...%'` queries on strings can be slow if the wildcards are at the end.

__Closure Table__

This method stores every parent-child relationship—both direct and indirect—in a separate bridge table, often including the distance (depth) between nodes.

__Pros:__
- __Relational Purity:__ Because you are mapping relationships to a separate table, you can utilize standard foreign keys for strict referential integrity.
- __Efficient Querying:__ Finding all ancestors or descendants of a node requires joining the closure table directly, allowing for clean, set-based SQL queries without string parsing.
- __Flexibility:__ It inherently supports complex relational queries, such as "find all ancestors at depth 2" or "find all trees," more cleanly than string pattern matching.

__Cons:__
- __Storage Space:__ You must maintain a separate table, and storing every possible ancestor-descendant pair can result in a storage explosion for deep or highly branched trees.
- __Complex Writes:__ Inserting a new node or moving a subtree requires inserting multiple rows into the closure table to map out all the new indirect connections, making writes heavier.
- __Extra Table Required:__ You lose the simplicity of having all hierarchical data contained within the node entity itself.

__Comparison At A Glance__

| Feature | Materialized Path | Closure Table |
|---------|-----------------|---------------|
| Storage | Low (one string per row) | High (bridge table tracks all paths) |
| Reads | Fast (string matching) | Very fast (simple joins) |
| Writes/Moves | Slow (requires updating all affected descendant strings) | Moderate to complex (multiple inserts/deletes in bridge table) |
| Relational Integrity | Weak (string-based) | Strong (foreign keys) |