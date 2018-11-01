module.exports = function overwrite ($q) {
    require('babel-runtime/core-js/promise').default = $q
}
