/**
 * 장소 검색 입력 컴포넌트
 * - Kakao Maps JavaScript SDK Places 서비스로 장소명을 검색한다.
 * - 선택한 장소의 도로명 주소를 우선 입력하고, 없으면 지번 주소로 폴백한다.
 * - SDK 키가 없거나 로드 실패 시 입력 폼은 유지하고 검색 UI에서 안내한다.
 */
import { useState, type FormEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const KAKAO_MAPS_SDK_SCRIPT_ID = 'kakao-maps-sdk';
const KAKAO_MAPS_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAPS_SDK_LOAD_ERROR_MESSAGE =
  '카카오 지도 SDK를 불러오지 못했습니다. Kakao Developers Web 플랫폼에 현재 도메인이 등록되어 있는지 확인해주세요.';
const PLACE_SEARCH_PAGE_SIZE = 10;

type KakaoPlaceSearchStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
}

interface KakaoMapsNamespace {
  maps: {
    load: (callback: () => void) => void;
    services: {
      Places: new () => {
        keywordSearch: (
          keyword: string,
          callback: (
            data: KakaoPlaceDocument[],
            status: KakaoPlaceSearchStatus,
            pagination?: KakaoPlacePagination
          ) => void,
          options?: { size?: number; page?: number }
        ) => void;
      };
      Status: Record<KakaoPlaceSearchStatus, KakaoPlaceSearchStatus>;
    };
  };
}

interface KakaoPlacePagination {
  current: number;
  first: number;
  last: number;
  perPage: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

declare global {
  interface Window {
    kakao?: KakaoMapsNamespace;
  }
}

export interface SelectedPlace {
  id: string;
  placeName: string;
  address: string;
  roadAddress: string;
  lotAddress: string;
  longitude: string;
  latitude: string;
  placeUrl: string;
}

interface PlaceSearchPaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PlaceSearchInputProps {
  registration: UseFormRegisterReturn;
  onAddressSelect: (address: string) => void;
  onPlaceSelect?: (place: SelectedPlace) => void;
  placeholder?: string;
  maxLength?: number;
  'aria-label'?: string;
  disabled?: boolean;
}

let kakaoMapsSdkLoadPromise: Promise<KakaoMapsNamespace> | null = null;

export function PlaceSearchInput({
  registration,
  onAddressSelect,
  onPlaceSelect,
  placeholder,
  maxLength,
  'aria-label': ariaLabel,
  disabled,
}: PlaceSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [results, setResults] = useState<KakaoPlaceDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('장소명 또는 매장명을 입력해 검색하세요.');
  const [pagination, setPagination] = useState<PlaceSearchPaginationState | null>(null);

  const handleSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setResults([]);
      setSearchedKeyword('');
      setPagination(null);
      setMessage('검색할 장소명을 입력해주세요.');
      return;
    }

