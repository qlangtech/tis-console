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

import {AfterViewInit, Component, Input, OnInit} from "@angular/core";
import {TISService} from "../service/tis.service";
import {CurrentCollection} from "../common/basic.form.component";
import {NzDrawerRef, NzDrawerService, NzModalService, NzNotificationService} from "ng-zorro-antd";
import {HeteroList, Item, PluginSaveResponse} from "../common/tis.plugin";
import {BasicDataXAddComponent} from "./datax.add.base";
import {ActivatedRoute, Router} from "@angular/router";
import {StepType} from "../common/steps.component";
import {WorkflowAddComponent} from "../offline/workflow.add.component";
import {DataxDTO} from "./datax.add.component";

export enum ExecModel {
  Create, Reader
}


// 文档：https://angular.io/docs/ts/latest/guide/forms.html
@Component({
  selector: "datax-config",
  template: `
      <tis-steps *ngIf="createModel" [type]="stepType" [step]="offsetStep(4)"></tis-steps>
      <!--      <tis-page-header [showBreadcrumb]="false" [result]="result">-->
      <!--          <tis-header-tool>-->
      <!--              <button nz-button nzType="default">上一步</button>&nbsp;<button nz-button nzType="primary" (click)="createStepNext()">创建</button>-->
      <!--          </tis-header-tool>-->
      <!--      </tis-page-header>-->
      <nz-spin [nzSpinning]="this.formDisabled">
          <ng-container [ngSwitch]="createModel">
              <tis-steps-tools-bar *ngSwitchCase="true" (cancel)="cancel()" [goBackBtnShow]="_offsetStep>0" (goBack)="goback()">
                  <final-exec-controller [ngSwitch]="createDataXStep">
                      <button *ngSwitchCase="true" nz-button nzType="primary" (click)="createStepNext()"><i nz-icon nzType="rocket" nzTheme="outline"></i>创建</button>
                      <button *ngSwitchCase="false" nz-button nzType="primary" (click)="updateStepNext()"><i nz-icon nzType="rocket" nzTheme="outline"></i>更新</button>
                  </final-exec-controller>
              </tis-steps-tools-bar>
              <div *ngSwitchCase="false" class="fix-foot">

                  <ng-container [ngSwitch]="inUpdate">
                      <button nz-button *ngSwitchCase="false" (click)="startUpdate()"><i nz-icon nzType="edit" nzTheme="outline"></i>编辑基本信息</button>&nbsp;
                      <button nz-button *ngSwitchCase="false" (click)="startEditReader()"><i nz-icon nzType="edit" nzTheme="outline"></i>Reader</button>&nbsp;
                      <button nz-button *ngSwitchCase="false" (click)="startEditWriter()"><i nz-icon nzType="edit" nzTheme="outline"></i>Writer</button>&nbsp;
                      <button nz-button *ngSwitchCase="true" nzType="danger" (click)="inUpdate = false"><i nz-icon nzType="edit" nzTheme="outline"></i>取消编辑</button>
                  </ng-container>
                  &nbsp;
                  <button nz-button [disabled]="inUpdate" nzType="primary" (click)="reGenerate()">生成DataX配置文件</button>
              </div>
          </ng-container>
          <h3>配置文件</h3>
          <ul class="item-block child-block">
              <li *ngFor="let f of genCfgFileList">
                  <button (click)="viewGenFile(f)" nz-button nzType="link" nzSize="large"><i nz-icon nzType="file-text" nzTheme="outline"></i>{{f}}</button>
              </li>
              <i style="color:#777777;font-size: 10px">生成时间：{{lastestGenFileTime | date : "yyyy/MM/dd HH:mm:ss"}}</i>
          </ul>
          <h3>基本信息</h3>
          <div class="item-block">
              <tis-plugins (afterSave)="afterPluginSave($event)" [errorsPageShow]="false"
                           [formControlSpan]="20" [shallInitializePluginItems]="false" [showSaveButton]="inUpdate" [disabled]="!inUpdate"
                           [plugins]="[{name: 'appSource', require: true, extraParam: pluginExtraParam}]"></tis-plugins>
          </div>
          <h3>Reader</h3>
          <div class="item-block">
              <tis-plugins (afterSave)="afterPluginSave($event)" [errorsPageShow]="false"
                           [formControlSpan]="20" [shallInitializePluginItems]="false" [showSaveButton]="false" [disabled]="true"
                           [plugins]="[{name: 'dataxReader', require: true, extraParam: pluginExtraParam}]"></tis-plugins>
<!--
              <datax-reader-table-select *ngIf="dto.processMeta && dto.processMeta.readerRDBMS" [execModel]="readModel" [dtoooo]="dto" [inReadonly]="true"></datax-reader-table-select>
-->
          </div>
          <h3>Writer</h3>
          <div class="item-block">
              <tis-plugins (afterSave)="afterPluginSave($event)" [showExtensionPoint]="{open:false}" [errorsPageShow]="false"
                           [formControlSpan]="20" [shallInitializePluginItems]="false" [showSaveButton]="false" [disabled]="true"
                           [plugins]="[{name: 'dataxWriter', require: true, extraParam: pluginExtraParam}]"></tis-plugins>
          </div>
      </nz-spin>
  `
  , styles: [
      `
            .fix-foot {
                z-index: 100;
                padding: 6px;
                background-color: #f1f1f1;
                height: 40px;
                text-align: center;
                position: fixed;
                bottom: 0px;
                width: 100%;
            }

            .child-block {
                list-style-type: none;
            }

            .child-block li {
                display: inline-block;
                width: 20%;
                padding-right: 8px;
            }

            .editable-cell {
                position: relative;
                padding: 5px 12px;
                cursor: pointer;
            }

            .editable-row:hover .editable-cell {
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                padding: 4px 11px;
            }



    `
  ]
})
export class DataxAddStep7Component extends BasicDataXAddComponent implements OnInit, AfterViewInit {
  errorItem: Item = Item.create([]);
  pluginExtraParam: string;
  @Input()
  execModel: ExecModel = ExecModel.Create;
  inUpdate = false;
  genCfgFileList: Array<string> = [];
  lastestGenFileTime: number;

