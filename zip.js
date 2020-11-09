let i = 2;
const args = process.argv;
let configs = {
    output: "dist.zip",
    dir: null
}

while (i < args.length) {
    if (args[i] === "-o" || args[i] === "--output") {
        configs.output = args[i + 1];
        i += 2;
    }else if (args[i] === "-s" || args[i] === "--source") {
        configs.dir = args[i + 1];
        i += 2;
    } else if (!(args[i].startsWith("-"))) {
        configs.dir = args[i];
        i++;
    }
}
if (!configs.dir) {
    throw new Error("You must specify a folder");
}

const fs = require('fs');
const archiver = require('archiver');

let output = fs.createWriteStream(__dirname + '/' + configs.output);

let archiv = archiver('zip', {
    zlib: {level: 9}
});

archiv.pipe(output);
archiv.directory(configs.dir, ".");
archiv.finalize();