/**
 * Copyright (c) 2020 QingLang, Inc. <baisui@qlangtech.com>
 * <p>
 *   This program is free software: you can use, redistribute, and/or modify
 *   it under the terms of the GNU Affero General Public License, version 3
 *   or later ("AGPL"), as published by the Free Software Foundation.
 * <p>
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *   FITNESS FOR A PARTICULAR PURPOSE.
 * <p>
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// import {NgModule} from "@angular/core";
// import {BrowserModule} from "@angular/platform-browser";
// import {FormsModule} from "@angular/forms";
// import {RouterModule} from "@angular/router";
// // import {HttpModule, JsonpModule} from "@angular/http";
//
// import {AppComponent} from "./app.component";
//
//
// import {TISService} from "../service/tis.service";
// //
// import {ScriptService} from "../service/script.service";
// // import {BasiManageModule} from "../base/base.manage.module";
// // import {CoreNodeManageModule} from "./core.node.manage.module";
// // import {UserModule} from "../user/user.module";
// // import {OfflineModule} from "../offline/offline.module";
// import {TisCommonModule} from "../common/common.module";
// // import {UserModuleNgFactory} from "../../aot/src/user/user.module.ngfactory";
//
// // export function getUserModule(): any {
// //   // return UserModule;
// //   return UserModuleNgFactory;
// // }
// // https://github.com/angular/angular/issues/11075 loadChildren 子模块不支持aot编译的问题讨论
// // router 的配置
// @NgModule({
//   id: 'tisRoot',
//   imports: [BrowserModule, FormsModule, TisCommonModule,
//     RouterModule.forRoot([
//       // {  // 索引一览
//       //   path: 't/base',
//       //   loadChildren: () => BasiManageModule // '/tjs/base/base.manage.module#BasiManageModule'
//       // },
//       // {  // 用户权限
//       //   path: 't/usr',
//       //   loadChildren: getUserModule
//       // },
//       // {   // 离线
//       //   path: 't/offline',
//       //   loadChildren: () => OfflineModule // '/tjs/offline/offline.module#OfflineModule'
//       // },
//       // {   // 索引控制台
//       //   path: 't/c/:name',
//       //   loadChildren: () => CoreNodeManageModule // '/tjs/runtime/core.node.manage.module#CoreNodeManageModule'
//       // }
//     ])],
//   declarations: [AppComponent, ///
//   ],
//   exports: [],
//   entryComponents: [],
//   bootstrap: [AppComponent],
//   providers: [TISService, ScriptService]
//
// })
// export class AppModule {
// }
