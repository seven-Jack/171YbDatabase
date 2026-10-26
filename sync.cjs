// Compatible entry point; checking, committing and pushing are separate actions.
require('./scripts/sync.cjs').main(process.argv.slice(2), __dirname);
