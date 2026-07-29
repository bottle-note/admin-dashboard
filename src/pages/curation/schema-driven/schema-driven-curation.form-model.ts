import type { CurationV2Spec } from '@/types/api';

import {
  createCurationFormModelFromRequestSpec,
  type CurationFieldModel,
  type CurationFormModel,
  type CurationFormSectionModel,
} from '../curation-form-model';

export interface SchemaDrivenCurationFormModel extends CurationFormModel {
  spec: CurationV2Spec;
  title: string;
  editTitle: string;
}

export function createSchemaDrivenCurationFormModel(
  spec: CurationV2Spec
): SchemaDrivenCurationFormModel {
  if (spec.requestSpec.type !== 'object' || spec.requestSpec['x-container'] === 'array') {
    throw new Error('지원하지 않는 큐레이션 스키마: object payload만 자동 생성할 수 있습니다.');
  }

  const formModel = createCurationFormModelFromRequestSpec(spec.requestSpec, {
    createSections: (fields) => createSchemaDrivenSections(spec, fields),
  });

  return {
    ...formModel,
    spec,
    title: `${spec.name} 작성`,
    editTitle: `${spec.name} 수정`,
  };
}

function createSchemaDrivenSections(
  spec: CurationV2Spec,
  fields: CurationFieldModel[]
): CurationFormSectionModel[] {
  const rootFields = fields.filter(
    (field) => field.kind !== 'object-array' && field.kind !== 'hidden'
  );
  const objectArrayFields = fields.filter((field) => field.kind === 'object-array');
  const sections: CurationFormSectionModel[] = [];

  if (rootFields.length > 0) {
    sections.push({
      id: 'payload',
      title: `${spec.name} 정보`,
      stepNumber: 2,
      description: `${spec.name} 정보를 입력해주세요.`,
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: rootFields.map((field) => ({
        field,
        className:
          field.kind === 'textarea' || field.kind === 'multi-select' || field.key.includes('Url')
            ? 'md:col-span-2'
            : undefined,
      })),
    });
  }

  objectArrayFields.forEach((field) => {
    sections.push({
      id: field.key,
      title: field.label,
      stepNumber: sections.length + 2,
      description: `${field.label} 정보를 입력해주세요.`,
      contentClassName: 'space-y-4',
      fields: [{ field }],
    });
  });

  return sections;
}
