/**
 * 큐레이션 상세 페이지 폼 관리 훅
 * - 폼 초기화 및 데이터 동기화
 * - 생성/수정 로직 처리
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';

import {
  useCurationDetail,
  useCurationCreate,
  useCurationDelete,
  useCurationUpdate,
} from '@/hooks/useCurations';

import { curationFormSchema, DEFAULT_CURATION_FORM } from './curation.schema';
import type { CurationFormValues } from './curation.schema';
import type { CurationCreateRequest, CurationUpdateRequest, CurationDetail } from '@/types/api';

/**
 * useCurationDetailForm 훅의 반환 타입
 */
export interface UseCurationDetailFormReturn {
  form: ReturnType<typeof useForm<CurationFormValues>>;
  isLoading: boolean;
  isNewMode: boolean;
  isPending: boolean;
  curationData: CurationDetail | undefined;
  onSubmit: (data: CurationFormValues) => void;
  handleBack: () => void;
  handleDelete: () => void;
}

/**
 * 큐레이션 상세 페이지 폼 관리 훅
 * @param id - URL 파라미터의 ID (new이면 신규 등록)
 */
export function useCurationDetailForm(id: string | undefined): UseCurationDetailFormReturn {
  const navigate = useNavigate();

  const isNewMode = id === 'new' || id === undefined;
  const curationId = !isNewMode && id ? parseInt(id, 10) : undefined;

  // API로 데이터 조회
  const { data: curationData, isLoading } = useCurationDetail(curationId);

  // React Hook Form 설정
  const form = useForm<CurationFormValues>({
    resolver: zodResolver(curationFormSchema),
    defaultValues: DEFAULT_CURATION_FORM,
  });

  // 생성 mutation
  const createMutation = useCurationCreate({
    onSuccess: (data) => {
      // 폼 초기화
      form.reset(DEFAULT_CURATION_FORM);
      // 생성된 큐레이션 상세 페이지로 이동
      navigate(`/curations/${data.targetId}`);
    },
  });

  // 삭제 mutation
  const deleteMutation = useCurationDelete({
    onSuccess: () => {
      navigate('/curations');
    },
  });

  // 수정 mutation
  const updateMutation = useCurationUpdate();

  // API 데이터를 폼에 반영
  useEffect(() => {
    if (isNewMode) {
      form.reset(DEFAULT_CURATION_FORM);
    } else if (curationData) {
      form.reset({
        name: curationData.name,
        description: curationData.description ?? '',
        coverImageUrl: curationData.coverImageUrl ?? '',
        displayOrder: curationData.displayOrder,
        isActive: curationData.isActive,
        alcoholIds: curationData.alcohols.map((a) => a.alcoholId),
      });
    }
  }, [curationData, form, isNewMode]);

  const onSubmit = (data: CurationFormValues) => {
    if (isNewMode) {
      const createData: CurationCreateRequest = {
        name: data.name,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        displayOrder: data.displayOrder,
        alcoholIds: data.alcoholIds,
      };
      createMutation.mutate(createData);
    } else if (curationId) {
      const updateData: CurationUpdateRequest = {
        name: data.name,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        displayOrder: data.displayOrder,
        alcoholIds: data.alcoholIds,
      };
      updateMutation.mutate({ curationId, data: updateData });
    }
  };

  const handleBack = () => navigate('/curations');

  const handleDelete = () => {
    if (curationId) {
      deleteMutation.mutate(curationId);
    }
  };

  return {
    form,
    isLoading,
    isNewMode,
    isPending: createMutation.isPending || deleteMutation.isPending || updateMutation.isPending,
    curationData,
    onSubmit,
    handleBack,
    handleDelete,
  };
}
