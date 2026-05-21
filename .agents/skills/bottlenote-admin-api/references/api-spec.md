# Bottlenote Admin API Specification

Source: https://bottle-note.github.io/bottle-note-api-server/bottle-note/admin-api/admin-api.html

## Common Response Wrapper

All responses follow this structure:
```json
{ "success": boolean, "code": string, "data": T, "errors": [], "meta": {} }
```

Paginated responses include `meta`:
```json
{ "page": number, "size": number, "totalElements": number, "totalPages": number, "hasNext": boolean }
```

Mutation responses (create/update/delete) return:
```json
{ "code": string, "message": string, "targetId": number, "responseAt": string }
```

All endpoints except login require `Authorization: Bearer <token>`.

---

## 1. Auth API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/admin/api/v1/auth/login` | `{ email, password }` | `{ accessToken, refreshToken }` |
| POST | `/admin/api/v1/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/admin/api/v1/auth/signup` | `{ email, password, name, roles[] }` | `{ adminId, email, name, roles[] }` |
| DELETE | `/admin/api/v1/auth/withdraw` | - | `{ message }` |

## 2. Alcohol API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/alcohols` | Query: `keyword`, `category`, `regionId`, `sortType`, `sortOrder`, `page`, `size`, `includeDeleted` | Paginated `AlcoholListItem[]` |
| GET | `/admin/api/v1/alcohols/{alcoholId}` | - | `AlcoholDetail` (includes `tastingTags[]`) |
| POST | `/admin/api/v1/alcohols` | See create request below | Mutation response |
| PUT | `/admin/api/v1/alcohols/{alcoholId}` | Same as create | Mutation response |
| DELETE | `/admin/api/v1/alcohols/{alcoholId}` | - | Mutation response |
| GET | `/admin/api/v1/alcohols/categories/reference` | - | `CategoryReference[]` |

### Alcohol Create/Update Request
```typescript
{
  korName: string;
  engName: string;
  abv: string;          // e.g. "40%"
  type: AlcoholType;     // WHISKY | RUM | VODKA | GIN | TEQUILA | BRANDY | BEER | WINE | ETC
  korCategory: string;
  engCategory: string;
  categoryGroup: AlcoholCategory; // SINGLE_MALT | BLEND | BLENDED_MALT | BOURBON | RYE | OTHER
  regionId: number;
  distilleryId: number;
  age: string;
  cask: string;
  imageUrl: string;
  description: string;
  volume: string;
  tastingTagIds: number[];  // IMPORTANT: tasting tag IDs to connect
}
```

### Alcohol Detail Response
```typescript
{
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
  type: string;
  korCategory: string;
  engCategory: string;
  categoryGroup: AlcoholCategory;
  abv: string | null;
  age: string | null;
  cask: string | null;
  volume: string | null;
  description: string | null;
  regionId: number | null;
  korRegion: string | null;
  engRegion: string | null;
  distilleryId: number | null;
  korDistillery: string | null;
  engDistillery: string | null;
  tastingTags: { id: number; korName: string; engName: string; }[];
  avgRating: number;
  totalRatingsCount: number;
  reviewCount: number;
  pickCount: number;
  createdAt: string;
  modifiedAt: string;
  deletedAt: string | null;
}
```

## 3. Tasting Tag API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/tasting-tags` | Query: `keyword`, `page`, `size`, `sortOrder` | Paginated `TastingTagListItem[]` |
| GET | `/admin/api/v1/tasting-tags/{tagId}` | - | `{ tag: TastingTag, alcohols: TastingTagAlcohol[] }` |
| POST | `/admin/api/v1/tasting-tags` | `{ korName, engName, icon?, description?, parentId? }` | Mutation response |
| PUT | `/admin/api/v1/tasting-tags/{tagId}` | Same as create | Mutation response |
| DELETE | `/admin/api/v1/tasting-tags/{tagId}` | - | Mutation response |
| POST | `/admin/api/v1/tasting-tags/{tagId}/alcohols` | `{ alcoholIds: number[] }` | Mutation response |
| DELETE | `/admin/api/v1/tasting-tags/{tagId}/alcohols` | `{ alcoholIds: number[] }` | Mutation response |

## 4. Help (Inquiry) API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/helps` | Query: `status`, `type`, `cursor`, `pageSize` | Cursor-paginated help list |
| GET | `/admin/api/v1/helps/{helpId}` | - | Help detail with images |
| POST | `/admin/api/v1/helps/{helpId}/answer` | `{ responseContent, status }` | `{ helpId, status, message }` |

## 5. File (S3) API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/s3/presign-url` | Query: `rootPath`, `uploadSize` | `{ bucketName, expiryTime, imageUploadInfo[] }` |

## 6. Region API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/regions` | Query: `keyword`, `page`, `size`, `sortOrder` | Paginated region array |

## 7. Distillery API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/distilleries` | Query: `keyword`, `page`, `size`, `sortOrder` | Paginated distillery array |

## 8. Curation API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/curations` | Query: `keyword`, `isActive`, `page`, `size` | Paginated curation array |
| GET | `/admin/api/v1/curations/{curationId}` | - | Curation with alcohols |
| POST | `/admin/api/v1/curations` | `{ name, description, coverImageUrl, displayOrder, alcoholIds[] }` | Mutation response |
| PUT | `/admin/api/v1/curations/{curationId}` | `{ name, description, coverImageUrl, displayOrder, isActive, alcoholIds[] }` | Mutation response |
| DELETE | `/admin/api/v1/curations/{curationId}` | - | Mutation response |
| PATCH | `/admin/api/v1/curations/{curationId}/status` | `{ isActive }` | Mutation response |
| PATCH | `/admin/api/v1/curations/{curationId}/display-order` | `{ displayOrder }` | Mutation response |
| POST | `/admin/api/v1/curations/{curationId}/alcohols` | `{ alcoholIds[] }` | Mutation response |
| DELETE | `/admin/api/v1/curations/{curationId}/alcohols/{alcoholId}` | - | Mutation response |

## 9. Banner API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/admin/api/v1/banners` | Query: `keyword`, `isActive`, `bannerType`, `page`, `size` | Paginated banner array |
| GET | `/admin/api/v1/banners/{bannerId}` | - | Banner detail |
| POST | `/admin/api/v1/banners` | See banner create request below | Mutation response |
| PUT | `/admin/api/v1/banners/{bannerId}` | Same as create + `isActive` | Mutation response |
| DELETE | `/admin/api/v1/banners/{bannerId}` | - | Mutation response |
| PATCH | `/admin/api/v1/banners/{bannerId}/status` | `{ isActive }` | Mutation response |
| PATCH | `/admin/api/v1/banners/{bannerId}/sort-order` | `{ sortOrder }` | Mutation response |

### Banner Create Request
```typescript
{
  name: string;
  nameFontColor: string;
  descriptionA: string;
  descriptionB: string;
  descriptionFontColor: string;
  imageUrl: string;
  textPosition: string;
  isExternalUrl: boolean;
  targetUrl: string;
  bannerType: string;
  sortOrder: number;
  startDate: string;
  endDate: string;
}
```
