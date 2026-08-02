import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { render } from '@/test/test-utils';
import type { JsonSchemaNode } from '@/types/api';

import { CurationSpecField } from '../CurationSpecField';

const applicationLinkSchema = {
  type: 'string',
  'x-display-name': '신청 링크',
} as JsonSchemaNode;

function ConditionalFieldTestForm({ label }: { label?: string }) {
  const form = useForm({
    defaultValues: {
      isRecruiting: false,
      applicationLink: '',
    },
  });

  return (
    <FormProvider {...form}>
      <CurationSpecField
        name="applicationLink"
        schema={applicationLinkSchema}
        required={false}
        label={label}
        disabledWhen={{ field: 'isRecruiting', equals: false }}
      />
      <button type="button" onClick={() => form.setValue('isRecruiting', true)}>
        모집 시작
      </button>
      <button type="button" onClick={() => form.setValue('isRecruiting', false)}>
        모집 종료
      </button>
    </FormProvider>
  );
}

describe('CurationSpecField', () => {
  it('조건 필드가 지정한 값과 같을 때만 비활성화한다', async () => {
    const user = userEvent.setup();
    render(<ConditionalFieldTestForm />);

    const applicationLink = screen.getByLabelText('신청 링크');
    expect(applicationLink).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '모집 시작' }));
    expect(applicationLink).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '모집 종료' }));
    expect(applicationLink).toBeDisabled();
  });

  it('커스텀 라벨이 있으면 스키마 라벨보다 우선해서 사용한다', () => {
    render(<ConditionalFieldTestForm label="참가 신청 링크" />);

    expect(screen.getByLabelText('참가 신청 링크')).toBeInTheDocument();
    expect(screen.queryByLabelText('신청 링크')).not.toBeInTheDocument();
  });
});
