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

test("parses unnamed leaves in descendant lists", () => {
  assert.deepEqual(parse("(,,(,));"), {
    branchset: [{}, {}, { branchset: [{}, {}] }]
  });
  assert.deepEqual(parse("(A,,B,);"), {
    branchset: [{ name: "A" }, {}, { name: "B" }, {}]
  });
  assert.deepEqual(parse("();"), { branchset: [{}] });
});

test("round-trips unnamed leaves with comments and branch lengths", () => {
  const tree = parse("([leaf], [length]:0, :1.5, B:2);");
  assert.deepEqual(tree, {
    branchset: [{}, { length: 0 }, { length: 1.5 }, { name: "B", length: 2 }]
  });
  assert.deepEqual(parse(serialize(tree)), tree);
});

test("round-trips unnamed root-only trees", () => {
  for (const tree of [{}, { length: 0 }, { length: 1 }]) {
    assert.deepEqual(parse(serialize(tree)), tree);
  }
});

test("still rejects malformed structure around unnamed leaves", () => {
  for (const input of ["", "[comment]", "(", "(,", "(,;", "(A;B);", ");", ",;", "(]);", "(:);", "(A,B);;"]) {
    assert.throws(() => parse(input), SyntaxError, input);
  }
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

test("quotes literal underscores in leaf and internal labels", () => {
  for (const input of ["'A_B';", "('A_B',C)'R_T';"]) {
    const tree = parse(input);
    assert.equal(serialize(tree), input);
    assert.deepEqual(parse(serialize(tree)), tree);
  }
});

test("preserves explicitly empty labels when serializing", () => {
  for (const input of ["'';", "('':1,B:2)'';"]) {
    const tree = parse(input);
    assert.equal(serialize(tree), input);
    assert.deepEqual(parse(serialize(tree)), tree);
  }
});
