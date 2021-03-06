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

export interface CpuLimit {
  unit: string;
  unitEmpty: boolean;
  val: number;
}

export interface CpuRequest {
  unit: string;
  unitEmpty: boolean;
  val: number;
}


export interface MemoryLimit {
  unit: string;
  unitEmpty: boolean;
  val: number;
}

export interface MemoryRequest {
  unit: string;
  unitEmpty: boolean;
  val: number;
}

export interface Status {
  availableReplicas: number;
  fullyLabeledReplicas: number;
  observedGeneration: number;
  readyReplicas: number;
  replicas: number;
}

export interface RCDeployment {
  cpuLimit: CpuLimit;
  cpuRequest: CpuRequest;
  creationTimestamp: number;
  dockerImage: string;
  envs: Map<string, string>;
  pods: Array<K8sPodState>;
  memoryLimit: MemoryLimit;
  memoryRequest: MemoryRequest;
  replicaCount: number;
  status: Status;
}

export interface K8sPodState {
  name: string;
  phase?: string;
  startTime?: string;
  restartCount?: number;
}

export enum LogType {
  INCR_DEPLOY_STATUS_CHANGE = "incrdeploy-change",
  DATAX_WORKER_POD_LOG = "datax-worker-pod-log"
}

export interface RcHpaStatus {
  conditions: Array<HpaConditionEvent>;
  currentMetrics: Array<HpaMetrics>;
  autoscalerStatus: HpaAutoscalerStatus;
  autoscalerSpec: HpaAutoscalerSpec;
}

export interface HpaConditionEvent {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

export interface HpaAutoscalerStatus {
  currentCPUUtilizationPercentage: number;
  currentReplicas: number;
  desiredReplicas: number;
  lastScaleTime: number;
}

export interface HpaAutoscalerSpec {
  maxReplicas: number;
  minReplicas: number;
  targetCPUUtilizationPercentage: number;
}

export interface HpaMetrics {
  type: string;

  resource: UsingResource;
}

export interface UsingResource {
  name: string;
  currentAverageUtilization: any;
  currentAverageValue: any;
}
