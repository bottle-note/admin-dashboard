import type {
  AttributeAudit,
  AttributePageMeta,
  ScenarioCandidates,
} from './alcohol-attribute.api';

export type ScenarioSource = 'ATTRIBUTE' | 'CATEGORY' | 'TASTING_GROUP' | 'ABV';
export type ScenarioInputKind = 'SINGLE_CHOICE' | 'NUMBER_RANGE';
export type ScenarioRuleOperator = 'EQ' | 'GTE' | 'LTE' | 'ALWAYS';
export interface AlcoholScenario extends AttributeAudit {
  id: number;
  groupId: number;
  slot: number;
  title: string;
  enabled: boolean;
  activeVersionId: number | null;
  lockVersion: number;
}
export interface AlcoholScenarioVersion extends AttributeAudit {
  id: number;
  versionNo: number;
  status: 'DRAFT' | 'PUBLISHED';
  lockVersion: number;
  publishedAt: string | null;
}
export interface ScenarioChoice {
  id: string;
  label: string;
  value: string | number | boolean;
}
export interface ScenarioInputConfig {
  allowAny: boolean;
  choices?: ScenarioChoice[] | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  unit?: string | null;
}
export interface AlcoholScenarioQuestion {
  id: number;
  stageId: number;
  branchOrder: number;
  title: string;
  sourceKind: ScenarioSource;
  attributeId: number | null;
  inputKind: ScenarioInputKind;
  inputConfig: ScenarioInputConfig;
}
export interface AlcoholScenarioTransition {
  id: number;
  fromQuestionId: number;
  priority: number;
  predicate: { operator: ScenarioRuleOperator; value?: string | number | null };
  targetKind: 'QUESTION' | 'END';
  targetQuestionId: number | null;
}
export interface ScenarioDefinition {
  definitionSchemaVersion: 1;
  startQuestionId: number | null;
  stages: { id: number; position: number }[];
  questions: AlcoholScenarioQuestion[];
  transitions: AlcoholScenarioTransition[];
}
export interface ScenarioDetail {
  scenario: AlcoholScenario;
  versions: AlcoholScenarioVersion[];
}
export interface ScenarioVersionDetail {
  version: AlcoholScenarioVersion;
  definition: ScenarioDefinition;
}
export type ScenarioAnswer =
  | { questionId: number; kind: 'CHOICE'; choiceId: string }
  | { questionId: number; kind: 'NUMBER_RANGE'; min: number; max: number }
  | { questionId: number; kind: 'ANY' };
export interface ScenarioPreviewRequest {
  expectedLockVersion: number;
  answers: ScenarioAnswer[];
  changedQuestionId?: number;
  viewQuestionId?: number;
  page?: number;
  size?: number;
}
export interface ScenarioPreview {
  path: number[];
  nextQuestionId: number | null;
  completed: boolean;
  answers: ScenarioAnswer[];
  discardedQuestionIds: number[];
  contributions: {
    questionId: number;
    source: ScenarioSource;
    attributeId: number | null;
    operator: string;
    value: string;
  }[];
  viewedQuestionId: number | null;
  candidates: ScenarioCandidates;
}
export interface ScenarioPreviewPage {
  data: ScenarioPreview;
  meta: AttributePageMeta;
}
