declare module 'lunar-javascript' {
  export interface Holiday {
    getDay(): string;
    getName(): string;
    isWork(): boolean;
    getTarget(): string;
  }

  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getFestivals(): string[];
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getJieQi(): string | null;
    getFestivals(): string[];
  }

  export class HolidayUtil {
    static getHoliday(year: number, month: number, day: number): Holiday | null;
    static getHolidays(year: number): Holiday[];
  }
}