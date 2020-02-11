const program = require('commander');
const fs = require('fs');

const CsvToSamba = require('./lib/CsvToSamba');
const package = require('./package.json');

const defaultOptions = {
  fullnameColumn: 0,
  usernameColumn: 1,
  passwordColumn: 2,
  ou: null,
  group: null,
  line: 1
}

program.version(package.version);

program
  .name('csv-to-samba')
  .description('CLI utility to import users from CSV file to SAMBA 4.')
  .usage("[global options] command")
  .option('-e, --execute', 'execute generated commands')
  .option('-s, --source <source>', 'source file of users')
  .option('-o, --ou <ou>', 'OU DN')
  .option('-g, --group <group>', 'group to add created users')
  .option('-l, --line <line>', 'start line')
  .option('-f, --fullname-column <fullnameColumn>', 'fullname column number')
  .option('-u, --username-column <usernameColumn>', 'username column number')
  .option('-p, --password-column <passwordColumn>', 'password column number')
  .parse(process.argv);

if (!program.source) {
  program.help();
  return process.exit();
}

const options = {...defaultOptions}
if (program.line) options.line = program.line;
if (program.fullnameColumn) options.fullnameColumn = program.fullnameColumn;
if (program.usernameColumn) options.usernameColumn = program.usernameColumn;
if (program.passwordColumn) options.passwordColumn = program.passwordColumn;
if (program.ou) options.ou = program.ou;
if (program.group) options.group = program.group;

fs.access(program.source, fs.constants.F_OK, (err) => {
  if (err) {
    console.log('- File not found.');
    return process.exit();
  }
  fs.readFile(program.source, 'utf8', (err, data) => {
    if (err) throw err;
    CsvToSamba.parseUsers(data, options, (err, users) => {
      if (err) return console.log(err);
      CsvToSamba.generateCommands(users, options, (err, commands) => {
        if (err) return console.log(err);
        if (program.execute) {
          CsvToSamba.executeCommands(commands, (err, res) => {
            if (err) return console.log(err);
            return console.log(res);
          })
        } else {
          return console.log(commands);
        }
      })
    });
  });
});

