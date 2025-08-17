import { Lunar, Solar, HolidayUtil } from 'lunar-javascript';

export interface LunarInfo {
  lunar: string; // 农历日期
  solarTerm?: string; // 节气
  festivals: string[]; // 节假日列表
  isWorkday?: boolean; // 是否调休工作日
}

/**
 * 获取指定日期的农历信息
 */
export function getLunarInfo(date: Date): LunarInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 创建阳历对象
  const solar = Solar.fromYmd(year, month, day);
  
  // 转换为农历
  const lunar = solar.getLunar();
  
  // 获取农历日期显示
  const lunarMonth = lunar.getMonthInChinese();
  const lunarDay = lunar.getDayInChinese();
  const lunarDisplay = lunarDay === '初一' ? lunarMonth + '月' : lunarDay;
  
  // 获取节气
  const solarTerm = lunar.getJieQi();
  
  // 收集所有节日，使用Set去重
  const festivalsSet = new Set<string>();
  
  // 获取法定节假日信息（优先级最高）
  const holiday = HolidayUtil.getHoliday(year, month, day);
  let isWorkday: boolean | undefined;
  
  if (holiday) {
    // 如果是法定节假日，检查是否是调休工作日
    isWorkday = holiday.isWork();
    
    // 法定节假日名称不需要重复显示具体节日
    // 比如"国庆中秋"已经包含了国庆和中秋的信息
    const holidayName = holiday.getName();
    if (holidayName) {
      // 如果法定节假日名称包含了节日信息，就不需要再单独显示
      // 例如："国庆中秋"包含了"国庆"和"中秋"
      festivalsSet.add(holidayName);
    }
  }
  
  // 获取公历节日（从库中获取）
  const solarFestivals = solar.getFestivals();
  if (solarFestivals && solarFestivals.length > 0) {
    for (const fest of solarFestivals) {
      // 如果法定节假日名称中没有包含这个节日，才添加
      if (!holiday || !holiday.getName()?.includes(fest.replace('节', ''))) {
        festivalsSet.add(fest);
      }
    }
  }
  
  // 获取农历节日（从库中获取）
  const lunarFestivals = lunar.getFestivals();
  if (lunarFestivals && lunarFestivals.length > 0) {
    for (const fest of lunarFestivals) {
      // 如果法定节假日名称中没有包含这个节日，才添加
      if (!holiday || !holiday.getName()?.includes(fest.replace('节', ''))) {
        festivalsSet.add(fest);
      }
    }
  }
  
  return {
    lunar: lunarDisplay,
    solarTerm: solarTerm || undefined,
    festivals: Array.from(festivalsSet),
    isWorkday,
  };
}

/**
 * 格式化节日显示
 */
export function formatFestivalDisplay(info: LunarInfo): string {
  const parts: string[] = [];
  
  // 1. 先显示节日（已经去重）
  if (info.festivals.length > 0) {
    // 最多显示2个节日，避免过长
    const displayFestivals = info.festivals.slice(0, 2);
    parts.push(...displayFestivals);
  }
  
  // 2. 显示节气
  if (info.solarTerm) {
    parts.push(info.solarTerm);
  }
  
  // 3. 显示调休信息（只在调休工作日时显示"班"）
  // 放假日不需要显示"休"，因为已经显示了节日名称
  if (info.isWorkday === true) {
    parts.push('班');
  }
  
  return parts.join('·');
}

/**
 * 获取月视图中应该显示的文本
 */
export function getMonthCellDisplay(date: Date): { lunar: string; festival?: string } {
  const info = getLunarInfo(date);
  const festivalDisplay = formatFestivalDisplay(info);
  
  // 如果有节日或节气，优先显示
  if (festivalDisplay) {
    return {
      lunar: info.lunar,
      festival: festivalDisplay,
    };
  }
  
  // 否则只显示农历
  return {
    lunar: info.lunar,
  };
}

/**
 * 检查是否是节假日
 */
export function isHoliday(date: Date): boolean {
  const info = getLunarInfo(date);
  return info.festivals.length > 0 || info.isWorkday === false;
}

/**
 * 检查是否是调休工作日
 */
export function isWorkday(date: Date): boolean {
  const info = getLunarInfo(date);
  return info.isWorkday === true;
}