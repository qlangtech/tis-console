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

import {AfterContentInit, AfterViewChecked, AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef} from "@angular/core";
import {TISService} from "../service/tis.service";
import {AppFormComponent, BasicFormComponent, CurrentCollection, WSMessage} from "../common/basic.form.component";

import {ActivatedRoute, Router} from "@angular/router";
import {EditorConfiguration} from "codemirror";
import {MultiViewDAG} from "../common/MultiViewDAG";
import {AddAppFlowDirective} from "../base/addapp.directive";

import {NzModalService, NzNotificationService} from "ng-zorro-antd";
import {PluginSaveResponse} from "../common/tis.plugin";
import {K8SReplicsSpecComponent} from "../common/k8s.replics.spec.component";
import {DataXJobWorkerStatus, DataxWorkerDTO} from "./datax.worker.component";
import {IndexIncrStatus} from "../runtime/incr.build.component";
import {Subject} from "rxjs";
import {K8sPodState, LogType, RcHpaStatus} from "../runtime/misc/RCDeployment";

@Component({
  template: `
      <nz-spin size="large" [nzSpinning]="this.formDisabled">
          <nz-tabset nzSize="large" [(nzSelectedIndex)]="tabSelectIndex" [nzTabBarExtraContent]="extraTemplate">
              <nz-tab nzTitle="基本" (nzSelect)="profileTabSelect()">
                  <ng-template nz-tab>
                      <div class="item-block">
                          <h2 class="ant-descriptions-title h2-header">Pods</h2>
                          <nz-table #pods nzSize="small" nzBordered="true" nzShowPagination="false" [nzData]="this?.dto.rcDeployment.pods">
                              <thead>
                              <tr>
                                  <th width="20%">名称</th>
                                  <th>状态</th>
                                  <th>重启次数</th>
                                  <th>创建时间</th>
                              </tr>
                              </thead>
                              <tbody>
                              <tr *ngFor="let pod of pods.data">
                                  <td>
                                      <button nz-button nzType="link" (click)="viewPodLog(pod)">{{pod.name}}</button>
                                  </td>
                                  <td>
                                      <nz-tag [nzColor]="'blue'"> {{pod.phase}}</nz-tag>
                                  </td>
                                  <td>
                                      {{pod.restartCount}}
                                  </td>
                                  <td>{{pod.startTime | date:'yyyy/MM/dd HH:mm:ss'}}</td>
                              </tr>
                              </tbody>
                          </nz-table>
                      </div>
                      <div *ngIf="rcHpaStatus" class="item-block">
                          <h2 class="ant-descriptions-title h2-header">扩缩容</h2>
                          <nz-descriptions class="desc-block" nzTitle="规格" nzBordered>
                              <nz-descriptions-item nzTitle="minReplicas">{{rcHpaStatus.autoscalerSpec.minReplicas}}</nz-descriptions-item>
                              <nz-descriptions-item nzTitle="maxReplicas">{{rcHpaStatus.autoscalerSpec.maxReplicas}}</nz-descriptions-item>
                              <nz-descriptions-item nzTitle="targetCPUUtilizationPercentage" nzSpan="1">{{rcHpaStatus.autoscalerSpec.targetCPUUtilizationPercentage}}%</nz-descriptions-item>
                          </nz-descriptions>
                          <nz-descriptions class="desc-block" nzTitle="当前状态" nzBordered>
                              <nz-descriptions-item nzTitle="currentCPUUtilizationPercentage">{{rcHpaStatus.autoscalerStatus.currentCPUUtilizationPercentage}}</nz-descriptions-item>
                              <nz-descriptions-item nzTitle="currentReplicas">{{rcHpaStatus.autoscalerStatus.currentReplicas}}</nz-descriptions-item>
                              <nz-descriptions-item nzTitle="desiredReplicas">{{rcHpaStatus.autoscalerStatus.desiredReplicas}}</nz-descriptions-item>
                              <nz-descriptions-item *ngIf="rcHpaStatus.autoscalerStatus.lastScaleTime > 0" nzTitle="lastScaleTime">{{rcHpaStatus.autoscalerStatus.lastScaleTime | date: 'yyyy/MM/dd HH:mm'}}</nz-descriptions-item>
                          </nz-descriptions>
                          <div class="ant-descriptions desc-block">
                              <h3 class="ant-descriptions-title">扩缩容事件</h3>
                              <tis-page [tabSize]="'small'" [showPagination]="false" [rows]="rcHpaStatus.conditions">
                                  <tis-col title="类型" width="5" field="type"></tis-col>
                                  <tis-col title="状态" width="5" field="status"></tis-col>
                                  <tis-col title="时间" width="14" field="lastTransitionTime"></tis-col>
                                  <tis-col title="原因" width="14" field="reason"></tis-col>
                                  <tis-col title="描述" field="message"></tis-col>
                              </tis-page>
                          </div>
                      </div>
                      <!--
                          <nz-alert *ngIf="this.dto.incrProcessLaunchHasError" nzType="error" [nzDescription]="errorTpl" nzShowIcon></nz-alert>
                          <ng-template #errorTpl>
                              增量处理节点启动有误
                              <button nz-button nzType="link" (click)="tabSelectIndex=2">查看启动日志</button>
                          </ng-template>
                          <incr-build-step4-running-tab-base [msgSubject]="msgSubject" [dto]="dto"></incr-build-step4-running-tab-base>
                      -->
                  </ng-template>
              </nz-tab>
              <nz-tab nzTitle="规格" (nzSelect)="envTabSelect()">
                  <nz-descriptions class="desc-block" nzTitle="配置" nzBordered>
                      <nz-descriptions-item nzTitle="Docker Image">{{dto.rcDeployment.dockerImage}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="创建时间">{{dto.rcDeployment.creationTimestamp | date : "yyyy/MM/dd HH:mm:ss"}}</nz-descriptions-item>
                  </nz-descriptions>
                  <nz-descriptions class="desc-block" nzTitle="当前状态" nzBordered>
                      <nz-descriptions-item nzTitle="availableReplicas">{{dto.rcDeployment.status.availableReplicas}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="fullyLabeledReplicas">{{dto.rcDeployment.status.fullyLabeledReplicas}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="observedGeneration">{{dto.rcDeployment.status.observedGeneration}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="readyReplicas">{{dto.rcDeployment.status.readyReplicas}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="replicas">{{dto.rcDeployment.status.replicas}}</nz-descriptions-item>
                  </nz-descriptions>
                  <nz-descriptions class="desc-block" nzTitle="资源分配" nzBordered>
                      <nz-descriptions-item nzTitle="CPU">
                          <nz-tag>request</nz-tag>
                          {{dto.rcDeployment.cpuRequest.val + dto.rcDeployment.cpuRequest.unit}}
                          <nz-tag>limit</nz-tag>
                          {{dto.rcDeployment.cpuLimit.val + dto.rcDeployment.cpuLimit.unit}}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="Memory">
                          <nz-tag>request</nz-tag>
                          {{dto.rcDeployment.memoryRequest.val + dto.rcDeployment.memoryRequest.unit}}
                          <nz-tag>limit</nz-tag>
                          {{dto.rcDeployment.memoryLimit.val + dto.rcDeployment.memoryLimit.unit}}</nz-descriptions-item>
                  </nz-descriptions>
                  <nz-descriptions class="desc-block" nzTitle="环境变量" nzBordered>
                      <nz-descriptions-item *ngFor=" let e of  dto.rcDeployment.envs | keyvalue" [nzTitle]="e.key">{{e.value}}</nz-descriptions-item>
                  </nz-descriptions>


              </nz-tab>
              <nz-tab nzTitle="日志" (nzSelect)="logtypeSelect()">
                  <ng-template nz-tab>
                      <incr-pod-logs-status *ngIf="selectedPod && msgSubject" [selectedPod]="selectedPod" [msgSubject]="this.msgSubject" [logType]="logtype"></incr-pod-logs-status>
                  </ng-template>
              </nz-tab>
              <nz-tab nzTitle="操作" (nzSelect)="manageSelect()">
                  <nz-page-header class="danger-control-title" nzTitle="危险操作" nzSubtitle="以下操作可能造成某些组件功能不可用">
                  </nz-page-header>
                  <nz-list class="ant-advanced-search-form" nzBordered>
                      <nz-list-item>
                          <span nz-typography>删除DataX Worker</span>
                          <button nz-button nzType="danger" (click)="dataXWorkerDelete()"><i nz-icon nzType="delete" nzTheme="outline"></i>删除</button>
                      </nz-list-item>
                  </nz-list>
              </nz-tab>
          </nz-tabset>

          <ng-template #extraTemplate>
              <button nz-button nzType="link"><i nz-icon nzType="sync" nzTheme="outline"></i>更新</button>
          </ng-template>
      </nz-spin>
  `
  , styles: [
      `   .h2-header {
            padding: 3px;
            background-color: #e1e1e1;
        }

        .desc-block {
            margin-top: 20px;
        }

        .danger-control-title {
            margin-top: 10px;
            padding: 0px 0;
        }

        .ant-advanced-search-form {
            padding: 10px;
            #background: #fbfbfb;
            border: 2px solid #d97f85;
            border-radius: 6px;
            margin-bottom: 10px;
            clear: both;
        }
    `]
})
export class DataxWorkerRunningComponent extends AppFormComponent implements AfterViewInit, OnInit {
  // savePlugin = new EventEmitter<any>();
  // @ViewChild('k8sReplicsSpec', {read: K8SReplicsSpecComponent, static: true}) k8sReplicsSpec: K8SReplicsSpecComponent;
  @Output() nextStep = new EventEmitter<any>();
  @Output() preStep = new EventEmitter<any>();
  // @Input() dto: DataxWorkerDTO;

