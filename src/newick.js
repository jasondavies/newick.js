/**
 * Newick format parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Example tree (from http://en.wikipedia.org/wiki/Newick_format):
 *
 * +--0.1--A
 * F-----0.2-----B            +-------0.3----C
 * +------------------0.5-----E
 *                            +---------0.4------D
 *
 * Newick format:
 * (A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;
 *
 * Converted to JSON:
 * {
 *   name: "F",
 *   branchset: [
 *     {name: "A", length: 0.1},
 *     {name: "B", length: 0.2},
 *     {
 *       name: "E",
 *       length: 0.5,
 *       branchset: [
 *         {name: "C", length: 0.3},
 *         {name: "D", length: 0.4}
 *       ]
 *     }
 *   ]
 * }
 *
 * Converted to JSON, but with no names or lengths:
 * {
 *   branchset: [
 *     {}, {}, {
 *       branchset: [{}, {}]
 *     }
 *   ]
 * }
 */
(function(exports) {
  exports.parse = function(s) {
    var i = 0;
    var n = s.length;

    function isWhitespace(ch) {
      return ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r' || ch == '\f';
    }

    function isDigit(ch) {
      return ch >= '0' && ch <= '9';
    }

    function syntaxError(message) {
      throw new SyntaxError(message + ' at position ' + i);
    }

    function skipWhitespaceAndComments() {
      while (i < n) {
        var ch = s.charAt(i);
        if (isWhitespace(ch)) {
          i++;
          continue;
        }
        if (ch == '[') {
          // Support nested comments, which some tools emit.
          var depth = 1;
          i++;
          while (i < n && depth > 0) {
            ch = s.charAt(i);
            if (ch == '[') {
              depth++;
            } else if (ch == ']') {
              depth--;
            }
            i++;
          }
          if (depth > 0) {
            syntaxError('Unterminated comment');
          }
          continue;
        }
        break;
      }
    }

    function parseQuotedLabel() {
      var parts = [];
      i++; // opening quote
      var segmentStart = i;
      while (i < n) {
        var ch = s.charAt(i);
        if (ch == "'") {
          parts.push(s.slice(segmentStart, i));
          if (s.charAt(i + 1) == "'") {
            parts.push("'");
            i += 2;
            segmentStart = i;
            continue;
          }
          i++; // closing quote
          return parts.join('');
        }
        if (ch == '\n' || ch == '\r') {
          syntaxError('Newline in quoted label');
        }
        i++;
      }
      syntaxError('Unterminated quoted label');
    }

    function parseUnquotedLabel() {
      var start = i;
      while (i < n) {
        var ch = s.charAt(i);
        if (isWhitespace(ch) || ch == '(' || ch == ')' || ch == ',' || ch == ':' || ch == ';' || ch == '[' || ch == ']') {
          break;
        }
        if (ch == "'") {
          syntaxError('Single quote is not allowed in unquoted labels');
        }
        i++;
      }
      if (i == start) {
        return undefined;
      }
      return s.slice(start, i).replace(/_/g, ' ');
    }

    function parseLabel() {
      skipWhitespaceAndComments();
      if (i >= n) {
        return undefined;
      }
      if (s.charAt(i) == "'") {
        return parseQuotedLabel();
      }
      return parseUnquotedLabel();
    }

    function parseLength() {
      skipWhitespaceAndComments();
      var start = i;
      if (i >= n) {
        syntaxError('Missing branch length');
      }
      var ch = s.charAt(i);
      if (ch == ',' || ch == ')' || ch == ';' || ch == '[' || ch == ']') {
        syntaxError('Missing branch length');
      }

      if (ch == '+' || ch == '-') {
        i++;
      }

      var integerDigits = 0;
      while (i < n && isDigit(s.charAt(i))) {
        integerDigits++;
        i++;
      }

      var fractionalDigits = 0;
      if (s.charAt(i) == '.') {
        i++;
        while (i < n && isDigit(s.charAt(i))) {
          fractionalDigits++;
          i++;
        }
      }

      if (integerDigits == 0 && fractionalDigits == 0) {
        while (i < n) {
          ch = s.charAt(i);
          if (isWhitespace(ch) || ch == ',' || ch == ')' || ch == ';' || ch == '[' || ch == ']') {
            break;
          }
          i++;
        }
        syntaxError('Invalid branch length "' + s.slice(start, i) + '"');
      }

      ch = s.charAt(i);
      if (ch == 'e' || ch == 'E') {
        i++;
        ch = s.charAt(i);
        if (ch == '+' || ch == '-') {
          i++;
        }
        var exponentDigits = 0;
        while (i < n && isDigit(s.charAt(i))) {
          exponentDigits++;
          i++;
        }
        if (exponentDigits == 0) {
          while (i < n) {
            ch = s.charAt(i);
            if (isWhitespace(ch) || ch == ',' || ch == ')' || ch == ';' || ch == '[' || ch == ']') {
              break;
            }
            i++;
          }
          syntaxError('Invalid branch length "' + s.slice(start, i) + '"');
        }
      }

      if (i < n) {
        ch = s.charAt(i);
        if (!isWhitespace(ch) && ch != ',' && ch != ')' && ch != ';' && ch != '[' && ch != ']') {
          while (i < n) {
            ch = s.charAt(i);
            if (isWhitespace(ch) || ch == ',' || ch == ')' || ch == ';' || ch == '[' || ch == ']') {
              break;
            }
            i++;
          }
          syntaxError('Invalid branch length "' + s.slice(start, i) + '"');
        }
      }

      return Number(s.slice(start, i));
    }

    function parseSubtree() {
      skipWhitespaceAndComments();
      if (i >= n) {
        syntaxError('Unexpected end of input');
      }
      var node = {};
      if (s.charAt(i) == '(') {
        i++;
        node.branchset = [];
        while (true) {
          node.branchset.push(parseSubtree());
          skipWhitespaceAndComments();
          var ch = s.charAt(i);
          if (ch == ',') {
            i++;
            continue;
          }
          if (ch == ')') {
            i++;
            break;
          }
          syntaxError("Expected ',' or ')'");
        }
        var internalLabel = parseLabel();
        if (internalLabel !== undefined) {
          node.name = internalLabel;
        }
      } else {
        var leafLabel = parseLabel();
        if (leafLabel !== undefined) {
          node.name = leafLabel;
        } else {
          // A leaf may omit its name, with or without a branch length.
          var leafEnd = s.charAt(i);
          if (leafEnd != ':' && leafEnd != ',' && leafEnd != ')' && leafEnd != ';') {
            syntaxError("Expected '(' or label");
          }
        }
      }

      skipWhitespaceAndComments();
      if (s.charAt(i) == ':') {
        i++;
        node.length = parseLength();
      }
      return node;
    }

    var tree = parseSubtree();
    skipWhitespaceAndComments();
    if (s.charAt(i) != ';') {
      syntaxError("Expected ';'");
    }
    i++;
    skipWhitespaceAndComments();
    if (i < n) {
      syntaxError("Unexpected content after ';'");
    }
    return tree;
  };

  exports.serialize = function(tree) {
    function formatName(name) {
      if (name === undefined || name === null) {
        return '';
      }
      name = String(name);
      if (name === '' || /[_\s\(\)\[\]':;,]/.test(name)) {
        return "'" + name.replace(/'/g, "''") + "'";
      }
      return name;
    }

    function formatSubtree(node) {
      var output = '';
      if (node.branchset && node.branchset.length !== undefined) {
        output += '(';
        for (var i=0; i<node.branchset.length; i++) {
          if (i > 0) output += ',';
          output += formatSubtree(node.branchset[i]);
        }
        output += ')';
      }
      output += formatName(node.name);
      if (node.length !== undefined && node.length !== null && node.length !== '') {
        output += ':' + node.length;
      }
      return output;
    }

    return formatSubtree(tree || {}) + ';';
  };
})(
    // exports will be set in any commonjs platform; use it if it's available
    typeof exports !== "undefined" ?
    exports :
    // otherwise construct a name space.  outside the anonymous function,
    // "this" will always be "window" in a browser, even in strict mode.
    this.Newick = {}
);
