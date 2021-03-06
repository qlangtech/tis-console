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

/**
 * Created by baisui on 2017/3/29 0029.
 */
import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {TISService} from "../service/tis.service";
// import {Application} from "../index/application";
import {BasicFormComponent, CurrentCollection} from "../common/basic.form.component";

import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";
import {Observable, Subject} from 'rxjs';
import {debounceTime, map, switchMap} from 'rxjs/operators';
import {HttpClient} from "@angular/common/http";
import {LocalStorageService} from "angular-2-local-storage";
import {LatestSelectedIndex, SelectedIndex} from "../common/LatestSelectedIndex";
// @ts-ignore
import * as $ from 'jquery';
import {NzModalRef, NzModalService, NzNotificationService} from "ng-zorro-antd";
import {ConfirmType} from "ng-zorro-antd/modal/modal-types";
import {InitSystemComponent} from "../common/init.system.component";
import {TisResponseResult} from "../common/tis.plugin";

const KEY_LOCAL_STORAGE_LATEST_INDEX = 'LatestSelectedIndex';

@Component({
  selector: 'my-navigate',
  template: `
      <div class="logo" [ngSwitch]="appHasNotDefine">
          <a *ngSwitchCase="true" class="navbar-brand" routerLink="/">
              <svg version="1.1"
                   preserveAspectRatio="xMinYMin meet"
                   xmlns="http://www.w3.org/2000/svg"
                   width="50" height="31"
                   xmlns:xlink="http://www.w3.org/1999/xlink">

                  <image xlink:href="/images/icon/tis-log.svg" width="50" height="31"/>
              </svg>
          </a>
          <ng-container *ngSwitchCase="false">
              <a class="navbar-brand" routerLink="/base/applist">
                  <i class="fa fa-home fa-2x" aria-hidden="true"></i></a>
          </ng-container>
      </div>

      <ul class="nav-items" nz-menu nzTheme="dark" nzMode="horizontal" [ngSwitch]="appHasNotDefine">
          <ng-container *ngSwitchCase="true">
              <li nz-menu-item>
                  <a nz-dropdown [nzDropdownMenu]="myIndex">
                      我的实例
                      <i nz-icon nzType="down"></i>
                  </a>
                  <nz-dropdown-menu #myIndex="nzDropdownMenu">
                      <ul nz-menu nzSelectable>
                          <li nz-menu-item><a routerLink="/base/applist"><i class="fa fa-list-ul"
                                                                            aria-hidden="true"></i>列表</a></li>
                          <li nz-menu-item><a routerLink="/base/appadd"><i class="fa fa-plus" aria-hidden="true"></i>添加</a></li>
                      </ul>
                  </nz-dropdown-menu>
              </li>
              <li nz-menu-item>
                  <a nz-dropdown [nzDropdownMenu]="baseManage">
                      基础管理
                      <i nz-icon nzType="down"></i>
                  </a>
                  <nz-dropdown-menu #baseManage="nzDropdownMenu">
                      <ul nz-menu nzSelectable>
                          <li nz-menu-item><a routerLink="/base/departmentlist">业务线</a></li>
                          <li nz-menu-item><a routerLink="/base/datax-worker">DataX执行器</a></li>
                          <li nz-menu-item><a routerLink="/base/basecfg">插件配置</a></li>
                          <li nz-menu-item><a routerLink="/base/tpl/snapshotset">索引模版</a></li>
                          <li nz-menu-item><a routerLink="/base/operationlog">操作日志</a></li>
                      </ul>
                  </nz-dropdown-menu>
              </li>

              <li nz-menu-item>
                  <a nz-dropdown [nzDropdownMenu]="offlineManage">
                      离线数据
                      <i nz-icon nzType="down"></i>
                  </a>
                  <nz-dropdown-menu #offlineManage="nzDropdownMenu">
                      <ul nz-menu nzSelectable>
                          <li nz-menu-item><a routerLink="/offline/ds">数据源管理</a></li>
                          <li nz-menu-item><a routerLink="/offline/wf">DF管理</a></li>
                      </ul>
                  </nz-dropdown-menu>
              </li>
          </ng-container>
          <ng-container *ngSwitchCase="false">
              <li class="index-select-block" nz-menu-item nzMatchRouter>
                  <nz-select name="selectedCollection"
                             style="width: 100%;"
                             [nzSize]="'large'"
                             [(ngModel)]="app.name"
                             nzPlaceHolder="请选择"
                             [nzDropdownMatchSelectWidth]="false"
                             nzShowSearch
                             (ngModelChange)="onCollectionChange($event)"
                             [nzServerSearch]="true"
                             (nzOnSearch)="onCollectionSearch($event)"
                  >
                      <ng-container *ngFor="let o of collectionOptionList">
                          <nz-option *ngIf="!isLoading" [nzValue]="o" [nzLabel]="o"></nz-option>
                      </ng-container>
                      <nz-option *ngIf="isLoading" nzDisabled nzCustomContent>
                          <i nz-icon nzType="loading" class="loading-icon"></i> Loading...
                      </nz-option>
                  </nz-select>
              </li>
          </ng-container>
          <li class="user-profile" nz-menu-item nzMatchRouter>
              <button nz-button nzType="link" (click)="openTisAbout()">关于</button>
              <button nz-button nz-dropdown [nzDropdownMenu]="user">
                  <i nz-icon nzType="user" style="margin: 0px" nzTheme="outline"></i>{{userProfile?.name}}
                  <i nz-icon nzType="down"></i>
              </button>
              <nz-dropdown-menu #user="nzDropdownMenu">
                  <ul nz-menu>
                      <li nz-menu-item (click)="viewProfile()"><i nz-icon nzType="info" nzTheme="outline"></i>信息</li>
                      <li nz-menu-item (click)="logout()"><i nz-icon nzType="logout" nzTheme="outline"></i>退出</li>
                  </ul>
              </nz-dropdown-menu>
              <ng-template #tisAbout>
                  <nz-descriptions [nzColumn]="1" nzLayout="horizontal">
                      <nz-descriptions-item nzTitle="构建时间">{{tisMeta.createTime}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="版本">{{tisMeta.buildVersion}}</nz-descriptions-item>
                  </nz-descriptions>
                  <svg version="1.1"
                       preserveAspectRatio="xMinYMin meet"
                       xmlns="http://www.w3.org/2000/svg"
                       width="70" height="43"
                       xmlns:xlink="http://www.w3.org/1999/xlink">
                      <image xlink:href="/images/icon/tis-log.svg" width="70" />
                  </svg>
              </ng-template>
          </li>
          <!--
                    <li nz-menu-item>
                        <a class="nav-link dropdown-toggle" href="#" id="navbarUsers" data-toggle="dropdown"
                           aria-haspopup="true" aria-expanded="false">权限</a>
                        <div class="dropdown-menu" aria-labelledby="navbarUsers">
                            <a class="dropdown-item" href="/runtime/role_list.htm">角色</a>
                            <a class="dropdown-item" href="/runtime/func_list.htm">功能</a>
                            <a class="dropdown-item" routerLink="/t/usr">用户</a>
                        </div>
                    </li>
             -->
      </ul>
  `,
  styles: [`
      .ng-star-inserted {
          margin: 0
      }

      .index-select-block {
          width: 300px;
      }

      .nav-items {
      }

      .navbar-brand {
          font-size: 15px;
      }

      .user-profile {
          float: right;
      }

      .logo {
          margin: 10px 24px 0px 24px;
          float: left;
      }
  `]
})
export class NavigateBarComponent extends BasicFormComponent implements OnInit {
  // 页面部门控件选择的部门Id

