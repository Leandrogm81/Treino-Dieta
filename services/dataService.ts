
import { ACHIEVEMENTS_DEFINITIONS } from '../constants';
import type { AllUserData, Achievement } from '../types';

export const checkAchievements = (data: AllUserData): Achievement[] => {
    return ACHIEVEMENTS_DEFINITIONS.map(def => ({
        ...def,
        unlocked: def.condition(data)
    }));
};

const convertToCSV = <T extends object,>(data: T[]): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const values = headers.map(header => {
            const value = (item as any)[header];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
};

export const exportToCsv = <T extends object,>(data: T[], filename: string) => {
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportAllDataToJson = (data: object, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const getTodayISO = () => new Date().toISOString().split('T')[0];

export const getTodayData = <T extends { date: string },>(data: T[]) => {
    const today = getTodayISO();
    return data.filter(item => item.date.startsWith(today));
};
