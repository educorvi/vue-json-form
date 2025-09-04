# Schemas for VueJsonForm
This directory contains the JSON schemas used by VueJsonForm. When running the build script, a merged schema and the schema's TypeScript types are generated.
Changes in a major version are backwards compatible. So a parser for a schema of version $z.x$ must be compatible with all versions $z.y$ where $y \leq x$.
