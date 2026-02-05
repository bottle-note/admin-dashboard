/**
 * 위스키 상세 페이지 폼 관리 훅
 * - 폼 초기화 및 데이터 동기화
 * - 생성/수정 로직 처리
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';

import {
  useAdminAlcoholDetail,
  useAdminAlcoholCreate,
  useAdminAlcoholDelete,
  useAdminAlcoholUpdate,
  useCategoryReferences,
} from '@/hooks/useAdminAlcohols';
import { useRegionList } from '@/hooks/useRegions';
import { useDistilleryList } from '@/hooks/useDistilleries';

import { whiskyFormSchema } from './whisky.schema';
import type { WhiskyFormValues } from './whisky.schema';
import type { AlcoholCreateRequest, AlcoholUpdateRequest, AlcoholTastingTag, CategoryReference } from '@/types/api';

/** 신규 등록용 폼 기본값 */
const DEFAULT_WHISKY_FORM: WhiskyFormValues = {
  korName: '',
  engName: '',
  korCategory: '',
  engCategory: '',
  categoryGroup: 'SINGLE_MALT',
  regionId: 0,
  distilleryId: 0,
  abv: 40,
  age: '',
  cask: '',
  volume: '',
  description: '',
  imageUrl: '',
};

/**
 * useWhiskyDetailForm 훅의 반환 타입
 */
export interface UseWhiskyDetailFormReturn {
  form: ReturnType<typeof useForm<WhiskyFormValues>>;
  isLoading: boolean;
  isNewMode: boolean;
  isPending: boolean;
  whiskyData: ReturnType<typeof useAdminAlcoholDetail>['data'];
  categories: CategoryReference[];
  regions: Array<{ id: number; korName: string }>;
  distilleries: Array<{ id: number; korName: string }>;
  onSubmit: (
    data: WhiskyFormValues,
    options: { tastingTags: AlcoholTastingTag[]; relatedKeywords: string[]; imagePreviewUrl: string | null }
  ) => void;
  handleBack: () => void;
  handleDelete: () => void;
}

/**
 * 위스키 상세 페이지 폼 관리 훅
 * @param id - URL 파라미터의 ID (new이면 신규 등록)
 */
export function useWhiskyDetailForm(id: string | undefined): UseWhiskyDetailFormReturn {
  const navigate = useNavigate();

  const isNewMode = id === 'new' || id === undefined;
  const alcoholId = !isNewMode && id ? parseInt(id, 10) : undefined;

  // API로 데이터 조회
  const { data: whiskyData, isLoading: isWhiskyLoading } = useAdminAlcoholDetail(alcoholId);
  const { data: categoryData, isLoading: isCategoryLoading } = useCategoryReferences();
  const { data: regionData, isLoading: isRegionLoading } = useRegionList({ size: 100 });
  const { data: distilleryData, isLoading: isDistilleryLoading } = useDistilleryList({ size: 100 });

  const isLoading = isWhiskyLoading || isCategoryLoading || isRegionLoading || isDistilleryLoading;

  // React Hook Form 설정
  const form = useForm<WhiskyFormValues>({
    resolver: zodResolver(whiskyFormSchema),
    defaultValues: DEFAULT_WHISKY_FORM,
  });

  // 생성 mutation
  const createMutation = useAdminAlcoholCreate({
    onSuccess: (data) => {
      // 폼 초기화
      form.reset(DEFAULT_WHISKY_FORM);
      // 생성된 위스키 상세 페이지로 이동
      navigate(`/whisky/${data.targetId}`);
    },
  });

  // 삭제 mutation
  const deleteMutation = useAdminAlcoholDelete({
    onSuccess: () => {
      navigate('/whisky');
    },
  });

  // 수정 mutation
  const updateMutation = useAdminAlcoholUpdate();

  // API 데이터를 폼에 반영 (신규 모드에서는 초기화)
  useEffect(() => {
    if (isNewMode) {
      // 신규 등록 모드: 폼을 기본값으로 초기화
      form.reset(DEFAULT_WHISKY_FORM);
    } else if (whiskyData) {
      // 수정 모드: API 데이터로 폼 채움
      form.reset({
        korName: whiskyData.korName,
        engName: whiskyData.engName,
        korCategory: whiskyData.korCategory ?? '',
        engCategory: whiskyData.engCategory ?? '',
        categoryGroup: whiskyData.categoryGroup ?? 'SINGLE_MALT',
        regionId: whiskyData.regionId ?? 0,
        distilleryId: whiskyData.distilleryId ?? 0,
        abv: whiskyData.abv ? parseFloat(whiskyData.abv.replace('%', '')) : 0,
        age: whiskyData.age ?? '',
        cask: whiskyData.cask ?? '',
        volume: whiskyData.volume ?? '',
        description: whiskyData.description ?? '',
        imageUrl: whiskyData.imageUrl ?? '',
      });
    }
  }, [whiskyData, form, isNewMode]);

  const onSubmit = (
    data: WhiskyFormValues,
    { relatedKeywords, imagePreviewUrl }: { tastingTags: AlcoholTastingTag[]; relatedKeywords: string[]; imagePreviewUrl: string | null }
  ) => {
    // TODO: API에 relatedKeywords 필드 추가 시 요청 데이터에 포함
    console.log('Related Keywords:', relatedKeywords);
    if (isNewMode) {
      const createData: AlcoholCreateRequest = {
        korName: data.korName,
        engName: data.engName,
        abv: `${data.abv}%`,
        type: 'WHISKY',
        korCategory: data.korCategory,
        engCategory: data.engCategory,
        categoryGroup: data.categoryGroup,
        regionId: data.regionId,
        distilleryId: data.distilleryId,
        age: data.age ?? '',
        cask: data.cask ?? '',
        imageUrl: data.imageUrl ?? imagePreviewUrl ?? '',
        description: data.description ?? '',
        volume: data.volume ?? '',
      };
      createMutation.mutate(createData);
    } else if (alcoholId) {
      const updateData: AlcoholUpdateRequest = {
        korName: data.korName,
        engName: data.engName,
        abv: `${data.abv}%`,
        type: 'WHISKY',
        korCategory: data.korCategory,
        engCategory: data.engCategory,
        categoryGroup: data.categoryGroup,
        regionId: data.regionId,
        distilleryId: data.distilleryId,
        age: data.age ?? '',
        cask: data.cask ?? '',
        imageUrl: data.imageUrl ?? imagePreviewUrl ?? '',
        description: data.description ?? '',
        volume: data.volume ?? '',
      };
      updateMutation.mutate({ alcoholId, data: updateData });
    }
  };

  const handleBack = () => navigate('/whisky');

  const handleDelete = () => {
    if (alcoholId) {
      deleteMutation.mutate(alcoholId);
    }
  };

  return {
    form,
    isLoading,
    isNewMode,
    isPending: createMutation.isPending || deleteMutation.isPending || updateMutation.isPending,
    whiskyData,
    categories: categoryData ?? [],
    regions: regionData?.items ?? [],
    distilleries: distilleryData?.items ?? [],
    onSubmit,
    handleBack,
    handleDelete,
  };
}
