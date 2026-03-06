const test = require("node:test");
const assert = require("node:assert/strict");
const Newick = require("../src/newick");
const parse = Newick.parse;
const serialize = Newick.serialize;

test("parses a tree with names and branch lengths", () => {
  const tree = parse("(A: 0.1,B: 0.2,(C:0.3,D:0.4)E:0.5)F;");

  assert.equal(tree.name, "F");
  assert.equal(tree.branchset.length, 3);
  assert.deepEqual(tree.branchset[0], { name: "A", length: 0.1 });
  assert.deepEqual(tree.branchset[1], { name: "B", length: 0.2 });
  assert.deepEqual(tree.branchset[2], {
    name: "E",
    length: 0.5,
    branchset: [
      { name: "C", length: 0.3 },
      { name: "D", length: 0.4 }
    ]
  });
});

test("parses a root-only tree name", () => {
  const tree = parse("A;");
  assert.equal(tree.name, "A");
});

test("parses quoted labels with delimiters and escaped quotes", () => {
  const tree = parse("('A,B':1,'C:D':2,'E''F':3);");
  assert.equal(tree.branchset[0].name, "A,B");
  assert.equal(tree.branchset[1].name, "C:D");
  assert.equal(tree.branchset[2].name, "E'F");
});

test("ignores comments in the tree", () => {
  const tree = parse("[root](A[leaf]:1,B:2)[internal]R:3;");
  assert.equal(tree.name, "R");
  assert.equal(tree.length, 3);
  assert.equal(tree.branchset[0].name, "A");
  assert.equal(tree.branchset[0].length, 1);
  assert.equal(tree.branchset[1].name, "B");
  assert.equal(tree.branchset[1].length, 2);
});

test("converts underscores to spaces in unquoted labels", () => {
  const tree = parse("(A_B:1,C_D:2);");
  assert.equal(tree.branchset[0].name, "A B");
  assert.equal(tree.branchset[1].name, "C D");
});

test("rejects invalid unquoted labels", () => {
  assert.throws(() => parse("(A'B:1,C:2);"), /Single quote is not allowed in unquoted labels/);
  assert.throws(() => parse("(A B:1,C:2);"), SyntaxError);
});

test("rejects invalid branch lengths", () => {
  assert.throws(() => parse("(A:1abc,B:2);"), /Invalid branch length/);
});

test("serializes a tree with names and branch lengths", () => {
  const tree = parse("(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;");
  assert.equal(serialize(tree), "(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;");
});

test("serializes a root-only tree name", () => {
  assert.equal(serialize({ name: "A" }), "A;");
});

test("quotes labels that contain special characters", () => {
  const tree = {
    branchset: [
      { name: "A B", length: 1 },
      { name: "C'D", length: 2 }
    ]
  };
  assert.equal(serialize(tree), "('A B':1,'C''D':2);");
});
