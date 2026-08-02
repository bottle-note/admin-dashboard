import { CalendarDays, MapPin } from 'lucide-react';

import type { ProgramFormValues } from '../curation-spec.schema';

const PROGRAM_TYPE_LABELS = {
  MASTER_CLASS: '마스터 클래스',
  TASTING: '테이스팅',
  SEMINAR: '세미나',
  BOOTH_EVENT: '부스 이벤트',
  OTHER: '기타',
};

export function ProgramPreview({ values }: { values: ProgramFormValues }) {
  return (
    <article className="min-h-full bg-white pb-10 text-[#2d2a28]">
      <div className="relative h-56 overflow-hidden bg-[#f1eee9]">
        {values.imageUrls[0] ? (
          <img src={values.imageUrls[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#8b8782]">
            대표 이미지
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/70" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#2d2a28]">
            프로그램
          </span>
          <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold">{values.name}</h1>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="space-y-3 rounded-2xl bg-[#f7f5f2] p-4">
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-[13px] font-bold">
              {values.eventStartDate} ~ {values.eventEndDate}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[13px] font-bold">{values.placeName}</p>
              <p className="mt-1 text-[11px] text-[#8b8782]">
                {[values.address, values.detailLocation].filter(Boolean).join(' ')}
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-[#e8e4de] pt-3">
            <span className="text-[11px] font-semibold">참가비</span>
            <strong className="text-[18px]">
              {values.is_tbc
                ? '미정'
                : values.entryFee
                  ? `${values.entryFee.toLocaleString('ko-KR')}원`
                  : '무료'}
            </strong>
          </div>
        </div>

        <p className="whitespace-pre-line text-[13px] leading-6">{values.description}</p>

        <section>
          <h2 className="text-[17px] font-extrabold">프로그램</h2>
          <div className="mt-3 space-y-3">
            {values.programs.map((program, index) => (
              <div key={index} className="rounded-xl border border-[#ebe7e1] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-[#e06a5f]">
                    {PROGRAM_TYPE_LABELS[program.type]}
                  </span>
                  <span className="text-[10px] text-[#8b8782]">
                    {program.programDate} {program.startTime}
                    {program.endTime ? ` - ${program.endTime}` : ''}
                  </span>
                </div>
                <h3 className="mt-2 text-[14px] font-bold">{program.name}</h3>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-[12px] leading-5 text-[#5f5b57]">
                  {program.description}
                </p>
                {program.whiskies?.length ? (
                  <p className="mt-3 text-[11px] font-semibold text-[#8b8782]">
                    시음 위스키 {program.whiskies.length}개
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
