import type { UseFormReturn } from 'react-hook-form';
import { ExternalLink, Link } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BannerFormValues } from '../banner.schema';
import { curationService } from '@/hooks/useCurations';
import type { CurationListItem } from '@/types/api';

interface BannerLinkSettingsCardProps {
  form: UseFormReturn<BannerFormValues>;
  curations: CurationListItem[];
}

export function BannerLinkSettingsCard({ form, curations }: BannerLinkSettingsCardProps) {
  const isExternalUrl = form.watch('isExternalUrl');
  const bannerType = form.watch('bannerType');
  const curationId = form.watch('curationId');
  const isCurationType = bannerType === 'CURATION';

  const handleCurationChange = (value: string) => {
    const id = parseInt(value, 10);
    form.setValue('curationId', id);
    form.setValue('targetUrl', curationService.generateCurationUrl(id));
    form.setValue('isExternalUrl', false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>링크 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCurationType && (
          <div className="space-y-2">
            <Label htmlFor="curationId">큐레이션 선택 *</Label>
            <Select
              value={curationId?.toString() ?? ''}
              onValueChange={handleCurationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="큐레이션을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {curations.map((curation) => (
                  <SelectItem key={curation.id} value={curation.id.toString()}>
                    {curation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.curationId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.curationId.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="targetUrl">
            이동 URL {isCurationType && <span className="text-muted-foreground">(자동 생성)</span>}
          </Label>
          <div className="relative">
            {isExternalUrl ? (
              <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              id="targetUrl"
              {...form.register('targetUrl')}
              placeholder={isExternalUrl ? 'https://example.com' : '/path/to/page'}
              className={`pl-9 ${isCurationType ? 'bg-muted' : ''}`}
              readOnly={isCurationType}
            />
          </div>
          {isCurationType && (
            <p className="text-xs text-muted-foreground">
              큐레이션 선택 시 URL이 자동으로 생성됩니다.
            </p>
          )}
        </div>

        {!isCurationType && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExternalUrl"
              checked={isExternalUrl}
              onCheckedChange={(checked) => form.setValue('isExternalUrl', !!checked)}
            />
            <Label htmlFor="isExternalUrl">외부 URL (새 탭에서 열기)</Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
