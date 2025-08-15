import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ProcessedData {
  fileName: string;
  data: any[][];
}

@Injectable({
  providedIn: 'root'
})
export class ExcelProcessingService {

  processXlsxFile(file: File): Promise<ProcessedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first worksheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // Convert to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new Error('A planilha está vazia.'));
            return;
          }

          // Get headers (first row)
          const headers = jsonData[0] as string[];

          // Find the Nome and Phone column indices
          const nomeColumnIndex = headers.findIndex(header =>
            header && header.toLowerCase().trim() === 'nome'
          );

          const phoneColumnIndex = headers.findIndex(header =>
            header && header.toLowerCase().trim() === 'phone'
          );

          if (nomeColumnIndex === -1) {
            reject(new Error('Coluna "Nome" não encontrada na planilha.'));
            return;
          }

          if (phoneColumnIndex === -1) {
            reject(new Error('Coluna "Phone" não encontrada na planilha.'));
            return;
          }

          // Process rows - no headers in output
          const processedData: any[][] = [];

          // Regex for validating phone numbers
          const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(9?\d{4,5}-?\d{4})$/;

          // Process each row starting from the second one (skip header)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];

            // Skip completely empty rows
            const isRowEmpty = row.every(cell =>
              cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '')
            );

            if (isRowEmpty) {
              continue;
            }

            // Get nome and phone values
            const nomeValue = row[nomeColumnIndex];
            const phoneValue = row[phoneColumnIndex];

            // Skip if phone is null or undefined
            if (phoneValue === null || phoneValue === undefined) {
              continue;
            }

            // Convert phone to string and remove all whitespace
            let stringValue = String(phoneValue);
            stringValue = stringValue.replace(/\s+/g, '');
            stringValue = stringValue.replace(/[^0-9]/g, '');

            // Validate phone number with regex
            if (!phoneRegex.test(stringValue)) {
              continue; // Skip rows with invalid phone numbers
            }

            // Add row with only nome and phone columns in correct order
            processedData.push([nomeValue, stringValue]);
          }

          resolve({
            fileName: file.name.replace('.xlsx', '_processed.xlsx'),
            data: processedData
          });
        } catch (error) {
          reject(new Error('Erro ao processar o arquivo XLSX: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  downloadXlsxFile(processedData: ProcessedData): void {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from processed data
    const worksheet = XLSX.utils.aoa_to_sheet(processedData.data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Write file
    XLSX.writeFile(workbook, processedData.fileName);
  }
}