    searchPlaces(trimmedKeyword, 1);
  };

  const searchPlaces = (trimmedKeyword: string, page: number) => {
    setIsSearching(true);
    setMessage('');
    setSearchedKeyword(trimmedKeyword);

    loadKakaoMapsSdk()
      .then((kakao) => {
        const places = new kakao.maps.services.Places();
        places.keywordSearch(
          trimmedKeyword,
          (data, status, nextPagination) => {
            setIsSearching(false);

            if (status === kakao.maps.services.Status.OK) {
              setResults(data);
              setPagination(createPaginationState(nextPagination));
              setMessage(data.length > 0 ? '' : '검색 결과가 없습니다.');
              return;
            }

            setResults([]);
            setPagination(null);
            setMessage(
              status === kakao.maps.services.Status.ZERO_RESULT
                ? '검색 결과가 없습니다.'
                : '장소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.'
            );
          },
          { size: PLACE_SEARCH_PAGE_SIZE, page }
        );
      })
      .catch((error: Error) => {
        setIsSearching(false);
        setResults([]);
        setPagination(null);
        setMessage(error.message);
      });
  };

  const handlePageChange = (nextPage: number) => {
    if (!searchedKeyword || isSearching) return;

    searchPlaces(searchedKeyword, nextPage);
  };

  const handleSelectPlace = (place: KakaoPlaceDocument) => {
    const address = place.road_address_name || place.address_name;
    onAddressSelect(address);
    onPlaceSelect?.({
      id: place.id,
      placeName: place.place_name,
      address,
      roadAddress: place.road_address_name,
      lotAddress: place.address_name,
      longitude: place.x,
      latitude: place.y,
      placeUrl: place.place_url,
    });
    setOpen(false);
    setKeyword('');
    setSearchedKeyword('');
    setResults([]);
    setPagination(null);
    setMessage('장소명 또는 매장명을 입력해 검색하세요.');
  };

  return (
    <div className="flex gap-2">
      <Input
        aria-label={ariaLabel}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        {...registration}
        readOnly
        onClick={disabled ? undefined : () => setOpen(true)}
        className="cursor-pointer"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="shrink-0" disabled={disabled}>
            <Search className="mr-1.5 h-4 w-4" />
            장소 검색
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>장소 검색</DialogTitle>
            <DialogDescription>
              매장명이나 장소명을 검색한 뒤 시음회 장소를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input
              autoFocus
              aria-label="장소 검색어"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예: 도시남 바, 글렌피딕 팝업"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              검색
            </Button>
          </form>

          <div className="max-h-[22rem] overflow-y-auto rounded-md border">
            {results.length > 0 ? (
              <ul className="divide-y">
                {results.map((place) => {
                  const address = place.road_address_name || place.address_name;

                  return (
                    <li key={place.id}>
                      <button
                        type="button"
                        className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 space-y-1">
                          <span className="block truncate text-sm font-medium">
                            {place.place_name}
                          </span>
                          <span className="block text-xs text-muted-foreground">{address}</span>
                          {(place.category_name || place.phone) && (
                            <span className="block text-xs text-muted-foreground">
                              {[place.category_name, place.phone].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {isSearching ? '검색 중입니다.' : message}
              </div>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="장소 검색 페이지네이션"
              className="flex items-center justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground">
                총 {pagination.totalCount.toLocaleString()}개 · {pagination.currentPage} /{' '}
                {pagination.totalPages} 페이지
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious || isSearching}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || isSearching}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function createPaginationState(
  pagination?: KakaoPlacePagination
): PlaceSearchPaginationState | null {
  if (!pagination || pagination.totalCount <= 0) return null;

  return {
    currentPage: pagination.current,
    totalPages: pagination.last,
    totalCount: pagination.totalCount,
    hasNext: pagination.hasNextPage,
    hasPrevious: pagination.hasPrevPage,
  };
}

function loadKakaoMapsSdk(): Promise<KakaoMapsNamespace> {
  if (window.kakao?.maps.services) {
    return Promise.resolve(window.kakao);
  }

  const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY?.trim();
  if (!appKey) {
    return Promise.reject(
      new Error('VITE_KAKAO_MAP_JAVASCRIPT_KEY 환경변수를 설정해주세요.')
    );
  }

  if (kakaoMapsSdkLoadPromise) {
    return kakaoMapsSdkLoadPromise;
  }

  kakaoMapsSdkLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      KAKAO_MAPS_SDK_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!window.kakao?.maps.load) {
        reject(new Error(KAKAO_MAPS_SDK_LOAD_ERROR_MESSAGE));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao?.maps.services) {
          resolve(window.kakao);
        } else {
          reject(new Error('카카오 장소 검색 서비스를 불러오지 못했습니다.'));
        }
      });
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error(KAKAO_MAPS_SDK_LOAD_ERROR_MESSAGE)),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAPS_SDK_SCRIPT_ID;
    script.async = true;
    script.src = `${KAKAO_MAPS_SDK_URL}?appkey=${encodeURIComponent(
      appKey
    )}&libraries=services&autoload=false`;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error(KAKAO_MAPS_SDK_LOAD_ERROR_MESSAGE)),
      { once: true }
    );
    document.head.appendChild(script);
  });

  return kakaoMapsSdkLoadPromise;
}