  msgSubject: Subject<WSMessage>;
  dto: DataXJobWorkerStatus = new DataXJobWorkerStatus();
  tabSelectIndex = 0;
  selectedPod: K8sPodState = null;
  logtype = LogType.DATAX_WORKER_POD_LOG;

  rcHpaStatus: RcHpaStatus;

  podNameSub;

  constructor(tisService: TISService, route: ActivatedRoute, modalService: NzModalService, private router: Router, notification: NzNotificationService) {
    super(tisService, route, modalService, notification);
  }

  ngOnInit(): void {
    // super.ngOnInit();
    // console.log("==========================");
    this.route.params.subscribe((p) => {
      let targetTab = p['targetTab'];
      // console.log(targetTab);
      switch (targetTab) {
        case 'log':
          if (!this.podNameSub) {
            this.podNameSub = this.route.fragment.subscribe((podName) => {
              console.log(`podName:${podName}`);
              if (this.route.snapshot.params['targetTab'] !== 'log') {
                return;
              }
              if (!this.selectedPod) {
                // 取得容器第一个pod
                let pods = this.dto.rcDeployment.pods;
                if (pods.length < 1) {
                  this.errNotify("容器还未分配Pod资源");
                  return;
                }
                this.selectedPod = pods[0];
              }
              if (podName !== undefined && podName !== this.selectedPod.name) {
                this.selectedPod = this.dto.rcDeployment.pods.find((pp) => (pp.name === podName));
                if (!this.selectedPod) {
                  throw new Error("can not find podName:" + podName + " in:" + this.dto.rcDeployment.pods.map((pp) => pp.name).join(","));
                }
              }
              let logtype = this.logtype + ":" + this.selectedPod.name;
              if (!this.msgSubject) {
                this.msgSubject = this.getWSMsgSubject(logtype);
              } else {
                this.msgSubject.next(new WSMessage(logtype));
              }
              this.tabSelectIndex = 2;
            });
          }

          break;
        case 'profile':
          this.profileViewSelect();
          this.tabSelectIndex = 0;
          break;
        case 'env':
        default :
          this.tabSelectIndex = 1;
      }
    });

    // if (!this.dto.rcSpec) {
    //   throw new Error("rcSpec can not be null");
    // }
  }

