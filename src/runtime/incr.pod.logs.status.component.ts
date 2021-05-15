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

import {AfterContentInit, AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {TISService} from "../service/tis.service";
import {AppFormComponent, CurrentCollection} from "../common/basic.form.component";
import {ActivatedRoute} from "@angular/router";
import {NgTerminal} from "ng-terminal";
import {NzModalService, NzNotificationService} from "ng-zorro-antd";
import {Subject} from "rxjs";
import {WSMessage} from "./core.build.progress.component";
import {IncrBuildComponent, IndexIncrStatus} from "./incr.build.component";
import {K8sPodState} from "./misc/RCDeployment";


@Component({
  selector: 'incr-pod-logs-status',
  template: `
      <nz-spin [nzSize]="'large'" [nzSpinning]="this._transactionProcessing || this.formDisabled">
          <div style="height: 800px;">
              <nz-alert *ngIf="this.logMonitorTimeout" nzType="warning" [nzDescription]="warnTpl" nzShowIcon></nz-alert>
              <ng-template #warnTpl>
                  日志监听已经超时，请重连
                  <button nz-button nzType="primary" nzSize="small" (click)="reconnLogMonitor()">重连</button>
              </ng-template>
              <nz-page-header>
                  <nz-page-header-title>{{this.selectedPod?.name}}
                      <nz-tag>{{this.selectedPod?.phase}}</nz-tag>
                  </nz-page-header-title>
                  <nz-page-header-extra>
                      <button nz-button nzType="primary" (click)="relauchIncrProcess()">重启</button>
                  </nz-page-header-extra>
              </nz-page-header>
              <ng-terminal #term></ng-terminal>
          </div>
      </nz-spin>
  `,
  styles: [
      `  nz-page-header {
          padding: 4px;
      }

      nz-alert {
          margin: 10px 0 10px 0;
      }
    `
  ]
})
export class IncrPodLogsStatusComponent extends AppFormComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  private currCollection: CurrentCollection;
  @ViewChild('term', {static: true}) terminal: NgTerminal;
  private componentDestroy = false;
  @Input()
  msgSubject: Subject<WSMessage>;
  @Input()
  incrStatus: IndexIncrStatus;
  logMonitorTimeout = false;
  selectedPod: K8sPodState;

  _transactionProcessing = false;


  constructor(tisService: TISService, route: ActivatedRoute, modalService: NzModalService, notification: NzNotificationService) {
    super(tisService, route, modalService, notification);
  }


  ngOnInit(): void {
    super.ngOnInit();
    this.sendIncrdeployChange();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroy = true;
  }

  ngAfterContentInit(): void {
    this.msgSubject.subscribe((response: WSMessage): void => {
      if (!response || this.componentDestroy) {
        return;
      }
      // console.log(response);
      switch (response.logtype) {
        case "incrdeploy-change":

          if (response.data.msg.timeout) {
            this.logMonitorTimeout = true;
          } else {
            this.logMonitorTimeout = false;
            this.terminal.write(response.data.msg + "\r\n");
          }
          break;
      }
    });
  }

  protected initialize(app: CurrentCollection): void {
    this.currCollection = app;
  }

  /**
   * 重新连接
   */
  reconnLogMonitor() {
    // this.msgSubject.next();
    this.sendIncrdeployChange();
    this.successNotify("已经成功发送重连");
  }

  private sendIncrdeployChange() {
    this.selectedPod = this.incrStatus.getFirstPod();
    if (this.selectedPod) {
      this.msgSubject.next(new WSMessage(`incrdeploy-change:${this.selectedPod.name}`));
    }
  }


  /**
   * 重启增量执行
   */
  relauchIncrProcess() {
    this._transactionProcessing = true;
    this.httpPost('/coredefine/corenodemanage.ajax', "event_submit_do_relaunch_incr_process=y&action=core_action")
      .then((r) => {
        if (r.success) {
          this.successNotify(`已经成功触发重启增量实例${this.currentApp.appName}`);

          setTimeout(() => {
            IncrBuildComponent.getIncrStatusThenEnter(this, (incrStat: IndexIncrStatus) => {
              this.incrStatus = incrStat;
              this.sendIncrdeployChange();
              this._transactionProcessing = false;
            }, false);
          }, 3000);
        } else {
          this._transactionProcessing = false;
        }
      });
  }
}
