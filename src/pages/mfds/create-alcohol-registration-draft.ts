import type { MfdsDeclarationListItem } from '@/types/api';

const DATA_SHEET_NAME = '알코올 데이터';
const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DATA_START_ROW = 3;

function normalizeName(value: string | null) {
  return value?.trim() ?? '';
}

function getUniqueDeclarations(items: MfdsDeclarationListItem[]) {
  const uniqueItems = new Map<string, { korName: string; engName: string }>();

  items.forEach((item) => {
    const korName = normalizeName(item.baseProductNameKo);
    const engName = normalizeName(item.baseProductNameEn);
    if (!korName && !engName) return;

    const key = `${korName}\u0000${engName}`;
    if (!uniqueItems.has(key)) uniqueItems.set(key, { korName, engName });
  });

  return [...uniqueItems.values()];
}

export function getAlcoholRegistrationDraftNameCount(items: MfdsDeclarationListItem[]) {
  return getUniqueDeclarations(items).length;
}

export async function createAlcoholRegistrationDraft(
  template: ArrayBuffer,
  items: MfdsDeclarationListItem[]
) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(template);

  const dataSheet = workbook.getWorksheet(DATA_SHEET_NAME);
  if (!dataSheet) throw new Error('알코올 데이터 시트를 찾을 수 없습니다.');

  const declarations = getUniqueDeclarations(items);
  declarations.forEach(({ korName, engName }, index) => {
    const row = dataSheet.getRow(DATA_START_ROW + index);
    row.getCell(1).value = korName;
    row.getCell(2).value = engName;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    blob: new Blob([buffer], { type: EXCEL_MIME_TYPE }),
    declarationCount: declarations.length,
  };
}