  public appId: string;
  app: CurrentCollection;
  // public departmentId: number = -1;
  // public ops: any[];
  @ViewChild(RouterOutlet, {static: false}) router: RouterOutlet;
  // selectedIndex ;
  collectionOptionList: string[] = [];
  isLoading: boolean;
  userProfile: UserProfile;
  tisMeta: TISMeta = {};

  searchChange$ = new Subject<string>();

  @ViewChild('tisAbout', {read: TemplateRef, static: true}) tisAppAbout: TemplateRef<any>;

  @Input() set core(idxapp: any) {
    this.app = idxapp;
  }

  public get appHasNotDefine(): boolean {
    return this.app == null;
  }

  public static popularSelectedIndex(_localStorageService: LocalStorageService): LatestSelectedIndex {
    let popularSelected: LatestSelectedIndex = _localStorageService.get(KEY_LOCAL_STORAGE_LATEST_INDEX);

    if (popularSelected) {
      popularSelected = Object.assign(new LatestSelectedIndex(), popularSelected); // $.extend(, );
    } else {
      popularSelected = new LatestSelectedIndex();
    }
    return popularSelected;
  }

  constructor(tisService: TISService, modalService: NzModalService
    , private r: Router, private route: ActivatedRoute, private _http: HttpClient
    , private _localStorageService: LocalStorageService, notification: NzNotificationService
  ) {
    super(tisService, modalService, notification);
  }


