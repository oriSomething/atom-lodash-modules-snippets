"use strict";

const fs = require("fs");
const path = require("path");
const _ = require("lodash");


const NATIVE_MODULES = Object.freeze([
  "isFinite",
  "isNaN",
  "valueOf"
]);

const templateES = _.template(`
  'ES <%= path %>':
    'prefix': 'i_<%= name %>'
    'body': """
    import <%= imported %> from '<%= path %>';
    """`
);

const templateCJS = _.template(`
  'CJS <%= path %>':
    'prefix': 'r_<%= name %>'
    'body': """
    const <%= imported %> = require('<%= path %>');
    """`
);

const getImportedName = (name) => _.includes(NATIVE_MODULES, name) ? `_${name}` : name;

const createSnippet = (templateFn, name) => templateFn({ name, imported: getImportedName(name), path: `lodash/${name}` });

const createLodashSnippet = (templateFn) => templateFn({ name: 'lodash', imported: '_', path: 'lodash' });

const createSnippets = (templateFn, modules) => _(modules)
  .map(name => createSnippet(templateFn, name))
  .concat([createLodashSnippet(templateFn)])
  .join("")
  .replace(/^/, "'.source.js':") +
  "\n";

const writeToFile = (fileName, str) => fs.writeFileSync(`snippets/lodash-modules-snippets-${fileName}.cson`, str, "utf8");

// Read the modules from library
const modules = _.chain(fs.readdirSync(path.dirname(require.resolve("lodash"))))
  .filter(fileName => /\.js$/.test(fileName))
  .filter(fileName => fileName !== "index.js")
  .filter(fileName => fileName !== "lodash.js")
  .map(fileName => fileName.slice(0, fileName.length - 3))
  .value();

// Create snippets
writeToFile("es", createSnippets(templateES, modules));
writeToFile("cjs", createSnippets(templateCJS, modules));