  launchK8SController() {
    this.jsonPost('/coredefine/corenodemanage.ajax?action=datax_action&emethod=launch_datax_worker'
      , {
        // k8sSpec: this.k8sReplicsSpec.k8sControllerSpec,
      })
      .then((r) => {
        if (r.success) {
          // let rList = PluginsComponent.wrapDescriptors(r.bizresult.pluginDesc);
          // let desc = Array.from(rList.values());
          // this.hlist = DatasourceComponent.pluginDesc(desc[0])
        }
      });
  }

  protected initialize(app: CurrentCollection): void {
  }

  ngAfterViewInit() {
  }


  prestep() {
    // this.preStep.next(this.dto);
  }

  dataXWorkerDelete() {

    this.confirm("是否确定要将DataX任务执行器从K8S容器中删除", () => {
      this.jsonPost('/coredefine/corenodemanage.ajax?action=datax_action&emethod=remove_datax_worker'
        , {})
        .then((r) => {
          if (r.success) {
            // let rList = PluginsComponent.wrapDescriptors(r.bizresult.pluginDesc);
            // let desc = Array.from(rList.values());
            // this.hlist = DatasourceComponent.pluginDesc(desc[0])
            this.nextStep.emit(new DataxWorkerDTO());
          }
        });
    });


  }

  profileTabSelect() {
    // this.jsonPost('/coredefine/corenodemanage.ajax?action=datax_action&emethod=remove_datax_worker'
    //   , {})
    //   .then((r) => {
    //     if (r.success) {
    //       // let rList = PluginsComponent.wrapDescriptors(r.bizresult.pluginDesc);
    //       // let desc = Array.from(rList.values());
    //       // this.hlist = DatasourceComponent.pluginDesc(desc[0])
    //       this.nextStep.emit(new DataxWorkerDTO());
    //     }
    //   });
    this.activeTab('profile');
  }

  private activeTab(tabName: string) {
    let currentTab = this.route.snapshot.params['targetTab']
    if (currentTab !== tabName) {
      this.router.navigate(["/base/datax-worker", tabName], {relativeTo: this.route});
    }
  }

  envTabSelect() {
    this.activeTab('env');
  }

  profileViewSelect(): void {
    this.jsonPost('/coredefine/corenodemanage.ajax?action=datax_action&emethod=get_datax_worker_hpa'
      , {})
      .then((r) => {
        if (r.success) {
          this.rcHpaStatus = r.bizresult;
        }
      });
  }

  logtypeSelect() {
    this.activeTab('log');
    // if (!this.route.snapshot.params['targetTab']) {
    //   this.router.navigate(["/base/datax-worker/log"], {relativeTo: this.route});
    // }
  }

  viewPodLog(podname: K8sPodState) {
    this.router.navigate(["/base/datax-worker/log"], {relativeTo: this.route, fragment: podname.name});
    // this.tabSelectIndex = 2;
  }


  manageSelect() {
    this.activeTab('manage');
  }
}