  readModel = ExecModel.Reader;

  @Input()
  set dtoooo(dto: DataxDTO) {
    this.dto = dto;
  }

  constructor(tisService: TISService, modalService: NzModalService, private drawerService: NzDrawerService, r: Router, route: ActivatedRoute, notification: NzNotificationService) {
    super(tisService, modalService, r, route, notification);
  }

  get createModel(): boolean {
    return this.execModel === ExecModel.Create;
  }

  get createDataXStep(): boolean {
    return this.stepType === StepType.CreateDatax
  }


  ngOnInit(): void {
    if (!this.dto) {
      throw new Error("dto can not be null");
    }
    this.pluginExtraParam = `update_${!this.createModel},justGetItemRelevant_true,dataxName_${this.dto.dataxPipeName}`;
    // console.log(this.pluginExtraParam);
    super.ngOnInit();
  }

  protected initialize(app: CurrentCollection): void {
    this.generate_datax_cfgs((this.execModel === ExecModel.Reader));
  }

  private generate_datax_cfgs(getExist: boolean): Promise<GenerateCfgs> {
    let url = '/coredefine/corenodemanage.ajax';
    return this.httpPost(url, 'action=datax_action&emethod=generate_datax_cfgs&dataxName='
      + this.dto.dataxPipeName + "&getExist=" + (getExist)).then((r) => {
      if (r.success) {
        let cfgs: GenerateCfgs = r.bizresult;
        this.genCfgFileList = cfgs.dataxFiles;
        this.lastestGenFileTime = cfgs.genTime;
        return r.bizresult;
      }
    });
  }

  ngAfterViewInit(): void {
  }


