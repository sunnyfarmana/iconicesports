const serverModule = require('../server/dist/server');
const app = serverModule.default || serverModule;

module.exports = app;
