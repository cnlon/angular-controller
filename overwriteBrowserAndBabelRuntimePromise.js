const overwritePromise = require('./overwritePromise')
const overwriteBabelRuntimePromise = require('./overwriteBabelRuntimePromise')

module.exports = function overwrite ($q) {
    overwritePromise($q)
    overwriteBabelRuntimePromise($q)
}
