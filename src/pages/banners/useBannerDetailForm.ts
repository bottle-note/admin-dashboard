/**
 * 배너 상세 페이지 폼 관리 훅
 * - 폼 초기화 및 데이터 동기화
 * - 생성/수정 로직 처리
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';

import {
  useBannerDetail,
  useBannerCreate,
  useBannerDelete,
  useBannerUpdate,
} from '@/hooks/useBanners';

import {
  bannerFormSchema,
  DEFAULT_BANNER_FORM,
  isAlwaysVisibleDate,
} from './banner.schema';
import type { BannerFormValues } from './banner.schema';
import type { BannerDetail } from '@/types/api';

/**
 * 큐레이션 URL에서 curationId 추출
 * @param url - /alcohols/search?curationId=123 형태의 URL
 * @returns curationId 또는 null
 */
function parseCurationIdFromUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = url.match(/curationId=(\d+)/);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

/**
 * useBannerDetailForm 훅의 반환 타입
 */
export interface UseBannerDetailFormReturn {
  form: ReturnType<typeof useForm<BannerFormValues>>;
  isLoading: boolean;
  isNewMode: boolean;
  isPending: boolean;
  bannerData: BannerDetail | undefined;
  onSubmit: (data: BannerFormValues, options?: { imagePreviewUrl: string | null }) => void;
  handleBack: () => void;
  handleDelete: () => void;
}

/**
 * 배너 상세 페이지 폼 관리 훅
 * @param id - URL 파라미터의 ID (new이면 신규 등록)
 */
export function useBannerDetailForm(id: string | undefined): UseBannerDetailFormReturn {
  const navigate = useNavigate();

  const isNewMode = id === 'new' || id === undefined;
  const bannerId = !isNewMode && id ? parseInt(id, 10) : undefined;

  // API로 데이터 조회
  const { data: bannerData, isLoading } = useBannerDetail(bannerId);

  // React Hook Form 설정
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: DEFAULT_BANNER_FORM,
  });

  // 생성 mutation
  const createMutation = useBannerCreate({
    onSuccess: (data) => {
      // 폼 초기화
      form.reset(DEFAULT_BANNER_FORM);
      // 생성된 배너 상세 페이지로 이동
      navigate(`/banners/${data.targetId}`);
    },
  });

  // 삭제 mutation
  const deleteMutation = useBannerDelete({
    onSuccess: () => {
      navigate('/banners');
    },
  });

  // 수정 mutation
  const updateMutation = useBannerUpdate();

  // API 데이터를 폼에 반영
  useEffect(() => {
    if (bannerData) {
      const isAlwaysVisible = isAlwaysVisibleDate(bannerData.endDate);

      // CURATION 타입인 경우 URL에서 curationId 추출
      const curationId =
        bannerData.bannerType === 'CURATION'
          ? parseCurationIdFromUrl(bannerData.targetUrl)
          : null;

      form.reset({
        name: bannerData.name ?? '',
        bannerType: bannerData.bannerType,
        isActive: bannerData.isActive,
        imageUrl: bannerData.imageUrl ?? '',
        descriptionA: bannerData.descriptionA ?? '',
        descriptionB: bannerData.descriptionB ?? '',
        textPosition: bannerData.textPosition,
        nameFontColor: (bannerData.nameFontColor ?? '#ffffff').replace(/^#/, ''),
        descriptionFontColor: (bannerData.descriptionFontColor ?? '#ffffff').replace(/^#/, ''),
        targetUrl: bannerData.targetUrl ?? '',
        isExternalUrl: bannerData.isExternalUrl,
        isAlwaysVisible,
        startDate: bannerData.startDate ?? '',
        endDate: bannerData.endDate ?? '',
        curationId,
      });
    }
  }, [bannerData, form]);

  const onSubmit = (
    data: BannerFormValues,
    options?: { imagePreviewUrl: string | null }
  ) => {
    const commonFields = {
      name: data.name,
      bannerType: data.bannerType,
      isActive: data.isActive,
      imageUrl: data.imageUrl || options?.imagePreviewUrl || '',
      descriptionA: data.descriptionA ?? '',
      descriptionB: data.descriptionB ?? '',
      textPosition: data.textPosition,
      nameFontColor: `#${data.nameFontColor}`,
      descriptionFontColor: `#${data.descriptionFontColor}`,
      targetUrl: data.targetUrl ?? '',
      isExternalUrl: data.isExternalUrl,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    if (isNewMode) {
      createMutation.mutate(commonFields);
    } else if (bannerId) {
      updateMutation.mutate({
        id: bannerId,
        data: {
          ...commonFields,
          sortOrder: bannerData?.sortOrder ?? 0,
        },
      });
    }
  };

  const handleBack = () => navigate('/banners');

  const handleDelete = () => {
    if (bannerId) {
      deleteMutation.mutate(bannerId);
    }
  };

  return {
    form,
    isLoading,
    isNewMode,
    isPending: createMutation.isPending || deleteMutation.isPending || updateMutation.isPending,
    bannerData,
    onSubmit,
    handleBack,
    handleDelete,
  };
}
