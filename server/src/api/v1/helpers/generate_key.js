const crypto = require('crypto');

const accessKey = crypto.randomBytes(32).toString('hex');
const refreshKey = crypto.randomBytes(32).toString('hex');

console.table({accessKey, refreshKey})