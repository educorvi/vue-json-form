/* eslint-disable no-unused-vars */
const fs = require('fs');
const archiver = require('archiver');

let output = fs.createWriteStream(__dirname + '/dist.zip');

let archiv = archiver('zip', {
    zlib: {level: 9}
});

archiv.pipe(output);
archiv.directory('dist', ".");
archiv.finalize();
