# angular-controller

[![npm version](https://badge.fury.io/js/angular-controller.svg)](https://badge.fury.io/js/angular-controller)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

AngularController 用于改进 Angular1 编码体验，开启 ESNext 使用新模式。

快速预览（[地址](https://stackblitz.com/edit/angular-controller)）：

```javascript
import angular from 'angular'
import { AngularController, inject, watch } from 'angular-controller'

@inject('$scope')
class AppController extends AngularController {
  static NAME = 'AppController'

  $onState() {
    return {
      value: 'angular controller',
      upperCaseValue: ''
    }
  }

  @watch('value', { immediate: true })
  onValueChanged(value) {
    this.upperCaseValue = value && value.toUpperCase()
  }
}

angular.module('App', []).controller(AppController.NAME, AppController)
```

```html
<div ng-app="App">
  <div ng-controller="AppController">
    <input ng-model="value"/>
    <span>{{upperCaseValue}}</span>
  </div>
</div>
```

## 为什么？

1. Angular1 的 Controller 无法使用 function prototype 和 ES6 class 特性，原因在其模板作用域（`$scope`）并未使用 Controller 实例（`this`）
2. 虽然 1.2 版本后可以通过设置 `controllerAs` 补救，但这样却又破坏了 HTML 模板原有语法，模板中所有原来与 $scope 绑定的属性、方法前都需要加上前缀，使用体验仍然不佳
3. 此外在 1.4 版本之前不支持 `bindToController`，使用 `controllerAs` 选项后，指令的继承属性仍然必须从 `$scope` 而非实例上获取

AngularController 解决了以上痛点，并提供了大量的优化特性，包括：

1. 声明式属性
2. 实例方法或 getter/setter 自动绑定 this
3. 支持继承
4. 实例上提供 $scope 上常用 API，如：`$watch`, `$on`, `$emit`, `$broadcast`
5. 统一 `$watch`，`$watchCollection`，`$watchGroup` 三个方法，初始化时不再默认执行
6. 支持计算属性（Computed Properties）
7. 提供多个装饰器，如：watch，on，emit，broadcast 和 emitBefore，broadcastBefore
8. 推荐 async/await 语法（需配置）
9. ...

## 安装

```shell
npm install angular-controller
```

注意：angular-controller 默认使用 ESNext 语法，如需兼容 ES5，请自行编译

## 快速上手

AngularController 默认使用 ESNext 新特性，包括：module、class、decorator、async/await 等。如果你对 ESNext 新特性还不熟悉，建议先[预习](http://es6.ruanyifeng.com/)一下再来。

首先来看一个精简过的示例：

```javascript
@inject('$scope')
class Controller extends AngularController {
  $onState () {
      return {
          name: 'world'
      }
  }
  sayHello () {
      return 'Hello ' + this.name + '!'
  }
}
```

上例中使用 AngularController 所需步骤有：

1. 创建 Controller 类，继承 `AngularController`
2. 使用装饰器 `@inject` 注入所需依赖
3. 创建实例方法 `$onState` 声明属性
4. 创建自定义实例方法

其中：

**1. 基类 `AngularController`**

使用 AngularController 必须继承基类 `AngularController`。基类 `AngularController` 在创建之初会执行 `$onState` 方法得到初始属性，并将属性和所有可用实例方法代理至 `$scope`；此外，`AngularController` 还代理和提供了多个内置实例 API，包括：`$set`、`$on`、`$emit`、`$broadcast`和`$watch` 方法，这些方法后面会逐个介绍。

**2. 装饰器 `@inject`**

装饰器 `@inject` 用于注入依赖，一般必须要注入 `$scope`。注入名称无先后顺序，注入后所有服务会挂载在实例下，可以通过类似 `this.$scope` 的方式来访问。

**注意：** 默认支持的最新的[装饰器提案](https://github.com/tc39/proposal-decorators)，如果需支持旧的提案，修改入口为 `'angular-controller/lagacy/'` 即可

**3. 声明属性 `$onState`**

`$onState` 方法用于声明属性，所有需要参与脏检查机制的属性，即在模板中可以获取的属性、需要被 watch 的属性以及父组件传递下来的接口属性等都需要在此声明，这些属性将会绑定至实例，并代理至 `$scope`；声明时可以设置默认值，如不希望设置默认值，可以设置值为 `undefined`；使用时直接通过类似 `this.name` 方式来读取和通过类似 `this.name = 'AngularController'` 的方式来改变属性，改变将会实时反映至 `$scope` 上。

**4. 实例方法和实例 getter/setter**

所有实例方法或实例 getter/setter（除 constructor、以 '$' 开头的和不可配置（configurable 为 true）的以外），在创建 Controller 时会和属性一并代理至 `$scope`；代理至 `$scope` 的方法会绑定实例，所以无需担心内部 `this` 指向问题。

## API

#### 基类 AngularController（待完善）

实例方法

- $onState
- $onInit
- $set
- $watch
- $on
- $emit
- $broadcast

装饰器

- inject
- watch
- on
- emit
- emitBefore
- broadcast
- broadcastBefore

#### 辅助函数 overwritePromise，overwriteBabelRuntimePromise，overwriteBrowserAndBabelRuntimePromise

应用启动时覆盖 Promise 为 $q，使得可以直接使用 Promise，async/await

overwritePromise 用于覆盖全局 Promise

示例：

```javascript
import angular from 'angular'
import overwritePromise from 'angular-controller/overwritePromise.js'

// 根应用启动时
angular.module('YourApp').controller('YourMainController', ['$q', function ($q) {
  overwritePromise($q)
  // 之后整个项目就可直接使用 Promise 和 async/await 了
}])
```

overwriteBabelRuntimePromise 用于覆盖 babel-plugin-transform-runtime 生成的 Promise， overwriteBrowserAndBabelRuntimePromise 两者都会覆盖。用法一致，不作说明。

***

MIT
