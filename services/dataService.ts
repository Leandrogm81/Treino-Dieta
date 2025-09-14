
import { ACHIEVEMENTS_DEFINITIONS } from '../constants';
import type { AllUserData, Achievement } from '../types';

export const checkAchievements = (data: AllUserData): Achievement[] => {
    return ACHIEVEMENTS_DEFINITIONS.map(def => ({
        ...def,
        unlocked: def.condition(data)
    }));
};

/**
 * Converte uma string de data ISO UTC para uma string ISO com o fuso horário de São Paulo (UTC-3).
 * @param isoUtcString A data em formato ISO (ex: '2023-10-27T12:00:00.000Z').
 * @returns A data formatada com o offset do Brasil (ex: '2023-10-27T09:00:00-03:00').
 */
const toBrazilianISOString = (isoUtcString: string): string => {
    // Não converte valores que não sejam strings
    if (typeof isoUtcString !== 'string') return isoUtcString;
    try {
        const date = new Date(isoUtcString);
        // Só converte strings de data ISO válidas
        if (isNaN(date.getTime()) || !isoUtcString.includes('T')) {
            return isoUtcString;
        }

        const timeZone = 'America/Sao_Paulo';
        
        const year = date.toLocaleString('en-CA', { timeZone, year: 'numeric' });
        const month = date.toLocaleString('en-CA', { timeZone, month: '2-digit' });
        const day = date.toLocaleString('en-CA', { timeZone, day: '2-digit' });
        // Lida com o caso da meia-noite, onde a hora pode ser "24" em alguns ambientes
        const hour = date.toLocaleString('en-CA', { timeZone, hour: '2-digit', hour12: false }).padStart(2, '0').replace('24', '00');
        const minute = date.toLocaleString('en-CA', { timeZone, minute: '2-digit' }).padStart(2, '0');
        const second = date.toLocaleString('en-CA', { timeZone, second: '2-digit' }).padStart(2, '0');
        
        // O Brasil não observa horário de verão desde 2019, tornando UTC-3 um offset estável.
        const offset = '-03:00';

        return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
    } catch (e) {
        // Se ocorrer algum erro, retorna a string original para evitar perda de dados
        return isoUtcString;
    }
};


const convertToCSV = <T extends object,>(data: T[]): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const values = headers.map(header => {
            let value = (item as any)[header];
            // Converte a data para o fuso horário brasileiro antes de adicionar ao CSV
            if (header === 'date' && typeof value === 'string') {
                value = toBrazilianISOString(value);
            }
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
    // Usa a função 'replacer' do JSON.stringify para formatar as datas
    const jsonString = JSON.stringify(data, (key, value) => {
        if (key === 'date' && typeof value === 'string') {
            return toBrazilianISOString(value);
        }
        return value;
    }, 2);

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

const brazilDateFormatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

export const getTodayISO = () => {
    return brazilDateFormatter.format(new Date());
};

export const getTodayData = <T extends { date: string },>(data: T[]) => {
    const today = getTodayISO();
    return data.filter(item => {
        // Converts item's UTC date to Brazil's date string for comparison
        const itemDateInBrazil = brazilDateFormatter.format(new Date(item.date));
        return itemDateInBrazil === today;
    });
};

export const hasTodayLog = <T extends { date: string },>(data: T[]): boolean => {
    const today = getTodayISO();
    return data.some(item => {
        const itemDateInBrazil = brazilDateFormatter.format(new Date(item.date));
        return itemDateInBrazil === today;
    });
};
