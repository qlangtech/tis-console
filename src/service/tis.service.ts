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

import {Injectable} from '@angular/core';

import 'rxjs/add/operator/toPromise';
import {CurrentCollection} from '../common/basic.form.component';
import {Observable, Observer, Subject} from "rxjs";
// @ts-ignore
import * as NProgress from 'nprogress/nprogress.js';
import {NzNotificationService} from "ng-zorro-antd/notification";
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
import {TisResponseResult} from "../common/tis.plugin";

declare var TIS: any;

// @ts-ignore
@Injectable()
export class TISService {
  // 导航栏头部的应用是否可以选择？
  // private appSelectable: boolean = false;
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
  // https://medium.com/@lwojciechowski/websockets-with-angular2-and-rxjs-8b6c5be02fac
  // private socket: Subject<MessageEvent>;
  private currApp: CurrentCollection;
  public execId: string;

  constructor(protected http: HttpClient
              // , private modalService: NgbModal
    , public notification: NzNotificationService) {
  }

  // 一个websocket的例子 https://tutorialedge.net/post/typescript/angular/angular-websockets-tutorial/
  // 创建websocket
  public wsconnect(url: string): Subject<MessageEvent> {
    // if (!this.socket) {
    let socket = this.wscreate(url);
    // }
    return socket;
  }

  private wscreate(url: string): Subject<MessageEvent> {
    let ws = new WebSocket(url);
    let observable = Observable.create(
      (obs: Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        // ws.onerror = obs.error.bind(obs);
        // TODO： 奇怪 这里接收不到onError的消息，这个后期需要查一下
        //       ws.onerror = function () {
        // console.log("error");
        //       };
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
      }
    );
    let observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      },
    };
    return Subject.create(observer, observable);
  }


  // 是否是日常环境
  public get daily(): boolean {
    return TIS.daily;
  }

  // 通过部门id
  public getIndexListByDptId(dptid: number): Promise<any> {

    return this.http.get<TisResponseResult>('/tjs' + '/runtime/changedomain.ajax?event_submit_do_select_change=y&action=change_domain_action&bizid=' + dptid)
      .toPromise()
      .then(response => response.bizresult as any)
      .catch(this.handleError);
  }

  public set currentApp(currApp: CurrentCollection) {
    // console.log("currentApp");
   // let err = new Error();
   // console.log(err.stack);
    this.currApp = currApp;
  }

  public get currentApp(): CurrentCollection {
    return this.currApp;
  }

// 发送http post请求
  public httpPost(url: string, body: string): Promise<TisResponseResult> {

    let headers = new HttpHeaders();
    headers = headers.append('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
    headers = this.appendHeaders(headers);
    let params: HttpParams = new HttpParams();
    let indexOf = url.indexOf('?');
    if (indexOf > -1) {
      let ps = url.substr(indexOf + 1);
      let pArray: string[] = ps.split("&");
      pArray.forEach((r) => {
        let kv: string[] = r.split("=");
        params = params.append(kv[0], kv[1]);
      });
    }
    let opts = {'headers': headers, 'params': params};
    return this.http.post<TisResponseResult>('/tjs' + url, body, opts)
      .toPromise()
      .then((response) => {
        let result = this.processResult(response);
        if (result) {
          return result;
        }
        return () => Promise.reject(response);
      }).catch(this.handleError);
  }

  protected appendHeaders(headers: HttpHeaders): HttpHeaders {
    let result = headers;
    // console.log(this.currApp);
    if (this.currApp) {
      result = result.set('appname', this.currApp.appName);
      result = result.set('appid', '' + this.currApp.appid);
    }
    if (this.execId) {
      result = result.set("execId", this.execId);
    }
    return result;
    // return headers;
  }


  // 发送json表单
  public jsonPost(url: string, body: any): Promise<TisResponseResult> {
    let headers = new HttpHeaders();
    headers = headers.set('content-type', 'text/json; charset=UTF-8');
    let opts = {'headers': this.appendHeaders(headers)};
    return this.http.post<TisResponseResult>('/tjs' + url, body, opts).pipe()
      .toPromise()
      // @ts-ignore
      .then((response) => {
        let result = this.processResult(response);
        if (result) {
          return result;
        } else {
          return response;
        }
        // return () => Promise.reject(response);
      }).catch(this.handleError);
  }

  public jsonp(url: string): Promise<TisResponseResult> {

    return this.http.jsonp('/tjs' + url, "callback").pipe().toPromise()
      .then(response => {
        let tisResult: TisResponseResult = {success: true, bizresult: response};
        return tisResult;
      }).catch(this.handleError)
  }

  public jPost(url: string, o: any): Promise<TisResponseResult> {
    return this.jsonPost(url, JSON.stringify(o));
  }

  private processResult(result: TisResponseResult): TisResponseResult {
    if (result.success) {
      return result;
    } else {
      // faild
      let errs: string[] = result.errormsg;

      // 在页面上显示错误
      if (!!result.action_error_page_show) {
        return result;
      }

      let errContent = '<ul class="list-ul-msg">' + errs.map((r) => `<li>${r}</li>`).join('') + '</ul>';
      this.notification.create('error', '错误', errContent, {nzDuration: 6000});
      if (result.errorfields && result.errorfields.length > 0) {
        return result;
      }
      // return result;
    }
  }

  // protected handleError(error: any): Promise<any> {
  //   // console.error('An error occurred', error);
  //   this.notification.create('error', '错误', error, {nzDuration: 6000});
  //   NProgress.done();
  //   return Promise.reject(error.message || error);
  // }

  protected handleError = (error: any): Promise<any> => {
    // console.log(error);
    if (error instanceof HttpErrorResponse) {
      let err: HttpErrorResponse = error;
      this.notification.create('error', '错误', `系统发生错误，请联系系统管理员<br> ${err.message} <br> ${err.error} `, {nzPlacement: 'topLeft', nzDuration: 60000, nzStyle: {width: "800px"}});
    }
    // console.log(this);

    NProgress.done();
    return Promise.reject(error.message || error);
  }

}

// @Injectable()
// export class AppTISService extends TISService {
//   // 当前上下文中使用的索引实例
//   private currApp: CurrentCollection;
//
//   constructor(http: HttpClient, modalService: NgbModal,
//               notification: NzNotificationService) {
//     super(http, modalService, notification);
//   }
//
//   public set currentApp(currApp: CurrentCollection) {
//     this.currApp = currApp;
//   }
//
//   public get currentApp(): CurrentCollection {
//     return this.currApp;
//   }
//
//   protected appendHeaders(headers: HttpHeaders): HttpHeaders {
//     let result = headers;
//     if (this.currApp) {
//       result = headers.append('appname', this.currApp.appName);
//       result = result.append('appid', '' + this.currApp.appid);
//     }
//     return result;
//   }
// }