  ngOnInit(): void {
    const getIndeNameList = (fuzzName: string) => {
      return this._http
        .get(`/tjs/runtime/applist.ajax?emethod=query_app&action=app_view_action&query=${fuzzName}`)
        .pipe(map((res: any) => res.bizresult))
        .pipe(
          map((list: any) => {
            return list.map((item: any) => `${item.projectName}`);
          })
        );
    }

    const optionList$: Observable<string[]> = this.searchChange$
      .asObservable()
      .pipe(debounceTime(500))
      .pipe(switchMap(getIndeNameList));

    optionList$.subscribe(data => {
      this.collectionOptionList = data;
      this.isLoading = false;
    });
    let popularSelected = NavigateBarComponent.popularSelectedIndex(this._localStorageService);

    if (this.app) {
      popularSelected.addIfNotContain(this.app);
    }

    this.collectionOptionList = popularSelected.popularLatestSelected;

    let getUserUrl = `/runtime/applist.ajax?emethod=get_user_info&action=user_action`;
    this.httpPost(getUserUrl, '').then((r) => {
      if (r.success) {
        this.userProfile = r.bizresult.usr;
        this.tisMeta = r.bizresult.tisMeta;
        if (!r.bizresult.sysInitialized) {
          this.openInitSystemDialog();
        }
      }
    })
  }

  openInitSystemDialog() {
    let ref: NzModalRef<InitSystemComponent> = this.openDialog(InitSystemComponent, {nzTitle: "初始化TIS", nzClosable: false});
    ref.afterClose.subscribe((result: TisResponseResult) => {
      if (result.success) {
        this.successNotify("TIS配置初始化完成");
      }
    });
  }

  // 点击切换当前app
  public change_app_top(): void {
    // this.httpPost('/runtime/changedomain.ajax'
    //   , 'event_submit_do_change_app_ajax=y&action=change_domain_action&selappid=' + this.appId)
    //   .then(result => {
    //     // this.refreshComponent(this.router.component);
    //   });
    // this.r.navigate(['/t/c/' + this.appId], {relativeTo: this.route});

    this.r.navigate(['/c/' + this.appId]);

  }

  onCollectionSearch(value: string) {
    if (value) {
      const pattern = /^\s*$/;
      if (!pattern.test(value)) {
        this.isLoading = true;
        this.searchChange$.next(value);
      }
    }
  }

  onCollectionChange(value: any) {
    let popularSelected: LatestSelectedIndex = this._localStorageService.get(KEY_LOCAL_STORAGE_LATEST_INDEX);
    if (!popularSelected) {
      popularSelected = new LatestSelectedIndex();
    } else {
      popularSelected = $.extend(new LatestSelectedIndex(), popularSelected);
    }
    popularSelected.add(new SelectedIndex(this.app.appName));
    this._localStorageService.set(KEY_LOCAL_STORAGE_LATEST_INDEX, popularSelected);
    // console.log(popularSelected.popularLatestSelected);
    this.collectionOptionList = popularSelected.popularLatestSelected;
    this.r.navigate(['/c/' + this.app.appName]);
  }

  logout() {

    if (1 === 1) {
      this.viewProfile();
      return;
    }

    let logoutUrl = `/runtime/applist.ajax?emethod=login&action=login_action`;
    this.httpPost(logoutUrl, '').then((r) => {
      this.userProfile = undefined;
    })
  }

  viewProfile() {
    this.infoNotify("用户权限功能还未开放，敬请期待");
  }

  openTisAbout(): void {
    this.modalService.info({
      nzTitle: '关于TIS',
      nzContent: this.tisAppAbout,
      nzOkText: 'OK',
      nzOnOk: () => {
      }
    });
  }
}


interface UserProfile {
  department: string;
  departmentid: number,
  id: string;
  name: string;
}

interface TISMeta {
  buildVersion?: string;
  createTime?: string;
}
