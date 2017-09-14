const ScopeController = require('./ScopeController')


const inject = require('./inject')
inject.install(ScopeController)
ScopeController.inject = inject

const watch = require('./watch')
watch.install(ScopeController)
ScopeController.watch = watch

const on = require('./on')
on.install(ScopeController)
ScopeController.on = on

const emit = require('./emit')
emit.install(ScopeController)
ScopeController.emit = emit
ScopeController.emitBefore = require('./emitBefore')

const broadcast = require('./broadcast')
broadcast.install(ScopeController)
ScopeController.broadcast = broadcast
ScopeController.broadcastBefore = require('./broadcastBefore')


module.exports = ScopeController
