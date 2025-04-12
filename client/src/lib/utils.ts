import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  return result;
}

export function calculateDCF(amount: number, annualRate: number, days: number): number {
  const dailyRate = annualRate / 365;
  return amount / Math.pow(1 + dailyRate, days);
}

export function getDaysBetweenDates(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
  return diffDays;
}

export function parseDate(dateString: string): Date {
  // Parse date in dd/mm/yyyy format
  const parts = dateString.split('/');
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}
