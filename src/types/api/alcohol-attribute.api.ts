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
  keyword?: string;
  type?: AttributeType;
  alcoholIds?: number[];
}
export interface AttributedAlcoholSearchParams extends AttributePageParams {
  keyword?: string;
  type?: AttributeType;
  key?: string;
  value?: string;
  missingKey?: string;
  operator?: AttributeOperator;
}
export interface AttributeUpdateRequest {
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
