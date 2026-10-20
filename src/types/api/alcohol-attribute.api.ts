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
