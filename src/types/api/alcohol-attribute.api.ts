import type { ApiMeta } from './common';

export type AttributeType = 'KEYWORD' | 'POPULARITY' | 'PRICE' | 'FLAG' | 'IDENTITY' | 'NOTE';
export type AttributeDatatype = 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN';
export type AttributeOperator = 'EQ' | 'GTE';
export interface AttributePrincipal {
  id: number | null;
  type: 'USER' | 'ADMIN' | 'AGENT' | 'SYSTEM' | 'ANONYMOUS';
  email: string | null;
}
export interface AttributeAudit {
  createAt: string;
  lastModifyAt: string;
  createPrincipal: AttributePrincipal | null;
  lastModifyPrincipal: AttributePrincipal | null;
}
export interface AlcoholAttribute extends AttributeAudit {
  // Absent while the previous API version is deployed.
  allowMultipleValues?: boolean;
  allowedValues: string[] | null;
  pattern: string | null;
  groupId: number | null;
  id: number;
  key: string;
  displayName: string;
  type: AttributeType;
  datatype: AttributeDatatype;
  unit: string | null;
  description: string | null;
}
export interface AttributeMapping extends AttributeAudit {
  id: number;
  alcoholId: number;
  attributeId: number;
  value: string;
}
export interface AttributedAlcohol {
  alcoholId: number;
  korName: string;
  engName: string | null;
  korCategory: string | null;
  imageUrl: string | null;
  attributes: { mappingId: number; value: string; attribute: AlcoholAttribute }[];
}
export interface AttributePageMeta extends ApiMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
export interface AttributePageParams {
  page?: number;
  size?: number;
}
export interface AttributeSearchParams extends AttributePageParams {
  groupIds?: number[];
  keyword?: string;
  type?: AttributeType;
  alcoholIds?: number[];
}
export interface AttributedAlcoholSearchParams extends AttributePageParams {
  groupIds?: number[];
  keyword?: string;
  type?: AttributeType;
  key?: string;
  value?: string;
  missingKey?: string;
  operator?: AttributeOperator;
}
export interface AttributeUpdateRequest {
  allowMultipleValues?: boolean;
  allowedValues?: string[] | null;
  pattern?: string | null;
  groupId?: number | null;
  displayName: string;
  type: AttributeType;
  datatype: AttributeDatatype;
  unit?: string | null;
  description?: string | null;
}
export interface AttributeCreateRequest extends AttributeUpdateRequest {
  key: string;
}
export interface AttributeMappingRequest {
  alcoholId: number;
  attributeId: number;
  value: string;
}
export interface AttributeMappingResult {
  added: number;
  skipped: number;
  createdIds: number[];
}
export interface AttributeResult {
  code: string;
  message: string;
  targetId: number;
  responseAt: string;
}
export interface AttributeSummary {
  attribute: AlcoholAttribute;
  alcoholIds: number[];
  mappingIds: number[];
  mappings: AttributeMapping[];
  registeredCount: number;
  selectedCount: number;
}

export type AttributeSearchOperator =
  | 'EQ'
  | 'NE'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'CONTAINS'
  | 'EXISTS'
  | 'NOT_EXISTS';
export interface AttributeSearchCondition {
  key: string;
  operator: AttributeSearchOperator;
  value?: string;
}
export interface AlcoholCompoundSearchParams extends AttributePageParams {
  groupIds?: number[];
  keyword?: string;
  match?: 'AND' | 'OR';
  conditions: AttributeSearchCondition[];
  type?: AttributeType;
  linkedOnly?: boolean;
}

export interface AttributeGroup extends AttributeAudit {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
}
export interface AttributeGroupRequest {
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface AttributeFacets {
  items: { attribute: AlcoholAttribute; value: string; alcoholCount: number }[];
  hasNext: boolean;
}

export interface ScenarioCandidateRequest {
  include?: { attributeId: number; operator: AttributeSearchOperator; value?: string }[];
  exclude?: { attributeId: number; operator: AttributeSearchOperator; value?: string }[];
  categoryGroups?: import('./alcohol.api').AlcoholCategory[];
  abvFrom?: number;
  abvTo?: number;
  tastingGroupCodes?: string[];
  nextQuestion?: {
    source: 'ATTRIBUTE' | 'CATEGORY' | 'ABV' | 'TASTING_GROUP';
    attributeId?: number;
    ranges?: { key: string; from?: number; to?: number }[];
  };
  page?: number;
  size?: number;
}
export interface ScenarioCandidate {
  alcoholId: number;
  korName: string;
  engName: string | null;
  imageUrl: string | null;
  type: import('./alcohol.api').AlcoholType;
  categoryGroup: import('./alcohol.api').AlcoholCategory;
  korCategory: string | null;
  engCategory: string | null;
  abvRaw: string | null;
  abv: number | null;
  age: string | null;
  cask: string | null;
  volume: string | null;
  region: { id: number; korName: string | null; engName: string | null } | null;
  distillery: { id: number; korName: string | null; engName: string | null } | null;
  tastingTags: {
    id: number;
    korName: string | null;
    engName: string | null;
    parentId: number | null;
  }[];
  tastingGroupCodes: string[];
  attributes: { attributeId: number; values: string[] }[];
}
export interface ScenarioCandidates {
  group: { id: number; name: string };
  attributeDefinitions: {
    attributeId: number;
    key: string;
    displayName: string;
    type: AttributeType;
    datatype: AttributeDatatype;
    unit: string | null;
    allowMultipleValues: boolean;
    allowedValues: string[] | null;
  }[];
  items: ScenarioCandidate[];
  totalCount: number;
  facets: {
    source: NonNullable<ScenarioCandidateRequest['nextQuestion']>['source'];
    attributeId: number | null;
    options: {
      value: string;
      label: string;
      from: number | null;
      to: number | null;
      count: number;
    }[];
    hasMoreOptions: boolean;
    missingCount: number;
    min: number | null;
    max: number | null;
  } | null;
}
