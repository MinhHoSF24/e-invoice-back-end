module.exports = {
  // Extend base rules from the Conventional Commits ruleset
  extends: ['@commitlint/config-conventional'],

  // Custom parser to define commit header format
  parserPreset: {
    parserOpts: {
      // Regex to parse commit message
      // Format: <type>/#<scope>: <subject>
      // Example: feat/#auth: add login functionality with JWT
      headerPattern: /^(\w*)\/#(\w*): (.*)$/,

      // Map regex capture groups to commitlint fields
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },

  // Rules to enforce commit message format
  rules: {
    // Only allow types from this list:
    // feat = new feature, fix = bug fix, docs = documentation,
    // style = code formatting, refactor = code refactoring, test = tests,
    // chore = miscellaneous tasks, revert = rollback a commit
    'type-enum': [
      2, // level 2 = error (reject commit if violated)
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
    ],

    // Header (first line of commit message) must be at least 10 characters
    'header-min-length': [2, 'always', 10],

    // Header must not exceed 160 characters
    'header-max-length': [2, 'always', 160],

    // Each line in the body must not exceed 120 characters
    'body-max-line-length': [2, 'always', 120],

    // Subject casing is not enforced
    // Disabled (0 = off), so uppercase or lowercase are both accepted
    // Example: "add login feature" or "Add login feature" both pass
    'subject-case': [
      0, // off
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
  },
};
