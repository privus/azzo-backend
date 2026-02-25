export interface IWhatsAppRepository {
  sendMessage(to: string, message: string): Promise<void> 
}