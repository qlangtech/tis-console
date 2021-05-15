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

import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {TISService} from "../service/tis.service";
import {BasicFormComponent} from "../common/basic.form.component";
import {AppDesc, ConfirmDTO} from "./addapp-pojo";
import {NzModalService} from "ng-zorro-antd";
import {Descriptor, Item} from "../common/tis.plugin";
import {PluginsComponent} from "../common/plugins.component";
import {DataxDTO} from "./datax.add.component";
import {BasicDataXAddComponent} from "./datax.add.base";

// 文档：https://angular.io/docs/ts/latest/guide/forms.html
@Component({
  selector: 'addapp-form',
  // templateUrl: '/runtime/addapp.htm'
  template: `
      <tis-steps type="createDatax" [step]="1"></tis-steps>
<!--      <tis-page-header [showBreadcrumb]="false" [result]="result">-->
<!--          <tis-header-tool>-->
<!--              <button nz-button nzType="primary" (click)="execNextStep()">下一步</button>-->
<!--          </tis-header-tool>-->
<!--      </tis-page-header>-->
      <tis-steps-tools-bar (cancel)="cancel()" (goBack)="goback()" (goOn)="execNextStep()"></tis-steps-tools-bar>
      <tis-form class="" [fieldsErr]="errorItem">
          <tis-ipt #readerType title="Reader类型" name="readerType" require="true">
              <nz-select nzSize="large" nzPlaceHolder="请选择" name="reader" class="form-control" [(ngModel)]="dto.readerDescriptor">
                  <nz-option *ngFor="let pp of readerDesc" [nzValue]="pp" [nzLabel]="pp.displayName"></nz-option>
              </nz-select>
          </tis-ipt>
          <tis-ipt #writerType title="Writer类型" name="writerType" require="true">
              <nz-select nzSize="large" nzPlaceHolder="请选择" name="writer" class="form-control" [(ngModel)]="dto.writerDescriptor">
                  <nz-option *ngFor="let pp of writerDesc" [nzValue]="pp" [nzLabel]="pp.displayName"></nz-option>
              </nz-select>
          </tis-ipt>
      </tis-form>
      <!-- Content here -->
  `
  , styles: [
    `
    `
  ]
})
export class DataxAddStep2Component extends BasicDataXAddComponent implements OnInit {
  errorItem: Item = Item.create([]);
  // model = new Application(
  //   '', 'Lucene6.0', -1, new Crontab(), -1, ''
  // );
  model = new AppDesc();




  // 可选的数据源
  readerDesc: Array<Descriptor> = [];
  writerDesc: Array<Descriptor> = [];


  constructor(tisService: TISService, modalService: NzModalService) {
    super(tisService, modalService);
  }


  ngOnInit(): void {

    this.httpPost('/coredefine/corenodemanage.ajax'
      , 'action=datax_action&emethod=get_supported_reader_writer_types')
      .then((r) => {
        if (r.success) {
          let rList = PluginsComponent.wrapDescriptors(r.bizresult.readerDesc);
          let wList = PluginsComponent.wrapDescriptors(r.bizresult.writerDesc);
          this.readerDesc = Array.from(rList.values());
          this.writerDesc =  Array.from(wList.values());
        }
      });
  }

  // 执行下一步
  public execNextStep(): void {
   // let dto = new DataxDTO();
   // dto.appform = this.readerDesc;
    this.jsonPost('/coredefine/corenodemanage.ajax?action=datax_action&emethod=validate_reader_writer'
      , this.dto)
      .then((r) => {
        this.processResult(r);
        if (r.success) {
          this.dto.processMeta = r.bizresult;
          this.nextStep.emit(this.dto);
        } else {
          this.errorItem = Item.processFieldsErr(r);
        }
      });
  }




}
