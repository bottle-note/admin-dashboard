import { useRef } from 'react';
import { Pipette } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const PRESET_COLORS = [
  'ffffff', '000000', 'f5f5f5', '333333', 'a3a3a3', '737373',
  'ef4444', 'f97316', 'eab308', '22c55e', '3b82f6', '8b5cf6',
  'ec4899', '78716c', '0ea5e9', '14b8a6', 'f43f5e', 'd97706',
] as const;

interface ColorPickerInputProps {
  value: string;
  onChange: (hex: string) => void;
  error?: string;
  id?: string;
}

export function ColorPickerInput({ value, onChange, error, id }: ColorPickerInputProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.replace('#', ''));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    onChange(raw);
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-9 w-9 shrink-0 rounded-md border shadow-sm"
        style={{ backgroundColor: `#${value || 'ffffff'}` }}
      />
      <Input
        id={id}
        value={value}
        onChange={handleTextChange}
        placeholder="ffffff"
        maxLength={6}
        className={cn('font-mono uppercase', error && 'border-destructive')}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0" type="button" aria-label="색상 선택">
            <Pipette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'h-7 w-7 rounded-md border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  value === color && 'ring-2 ring-primary ring-offset-1',
                )}
                style={{ backgroundColor: `#${color}` }}
                onClick={() => onChange(color)}
                aria-label={`색상 #${color}`}
                title={`#${color}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              type="button"
              onClick={() => nativeInputRef.current?.click()}
            >
              커스텀 색상 선택
            </Button>
            <input
              ref={nativeInputRef}
              type="color"
              value={`#${value || 'ffffff'}`}
              onChange={handleNativeChange}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
