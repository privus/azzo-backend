export interface IWhatsAppRepository {
  sendMessage(codigo: number, to: string, message: string): Promise<void> 
}