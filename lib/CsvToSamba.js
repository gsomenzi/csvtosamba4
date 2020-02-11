const parse = require('csv-parse');
const { exec } = require('child_process');

module.exports = {
  generateCommands,
  parseUsers,
  executeCommands
}

function parseUsers(data, options, callback) {
  parse(data, {
    comment: '#',
    from_line: options.line
  }, function(err, output){
    if (err) return callback(err);
    const users = [];
    output.map(line => users.push({
      fullname: line[parseInt(options.fullnameColumn)],
      username: line[parseInt(options.usernameColumn)],
      password: line[parseInt(options.passwordColumn)]
    }));
    return callback(null, users);
  })
}

function generateCommands(users, options, callback) {
  const commands = [];
  users.map((user) => {
    let command = `samba-tool user add ${user.username} ${user.password} --given-name=${user.fullname.split(' ')[0]}`;
    if (user.fullname.split(' ').length > 1) command = `${command} --surname=${user.fullname.split(' ')[user.fullname.split(' ').length - 1]}`
    if (options.ou) command = `${command} --userou="${options.ou.replace(/\"/g, '').replace(/\'/g, '')}"`;
    commands.push(command);
    if (options.group) {
      commands.push(`samba-tool group addmembers ${options.group} ${user.username}`);
    }
  });
  return callback(null, commands);
}

function executeCommands(commands, callback) {
  let promises = [];
  commands.map((command, i) => {
    promises.push(new Promise((resolve, reject) => {
      exec(command, function (err, stdout, stderr) {
        if (err) return reject(stderr);
        return resolve();
      });
    }));
  });
  Promise.all(promises)
    .then(res => callback(null, res))
    .catch(err => callback(err))
}