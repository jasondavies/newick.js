# newick.js

JavaScript library for parsing and serializing the Newick tree format.

Reference: <https://en.wikipedia.org/wiki/Newick_format>

## API

### `parse(input)`

Parses a Newick string and returns a tree object.

- Input:
  - `input` (`string`): Newick text (for example `"(A:0.1,B:0.2)Root;"`).
- Returns:
  - A tree node object with optional fields:
    - `name` (`string`)
    - `length` (`number`)
    - `branchset` (`Array<TreeNode>`)
- Throws:
  - `SyntaxError` for invalid syntax (for example unterminated quotes, invalid branch length tokens, malformed structure).

#### Parsing behavior

- Supports quoted labels (`'A B'`) and escaped quotes (`'E''F'` -> `E'F`).
- Ignores comments in square brackets (`[comment]`), including nested comments.
- Converts underscores in unquoted labels to spaces (`A_B` -> `A B`).
- Supports unnamed leaves with optional branch lengths (`(,:1);`). An omitted label leaves `name` absent; an explicitly quoted empty label (`''`) sets `name` to `""`.
- Validates branch lengths as signed/unsigned decimal numbers, with optional exponent.
- Requires a trailing semicolon (`;`).

Example:

```js
const Newick = require("./src/newick");
const tree = Newick.parse("(A:0.1,'B C':0.2)Root:1.0;");

// tree:
// {
//   name: "Root",
//   length: 1,
//   branchset: [
//     { name: "A", length: 0.1 },
//     { name: "B C", length: 0.2 }
//   ]
// }
```

### `serialize(tree)`

Serializes a tree object into Newick text.

- Input:
  - `tree` (`TreeNode`): Object using the same shape returned by `parse`.
- Returns:
  - Newick `string` ending in `;`.

#### Serialization behavior

- Writes branch sets as `(child1,child2,...)`.
- Writes `name` and `:length` when present.
- Quotes labels when required and escapes `'` as `''`.
- Quotes literal underscores and explicitly empty labels to preserve them when parsed again.

Example:

```js
const Newick = require("./src/newick");

const text = Newick.serialize({
  name: "Root",
  branchset: [
    { name: "A", length: 0.1 },
    { name: "B C", length: 0.2 }
  ]
});

// "(A:0.1,'B C':0.2)Root;"
```

## Browser usage

When loaded directly in a browser, the library exports a global `Newick` object:

```html
<script src="src/newick.js"></script>
<script>
  const tree = Newick.parse("(A:1,B:2)Root;");
  const text = Newick.serialize(tree);
</script>
```
