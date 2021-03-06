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

import {Component, OnInit} from '@angular/core';
import {TISService} from '../service/tis.service';
import {BasicFormComponent} from '../common/basic.form.component';

import {Pager} from "../common/pagination.component";
import {ActivatedRoute, Router} from "@angular/router";
import {NzModalService} from "ng-zorro-antd";

// 查看操作日志
@Component({
  template: `

      <tis-page-header title="操作日志" [showBreadcrumb]="showBreadcrumb">
      </tis-page-header>

      <tis-page [spinning]="formDisabled" [pager]="pager" [rows]="logs" (go-page)="goPage($event)">
          <tis-col title="操作者" width="14" field="usrName"></tis-col>
          <tis-col title="操作对象" width="30">
              <ng-template let-l='r'>{{l.tabName}}#{{l.opType}}</ng-template>
          </tis-col>
          <tis-col *ngIf="showBreadcrumb" title="应用" field="appName" >
          </tis-col>
          <tis-col title="创建时间">
              <ng-template let-l='r'>{{l.createTime | date : "yyyy/MM/dd HH:mm:ss"}}</ng-template>
          </tis-col>
          <tis-col title="操作">
              <ng-template let-l='r'>
                  <button nz-button [nzType]="'link'" (click)="operationDetail(l.opId)"><i nz-icon nzType="eye" nzTheme="outline"></i></button>
              </ng-template>
          </tis-col>
      </tis-page>
      <nz-drawer
              [nzBodyStyle]="{ height: 'calc(100% - 55px)', overflow: 'auto', 'padding-bottom': '53px' }"
              [nzMaskClosable]="true"
              [nzWidth]="'40%'"
              [nzVisible]="logVisible"
              nzTitle="日志"
              (nzOnClose)="logViewClose()"
      >
          <pre style="word-wrap:break-word;white-space: pre-wrap;">{{detail}}</pre>
      </nz-drawer>
  `
})
export class OperationLogComponent extends BasicFormComponent implements OnInit {
  logs: any[] = [];
  private detailLog: string;
  pager: Pager = new Pager(1, 1);
  logVisible: boolean;
  showBreadcrumb: boolean;

  constructor(tisService: TISService, modalService: NzModalService, private router: Router, private route: ActivatedRoute) {
    super(tisService, modalService);
  }


  ngOnInit(): void {
    // showBreadcrumb
    let sn = this.route.snapshot;
    this.showBreadcrumb = sn.data["showBreadcrumb"];
    this.route.queryParams.subscribe((param) => {
      this.httpPost('/runtime/operation_log.ajax'
        , `action=operation_log_action&emethod=get_init_data&page=${param['page']}`)
        .then((r) => {
          this.pager = Pager.create(r);
          this.logs = r.bizresult.rows;
        });
    });
  }

  public get showDetail(): boolean {
    return this.detail != null;
  }


  // 显示详细信息
  public operationDetail(opId: number): void {
    this.httpPost(
      '/runtime/operation_detail.ajax?action=operation_log_action&event_submit_do_get_detail=y&opid=' + opId, '')
      .then(result => {
        this.detailLog = result.bizresult.opDesc;
        this.logVisible = true;
      });
  }

  public get detail(): string {
    return this.detailLog;
  }

  goPage(pageNum: number) {
    Pager.go(this.router, this.route, pageNum);
  }

  logViewClose() {
    this.logVisible = false;
    this.detailLog = null;
  }
}
