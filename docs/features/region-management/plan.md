# Region Management Implementation Plan

## Summary

Add region management under the whisky/tasting tag admin section. The implementation includes region list/search/pagination, create/detail/edit/delete forms, and list-only drag-and-drop order changes using the current dev API contract.

## Inputs

- Spec: `docs/features/region-management/spec.md`
- Design: `docs/features/region-management/design.md`
- API source:
  - Dev API behavior from `https://admin-api.development.bottle-note.com`
  - GitHub PR: `https://github.com/bottle-note/bottle-note-api-server/pull/586`

## Data and API Mapping

- `GET /admin/api/v1/regions`
  - Query: `keyword`, `page`, `size`, `sortOrder`
  - Frontend: `RegionListPage`, `RegionSearchParams`, `regionService.list`, `useRegionList`
  - List fields: `id`, `korName`, `engName`, `continent`, `description`, `createdAt`, `modifiedAt`, `parentId`, `sortOrder`
- `GET /admin/api/v1/regions/{regionId}`
  - Frontend: `RegionDetailPage`, `regionService.detail`, `useRegionDetail`
  - Detail fields: `id`, `korName`, `engName`, `continent`, `description`, `sortOrder`, `parentId`, `parentKorName`, `hasChildren`, `alcoholCount`, `createAt`, `lastModifyAt`
- `POST /admin/api/v1/regions`
  - Request: `korName`, `engName`, optional `continent`, `description`, `parentId`, `sortOrder`
  - Frontend: create form. Use `sortOrder: 9999` by default because backend defaults missing values to `9999`.
- `PUT /admin/api/v1/regions/{regionId}`
  - Request same as create.
  - Frontend: edit form. Keep `sortOrder` from detail as hidden form data, but do not expose it as an editable field.
- `DELETE /admin/api/v1/regions/{regionId}`
  - Frontend: destructive dialog. Backend may reject `REGION_HAS_CHILDREN` or `REGION_HAS_ALCOHOLS`.
- `PATCH /admin/api/v1/regions/{regionId}/sort-order`
  - Request: `{ sortOrder: number }`
  - Backend is Banner-style single item move, not bulk reorder. It inserts one region at the new order and pushes conflicting rows.
  - Frontend drag mode records local staged moves and calls this API only when `순서 변경 완료` is clicked.
  - Multiple staged moves are replayed sequentially on save. After save, refetch the list for backend final order.

## Implementation Steps

1. Update `src/types/api/region.api.ts`.
   - Add endpoint constants for detail/create/update/delete/updateSortOrder.
   - Add request/response/helper types for detail, form, delete, and sort-order mutation.
   - Add missing list fields `parentId` and `sortOrder`; keep `continent` nullable.
2. Update `src/services/region.service.ts`.
   - Add `detail`, `create`, `update`, `delete`, `updateSortOrder`.
   - Keep list meta normalization.
3. Update `src/hooks/useRegions.ts`.
   - Add detail/create/update/delete/sort-order hooks.
   - Invalidate region list/detail caches after mutations.
   - Use Korean success toasts.
4. Add `src/pages/regions/region.schema.ts`.
   - Required: `korName`, `engName`.
   - Optional nullable: `continent`, `description`, `parentId`.
   - Hidden `sortOrder` number with default `9999`.
5. Add `src/pages/regions/RegionList.tsx`.
   - Mirror dense table/list patterns from distillery list.
   - Keep search/sort/page/size in URL params.
   - Add reorder mode actions: `순서 변경`, `취소`, `순서 변경 완료`.
   - Reorder mode uses local rows and staged move queue; drag does not call API.
   - Disable search/sort/page/pageSize while reorder mode has unsaved changes.
6. Add `src/pages/regions/RegionDetail.tsx`.
   - Use `DetailPageHeader`, `Card`, `FormField`, `SearchableSelect`, `DeleteConfirmDialog`.
   - Show sort order, child 여부, alcohol count, created/modified dates in readonly reference card.
   - Exclude current region from parent select.
7. Add route and menu integration.
   - Routes: `/regions`, `/regions/new`, `/regions/:id`.
   - Menu: `위스키/테이스팅 태그 > 지역 관리 > 지역 목록/지역 추가`.
8. Update MSW mock data and handlers.
   - Add region list/detail/form/delete/sort-order fixtures.
   - Include handlers in exported handler list.
9. Add focused tests.
   - `src/hooks/__tests__/useRegions.test.ts` for list/detail/create/update/delete/sort-order hooks.
   - Keep page tests out of first pass unless hook/API tests expose risk.

## Edge Cases

- `parentId` is a relationship field, not reorder scope.
- `id=0` region is rendered like any other row; backend decides whether operations are allowed.
- Detail response date fields are `createAt` and `lastModifyAt`; list fields are `createdAt` and `modifiedAt`.
- Parent select excludes the current region in edit mode.
- Search/sort/pagination changes are disabled while reorder mode has unsaved changes.
- If reorder save fails, restore local rows to the original order and refetch.
- Bulk reorder API is not available. Track a follow-up issue for `PATCH /admin/api/v1/regions/reorder` with `regionIds` if product wants atomic full-order saves.

## Region Representative Image Follow-up

10. Add image-only preprocessing UI without changing shared `ImageUpload` or Banner video behavior.
   - Add `PreparedImageField` and its `ImageCropDialog` child component.
   - Allow JPG/PNG/WebP selection, ratio selection (1:1, 4:3, 16:9), image drag/zoom cropping, WebP quality selection, and actual result metadata display.
   - Keep `PreparedImage.file` and its object URL local to the field. The shared component must not know an S3 root path or Region/RHF API types.
11. Compose the field in `RegionDetailPage`.
   - Keep existing `form.imageUrl` until a new image is successfully saved; use local `pendingImage` and `stagedImageUrl` states for a replacement.
   - On save only, upload `pendingImage.file` to `S3UploadPath.REGION`, reuse a staged URL after a Region mutation failure, and send the resulting URL in the Region request.
   - Image removal sends `imageUrl: null`; do not add a client-side S3 delete flow.
12. Surface region representative thumbnails in `RegionListPage` and add focused tests for image field state and deferred WebP upload behavior.

## Verification Checklist

- [ ] `pnpm test:run src/hooks/__tests__/useRegions.test.ts`
- [ ] `pnpm lint`
- [ ] Manual UI check: route/menu visibility, list search/pagination, create/edit/delete form, reorder local drag then save/cancel.

## Implementation Notes

- Do not edit `src/components/ui`.
- Do not add a barrel file for `src/pages/regions`.
- Do not call API directly from page components except through region hooks.
- Do not expose `sortOrder` as an editable input in detail/create forms.
- Keep all admin-facing copy in Korean.
