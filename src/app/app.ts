import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgIf } from '@angular/common';
import { ExcelProcessingService, ProcessedData } from './excel-processing.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Processador de Planilhas XLSX</h1>
          <p class="text-gray-600">Converta sua planilha XLSX removendo contatos inválidos</p>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-8">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-3">Como funciona?</h2>
            <ul class="list-disc pl-5 space-y-2 text-gray-600">
              <li>Faça upload de uma planilha XLSX com seus contatos</li>
              <li>O sistema irá processar e limpar os números de telefone</li>
              <li>Serão removidos números inválidos (iniciados com 999999 ou 00000, com hífen, etc.)</li>
              <li>Você receberá o download da planilha corrigida</li>
            </ul>
          </div>

          <div class="border-t border-gray-200 pt-6">
            <div class="flex flex-col items-center justify-center">
              <label
                for="file-upload"
                class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                [class.opacity-50]="isProcessing()"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg class="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.016 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p class="mb-2 text-sm text-gray-500">
                    <span class="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p class="text-xs text-gray-500">XLSX</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  class="hidden"
                  accept=".xlsx"
                  (change)="onFileSelected($event)"
                  [disabled]="isProcessing()"
                />
              </label>

              @if (selectedFile()) {
                <button
                  (click)="processFile()"
                  [disabled]="isProcessing()"
                  class="mt-6 w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  @if (!isProcessing()) {
                    <span>Processar Planilha</span>
                  } @else {
                    <span class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Status Messages -->
        @if (successMessage()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">Sucesso!</h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>{{ successMessage() }}</p>
                </div>
              </div>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Erro</h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ errorMessage() }}</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Instructions -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Instruções</h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>A planilha deve conter uma coluna chamada "Phone" para que a validação funcione corretamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('Processador de Planilhas XLSX');

  selectedFile = signal<File | null>(null);
  isProcessing = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private excelProcessingService = inject(ExcelProcessingService);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.clearMessages();
    }
  }

  processFile() {
    if (!this.selectedFile()) {
      this.errorMessage.set('Por favor, selecione um arquivo primeiro.');
      return;
    }

    this.isProcessing.set(true);
    this.clearMessages();

    this.excelProcessingService.processXlsxFile(this.selectedFile()!)
      .then((processedData: ProcessedData) => {
        // Download the processed file
        this.excelProcessingService.downloadXlsxFile(processedData);

        this.successMessage.set('Planilha processada com sucesso! O download começou automaticamente.');
        this.isProcessing.set(false);
      })
      .catch((error: any) => {
        this.errorMessage.set(error.message || 'Ocorreu um erro ao processar a planilha.');
        this.isProcessing.set(false);
      });
  }

  clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
