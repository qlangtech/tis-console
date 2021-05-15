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

import {AfterContentInit, AfterViewInit, Component, Input, OnInit} from "@angular/core";
import {BasicFormComponent} from "./basic.form.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TISService} from "../service/tis.service";
import {ActivatedRoute} from "@angular/router";
import {NzModalService} from "ng-zorro-antd";
import {Item, ItemPropVal} from "./tis.plugin";


@Component({
  selector: `k8s-replics-spec`,
  template: `
      <tis-form [fieldsErr]="this.errorItem" [labelSpan]="this.labelSpan" [controlerSpan]="this.controlSpan" [formGroup]="specForm">
          <tis-ipt #pods title="Pods" name="pods-mock" require>
              <nz-input-group nzCompact [nzAddOnAfter]="podUnit" style="width:200px">
                  <nz-input-number [nzDisabled]="disabled" name="pods" formControlName="pods" class="input-number"  [nzStep]="1" [ngModel]="1"></nz-input-number>
              </nz-input-group>
          </tis-ipt>
          <tis-ipt title="CPU" name="cpu" require>
              <div class="resource-spec">
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('cuprequest')}">
                      <nz-input-group nzAddOnBefore="Request" nzCompact [nzAddOnAfter]="cpuRequestTpl">
                          <nz-input-number [nzDisabled]="disabled" name="cuprequest" class="input-number" formControlName="cuprequest" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <ng-template #cpuRequestTpl>
                          <nz-select [nzDisabled]="disabled" class="spec-unit" formControlName="cuprequestunit">
                              <nz-option [nzLabel]="'millicores'" [nzValue]="'m'"></nz-option>
                              <nz-option [nzLabel]="'cores'" [nzValue]="'cores'"></nz-option>
                          </nz-select>
                      </ng-template>
                      <div *ngIf="hasErr('cuprequest')" class="ant-form-item-explain">{{controlErr('cuprequest')}}</div>
                  </div>
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('cuplimit')}">
                      <nz-input-group nzAddOnBefore="Limit" nzCompact [nzAddOnAfter]="cpuLimitTpl">
                          <nz-input-number [nzDisabled]="disabled" formControlName="cuplimit" class="input-number" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <ng-template #cpuLimitTpl>
                          <nz-select [nzDisabled]="disabled" class="spec-unit" formControlName="cuplimitunit">
                              <nz-option [nzLabel]="'millicores'" [nzValue]="'m'"></nz-option>
                              <nz-option [nzLabel]="'cores'" [nzValue]="'cores'"></nz-option>
                          </nz-select>
                      </ng-template>
                      <div *ngIf="hasErr('cuplimit')" class="ant-form-item-explain">{{controlErr('cuplimit')}}</div>
                  </div>
              </div>
          </tis-ipt>
          <tis-ipt title="Memory" name="memory" require>
              <div class="resource-spec">
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('memoryrequest')}">
                      <nz-input-group nzAddOnBefore="Request" nzCompact [nzAddOnAfter]="memoryrequestTpl">
                          <nz-input-number [nzDisabled]="disabled" formControlName="memoryrequest" class="input-number" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <ng-template #memoryrequestTpl>
                          <nz-select [nzDisabled]="disabled" class="spec-unit" formControlName="memoryrequestunit">
                              <nz-option [nzLabel]="'MB'" [nzValue]="'M'"></nz-option>
                              <nz-option [nzLabel]="'GB'" [nzValue]="'G'"></nz-option>
                          </nz-select>
                      </ng-template>
                      <div *ngIf="hasErr('memoryrequest')" class="ant-form-item-explain">{{controlErr('memoryrequest')}}</div>
                  </div>
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('memorylimit')}">
                      <nz-input-group nzAddOnBefore="Limit" nzCompact [nzAddOnAfter]="memorylimitTpl">
                          <nz-input-number [nzDisabled]="disabled" formControlName="memorylimit" class="input-number" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <ng-template #memorylimitTpl>
                          <nz-select [nzDisabled]="disabled" class="spec-unit" formControlName="memorylimitunit">
                              <nz-option [nzLabel]="'MB'" [nzValue]="'M'"></nz-option>
                              <nz-option [nzLabel]="'GB'" [nzValue]="'G'"></nz-option>
                          </nz-select>
                      </ng-template>
                      <div *ngIf="hasErr('memorylimit')" class="ant-form-item-explain">{{controlErr('memorylimit')}}</div>
                  </div>
              </div>
          </tis-ipt>
          <tis-ipt title="弹性扩缩容" name="hpa" require>
              <div *ngIf="!disabled">
                  <nz-switch nzCheckedChildren="开" nzUnCheckedChildren="关" formControlName="supportHpa"></nz-switch>
              </div>
              <div *ngIf="specForm?.get('supportHpa').value" class="resource-spec">
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('cpuAverageUtilization')}">
                      <nz-input-group nzAddOnBefore="CPU平均利用率" [nzAddOnAfter]="'%'" nzCompact>
                          <nz-input-number [nzDisabled]="disabled" name="cpuAverageUtilization" class="input-number" formControlName="cpuAverageUtilization" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <div *ngIf="hasErr('cpuAverageUtilization')" class="ant-form-item-explain">{{controlErr('cpuAverageUtilization')}}</div>
                  </div>
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('minHpaPod')}">
                      <nz-input-group nzAddOnBefore="最小Pods" [nzAddOnAfter]="podUnit" nzCompact>
                          <nz-input-number [nzDisabled]="disabled" name="minHpaPod" class="input-number" formControlName="minHpaPod" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <div *ngIf="hasErr('minHpaPod')" class="ant-form-item-explain">{{controlErr('minHpaPod')}}</div>
                  </div>
                  <div [ngClass]="{'ant-form-item-has-error':hasErr('maxHpaPod')}">
                      <nz-input-group nzAddOnBefore="最大Pods" [nzAddOnAfter]="podUnit" nzCompact>
                          <nz-input-number [nzDisabled]="disabled" name="maxHpaPod" class="input-number" formControlName="maxHpaPod" [nzMin]="1" [nzStep]="1"></nz-input-number>
                      </nz-input-group>
                      <div *ngIf="hasErr('maxHpaPod')" class="ant-form-item-explain">{{controlErr('maxHpaPod')}}</div>
                  </div>
              </div>
          </tis-ipt>
      </tis-form>
      <ng-template #podUnit>个</ng-template>
  `
  , styles: [`
        .resource-spec {
            display: flex;
        }

        .resource-spec .spec-unit {
            width: 150px;
        }

        .resource-spec div {
            flex: 1;
            margin-right: 20px;
        }

        .input-number {
            width: 100%;
        }

        .spec-form {
        }
  `]
})
export class K8SReplicsSpecComponent extends BasicFormComponent implements AfterContentInit, AfterViewInit, OnInit {
  specForm: FormGroup;
  @Input()
  labelSpan = 2;
  @Input()
  controlSpan = 20;

