const ScopeController = require('./ScopeController')


require('./inject').install(ScopeController)

require('./watch').install(ScopeController)

require('./on').install(ScopeController)

require('./emit').install(ScopeController)
require('./emitBefore').install(ScopeController)

require('./broadcast').install(ScopeController)
require('./broadcastBefore').install(ScopeController)


ScopeController.ScopeController = ScopeController
ScopeController.default = ScopeController
Object.defineProperty(ScopeController, '__esModule', {value: true})

module.exports = ScopeController
