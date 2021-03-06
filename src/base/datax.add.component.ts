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

import {AfterContentInit, AfterViewChecked, AfterViewInit, Component, ComponentFactoryResolver, Input, OnInit, TemplateRef, Type, ViewChild, ViewContainerRef} from "@angular/core";
import {TISService} from "../service/tis.service";
import {AppFormComponent, BasicFormComponent, CurrentCollection} from "../common/basic.form.component";

import {ActivatedRoute, Router} from "@angular/router";
import {MultiViewDAG} from "../common/MultiViewDAG";
import {NzModalService, NzSafeAny} from "ng-zorro-antd";
import {DataxAddStep1Component} from "./datax.add.step1.component";
import {DataxAddStep2Component} from "./datax.add.step2.component";
import {DataxAddStep3Component} from "./datax.add.step3.component";
import {DataxAddStep4Component} from "./datax.add.step4.component";
import {DataxAddStep5Component} from "./datax.add.step5.component";
import {DataxAddStep6Component} from "./datax.add.step6.maptable.component";
import {DataxAddStep7Component} from "./datax.add.step7.confirm.component";
import {DataxAddStep6ColsMetaSetterComponent} from "./datax.add.step6.cols-meta-setter.component";
import {DataxConfigComponent} from "../datax/datax.config.component";
import {StepType} from "../common/steps.component";
import {Descriptor} from "../common/tis.plugin";
import {AddAppDefSchemaComponent} from "./addapp-define-schema.component";



@Component({
  template: `
      <nz-spin nzSize="large" [nzSpinning]="formDisabled" style="min-height: 300px">
          <ng-template #container></ng-template>
      </nz-spin>
      <ng-template #proessErr>当前是更新流程不能进入该页面
      </ng-template>
      {{ multiViewDAG.lastCpt?.name}}
  `
})
export class DataxAddComponent extends AppFormComponent implements AfterViewInit, OnInit {
  @ViewChild('container', {read: ViewContainerRef, static: true}) containerRef: ViewContainerRef;

  @ViewChild('proessErr', {read: TemplateRef, static: true}) proessErrRef: TemplateRef<NzSafeAny>;

  multiViewDAG: MultiViewDAG;

  // protected r: Router, protected route: ActivatedRoute
  constructor(tisService: TISService, protected r: Router, route: ActivatedRoute, modalService: NzModalService
    , private _componentFactoryResolver: ComponentFactoryResolver) {
    super(tisService, route, modalService);
  }

  goToDataXCfgManager(app: CurrentCollection): void {
    this.r.navigate(['/x', app.name, 'config'], {relativeTo: this.route});
  }

  protected initialize(app: CurrentCollection): void {
    // console.log("ddd");
    let paramsMap = this.route.snapshot.queryParamMap;
    let execId = paramsMap.get("execId");
    this.route.fragment.subscribe((r) => {
      let cpt: Type<any> = DataxAddStep1Component;
      switch (r) {
        case "reader":
          cpt = DataxAddStep3Component;
          if (!execId) {
            throw new Error("param execId can not be null");
          }
          DataxConfigComponent.getDataXMeta(this, app, execId).then((dto) => {
            dto.processModel = StepType.UpdateDataxReader;
            this.multiViewDAG.loadComponent(cpt, dto);
          })
          return;
        case "writer":
          cpt = DataxAddStep5Component;
          if (!execId) {
            throw new Error("param execId");
          }
          DataxConfigComponent.getDataXMeta(this, app, execId).then((dto) => {
            dto.processModel = StepType.UpdateDataxWriter;
            this.multiViewDAG.loadComponent(cpt, dto);
          })
          return;
        default:
          if (app) {
            this.modalService.warning({
              nzTitle: "错误",
              nzContent: this.proessErrRef,
              nzOkText: "进入DataX配置编辑",
              nzOnOk: () => {
                this.goToDataXCfgManager(app);
              }
            });
            return;
          }
          this.multiViewDAG.loadComponent(cpt, new DataxDTO());
      }
    })
  }

