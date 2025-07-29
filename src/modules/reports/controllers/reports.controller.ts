import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  @ApiOperation({ summary: 'Gerar relatório semanal de vendas' })
  @ApiQuery({ name: 'startDate', description: 'Data de início (YYYY-MM-DD)', example: '2025-01-06' })
  @ApiQuery({ name: 'endDate', description: 'Data de fim (YYYY-MM-DD)', example: '2025-01-12' })
  @ApiQuery({ name: 'format', description: 'Formato do relatório', enum: ['pdf', 'xlsx'], required: false })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  async generateWeeklyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Res() res: Response,
  ) {
    try {
      // Validar datas
      if (!startDate || !endDate) {
        throw new BadRequestException('As datas de início e fim são obrigatórias');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
      }

      if (start > end) {
        throw new BadRequestException('A data de início deve ser anterior à data de fim');
      }

      // Gerar relatório
      const reportBuffer = await this.reportsService.generateWeeklyReport(
        startDate, 
        endDate, 
        format
      );

      // Configurar resposta
      const fileName = `relatorio-semanal-${startDate}-a-${endDate}.${format}`;
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', reportBuffer.length);

      return res.send(reportBuffer);
    } catch (error) {
      console.error('Erro ao gerar relatório semanal:', error);
      throw new BadRequestException(error.message || 'Erro interno ao gerar relatório');
    }
  }

  @Get('weekly/current')
  @ApiOperation({ summary: 'Gerar relatório da semana atual' })
  @ApiQuery({ name: 'format', description: 'Formato do relatório', enum: ['pdf', 'xlsx'], required: false })
  @ApiResponse({ status: 200, description: 'Relatório da semana atual gerado com sucesso' })
  async generateCurrentWeekReport(
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Res() res: Response,
  ) {
    try {
      // Calcular primeira e última data da semana atual
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
      
      // Primeira data da semana (domingo)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Última data da semana (sábado)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      // Gerar relatório
      const reportBuffer = await this.reportsService.generateWeeklyReport(
        startDate, 
        endDate, 
        format
      );

      // Configurar resposta
      const fileName = `relatorio-semana-atual.${format}`;
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', reportBuffer.length);

      return res.send(reportBuffer);
    } catch (error) {
      console.error('Erro ao gerar relatório da semana atual:', error);
      throw new BadRequestException(error.message || 'Erro interno ao gerar relatório');
    }
  }

  @Get('weekly/last')
  @ApiOperation({ summary: 'Gerar relatório da semana passada' })
  @ApiQuery({ name: 'format', description: 'Formato do relatório', enum: ['pdf', 'xlsx'], required: false })
  @ApiResponse({ status: 200, description: 'Relatório da semana passada gerado com sucesso' })
  async generateLastWeekReport(
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Res() res: Response,
  ) {
    try {
      // Calcular primeira e última data da semana passada
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Primeira data da semana passada
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
      startOfLastWeek.setHours(0, 0, 0, 0);
      
      // Última data da semana passada
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);

      const startDate = startOfLastWeek.toISOString().split('T')[0];
      const endDate = endOfLastWeek.toISOString().split('T')[0];

      // Gerar relatório
      const reportBuffer = await this.reportsService.generateWeeklyReport(
        startDate, 
        endDate, 
        format
      );

      // Configurar resposta
      const fileName = `relatorio-semana-passada.${format}`;
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', reportBuffer.length);

      return res.send(reportBuffer);
    } catch (error) {
      console.error('Erro ao gerar relatório da semana passada:', error);
      throw new BadRequestException(error.message || 'Erro interno ao gerar relatório');
    }
  }
}