  @Input()
  disabled = false;

  @Input()
  errorItem: Item;
  @Input()
  rcSpec: K8SRCSpec;

  constructor(tisService: TISService, modalService: NzModalService, private fb: FormBuilder) {
    super(tisService, modalService);
    this.specForm = this.fb.group({
      'supportHpa': [false, [Validators.required]],
      minHpaPod: [1],
      maxHpaPod: [1],
      cpuAverageUtilization: [10, [Validators.max(100), Validators.min(1)]],
      'pods': [1, [Validators.required]],
      cuprequest: [500, [Validators.required]],
      cuprequestunit: ['m', [Validators.required]],
      cuplimitunit: ['cores', [Validators.required]],
      cuplimit: [1, [Validators.required]],
      memoryrequest: [500, [Validators.required]],
      memoryrequestunit: ['M', [Validators.required]],
      memorylimit: [2, [Validators.required]],
      memorylimitunit: ['G', [Validators.required]]
    });
  }

  hasErr(control: string): boolean {
    if (!this.errorItem) {
      return false;
    }
    let itemPP: ItemPropVal = this.errorItem.vals[control];
    return itemPP && itemPP.hasFeedback;
  }

  controlErr(control: string): string {
    if (!this.errorItem) {
      return '';
    }
    let itemPP: ItemPropVal = this.errorItem.vals[control];
    if (!itemPP) {
      return '';
    }
    return itemPP.error;
  }

  ngAfterContentInit(): void {
    // this.specForm.get
  }

  public get k8sControllerSpec(): K8SRCSpec {
    return this.specForm.value;
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    console.log(this.rcSpec);
    if (!this.rcSpec) {
      this.rcSpec = {
        'pods': 3,
        supportHpa: true, minHpaPod: 1, maxHpaPod: 3, cpuAverageUtilization: 10,  cuprequest: 500,
        cuprequestunit: 'm',
        cuplimitunit: 'cores',
        cuplimit: 1,
        memoryrequest: 500,
        memoryrequestunit: 'M',
        memorylimit: 2,
        memorylimitunit: 'G'
      };
    }
    this.specForm.setValue(this.rcSpec);
    // this.specForm.setErrors({"cuprequest": "dddddddd"});
    // console.log(this.specForm.errors);
    // console.log(this.specForm.value);
  }
}


export interface K8SRCSpec {
  supportHpa: boolean,
  minHpaPod: number,
  maxHpaPod: number,
  cpuAverageUtilization: number,
  pods: number,
  cuprequest: number,
  cuprequestunit: string,
  cuplimitunit: string,
  cuplimit: number,
  memoryrequest: number,
  memoryrequestunit: string,
  memorylimit: number,
  memorylimitunit: string
}