  ngAfterViewInit() {
  }


  ngOnInit(): void {
    // 配置步骤前后跳转状态机
    let configFST: Map<any, { next: any, pre: any }> = new Map();
    configFST.set(DataxAddStep1Component, {next: DataxAddStep2Component, pre: null});
    configFST.set(DataxAddStep2Component, {next: DataxAddStep3Component, pre: DataxAddStep1Component});
    configFST.set(DataxAddStep3Component, {next: DataxAddStep4Component, pre: DataxAddStep2Component});
    configFST.set(DataxAddStep4Component, {next: DataxAddStep5Component, pre: DataxAddStep3Component});
    configFST.set(DataxAddStep5Component, {next: DataxAddStep6Component, pre: DataxAddStep4Component});
    configFST.set(DataxAddStep6Component, {next: DataxAddStep7Component, pre: DataxAddStep5Component});
    configFST.set(DataxAddStep7Component, {next: null, pre: DataxAddStep6Component});

    configFST.set(DataxAddStep6ColsMetaSetterComponent, {next: DataxAddStep7Component, pre: DataxAddStep5Component});
    // use for elasticsearch writer cols set
    configFST.set(AddAppDefSchemaComponent, {next: DataxAddStep7Component, pre: DataxAddStep5Component});


    this.multiViewDAG = new MultiViewDAG(configFST, this._componentFactoryResolver, this.containerRef);
    /**=====================================================
     * <<<<<<<<<for test
     =======================================================*/
    // DataxAddStep2Component.getDataXReaderWriterEnum(this).then((rwEnum: DataXReaderWriterEnum) => {
    //   let dto = new DataxDTO();
    //   dto.dataxPipeName = "tt";
    //   dto.processMeta = {readerRDBMS: true, explicitTable: true, writerRDBMS: true, writerSupportMultiTab: false};
    //   dto.readerDescriptor = rwEnum.readerDescs.find((r) => "OSS" === r.displayName);
    //   dto.writerDescriptor = rwEnum.writerDescs.find((r) => "Elasticsearch" === r.displayName);
    //   this.multiViewDAG.loadComponent(AddAppDefSchemaComponent, dto);
    // });
    /**=====================================================
     * for test end>>>>>>>>
     =======================================================*/
    super.ngOnInit();

  }
}


/**
 * 被选中的列
 */
export interface ISelectedCol {
  label: string;
  value: string;
  checked: boolean;
  pk: boolean;
}

export interface ISelectedTabMeta {

  tableName: string,
  selectableCols: Array<ISelectedCol> // r.bizresult
}

class DataxProfile {
  projectName: string;
  recept: string;
  dptId: string;
}

export class DataxDTO {
  dataxPipeName: string;
  profile: DataxProfile = new DataxProfile();
  selectableTabs: Map<string /* table */, ISelectedTabMeta> = new Map();
  readerDescriptor: Descriptor;
  writerDescriptor: Descriptor;

  processMeta: DataXCreateProcessMeta;
  // 流程是否处于更新模式
  processModel: StepType = StepType.CreateDatax;

  constructor(public execId?: string) {
  }

  get readerImpl(): string {
    if (!this.readerDescriptor) {
      return null;
    }
    return this.readerDescriptor.impl;
  }

  get writerImpl(): string {
    if (!this.writerDescriptor) {
      return null;
    }
    return this.writerDescriptor.impl;
  }
}

export interface DataXCreateProcessMeta {
  readerRDBMS: boolean;
  // DataX Reader 是否有明确的表名
  explicitTable: boolean;

  // writer 是否符合关系型数据库要求
  writerRDBMS: boolean;
  // reader 中是否可以选择多个表，例如像elastic这样的writer中对于column的设置比较复杂，需要在writer plugin页面中完成，所以就不能支持在reader中选择多个表了
  writerSupportMultiTab: boolean;
}

