const fs = require('fs');
fs.mkdirSync('samples');
fs.writeFileSync('samples/test.txt', 'hello world');