  /**
   * 更新DataX配置
   */
  updateStepNext() {
    this.jsonPost("/coredefine/corenodemanage.ajax?action=datax_action&emethod=update_datax&dataxName=" + this.dto.dataxPipeName
      , this.dto.profile)
      .then((r) => {
        this.processResult(r);
        if (r.success) {
          // console.log(dto);
          // this.nextStep.emit(this.dto);
          this.r.navigate(["../config"], {relativeTo: this.route});
        }
      });
  }

  // 执行下一步
  public createStepNext(): void {
    this.jsonPost("/coredefine/corenodemanage.ajax?action=datax_action&emethod=create_datax&dataxName=" + this.dto.dataxPipeName
      , this.dto.profile)
      .then((r) => {
        this.processResult(r);
        if (r.success) {
          // console.log(dto);
          // this.nextStep.emit(this.dto);
          this.successNotify(`DataX 实例:'${this.dto.dataxPipeName}'已创建成功`, 2000)
            .onClose.subscribe(() => {
            this.r.navigate(["/x", this.dto.dataxPipeName], {relativeTo: this.route});
          })
        } else {
          this.errorItem = Item.processFieldsErr(r);
        }
      });
  }

  viewGenFile(fileName: string) {

    this.httpPost("/coredefine/corenodemanage.ajax"
      , "action=datax_action&emethod=get_gen_cfg_file&dataxName=" + this.dto.dataxPipeName + "&fileName=" + fileName)
      .then((r) => {
        this.processResult(r);
        if (r.success) {
          const drawerRef = this.drawerService.create<ViewGenerateCfgComponent, {}, {}>({
            nzHeight: "80%",
            nzPlacement: "bottom",
            nzTitle: `DataX Config File '${fileName}' `,
            nzContent: ViewGenerateCfgComponent,
            nzWrapClassName: 'get-gen-cfg-file',
            nzContentParams: {fileMeta: r.bizresult}
          });
        }
      });
  }

  reGenerate() {
    this.generate_datax_cfgs(false).then((r: GenerateCfgs) => {
      // title: string, content: string, options?: NzNotificationDataOptions
      this.tisService.notification.success("成功", `最新生成${r.dataxFiles.length}个DataX配置文件`);
    });
  }

  startUpdate() {
    this.inUpdate = true;
  }

  afterPluginSave(e: PluginSaveResponse) {
    if (e.saveSuccess) {
      this.inUpdate = false;
    }
  }

  startEditReader() {
    this.startDataXEdit("reader");
  }

  private startDataXEdit(execType: "reader" | "writer") {
    let execId = WorkflowAddComponent.getUUID();
    if (!execId) {
      throw new Error("in valid execId");
    }
    this.httpPost("/coredefine/corenodemanage.ajax"
      , "action=datax_action&emethod=create_update_process&execId=" + execId)
      .then((r) => {
        if (r.success) {
          this.r.navigate(['../update'], {relativeTo: this.route, fragment: execType, queryParams: {"execId": r.bizresult}});
        }
      });
  }

  startEditWriter() {

    this.startDataXEdit("writer");

    // this.httpPost("/coredefine/corenodemanage.ajax"
    //   , "action=datax_action&emethod=create_update_process&execId=" + WorkflowAddComponent.getUUID())
    //   .then((r) => {
    //     if (r.success) {
    //       this.r.navigate(['../update'], {relativeTo: this.route, fragment: "writer", queryParams: {"execId": r.bizresult}});
    //     }
    //   });
  }
}

class GenerateCfgs {
  dataxFiles: Array<string>;
  genTime: number;
}

@Component({
  template: `
      <tis-codemirror [config]="{mode:'application/ld+json',lineNumbers: true}" [size]="{width:'100%',height:800}" [ngModel]="fileMeta.content"></tis-codemirror>
  `
  , styles: [`
  `]
})
export class ViewGenerateCfgComponent {

  @Input()
  fileMeta: { content?: string } = {};

  constructor(private drawerRef: NzDrawerRef<{ hetero: HeteroList }>) {
  }

  close(): void {
    this.drawerRef.close();
  }
}


interface ITableAlias {
  from: string;
  to: string;
}
