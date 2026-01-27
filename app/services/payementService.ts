// app/services/paymentService.ts
import { supabase } from '../lib/supabase';

export type PaymentMethod = 'orange_money' | 'mtn_mobile_money' | 'cash';

export interface PaymentData {
  orderId: string;
  amount: number;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: any;
}

class PaymentService {
  /**
   * Initier un paiement Orange Money
   */
  async initiateOrangeMoneyPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      // SIMULATION - En production, intégrez l'API Orange Money
      console.log('Initiation paiement Orange Money:', data);

      // Valider le numéro
      if (!this.isValidOrangeNumber(data.phoneNumber)) {
        return {
          success: false,
          message: 'Numéro Orange Money invalide. Format attendu: 6XXXXXXXX',
        };
      }

      // Simuler un délai d'API
      await this.delay(2000);

      // Simuler succès (80% de réussite)
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        const transactionId = `OM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        // Enregistrer la transaction
        await this.recordTransaction({
          orderId: data.orderId,
          transactionId,
          paymentMethod: 'orange_money',
          amount: data.amount,
          phoneNumber: data.phoneNumber,
          status: 'completed',
        });

        // Mettre à jour le statut de la commande
        await this.updateOrderPaymentStatus(data.orderId, 'paid', transactionId);

        return {
          success: true,
          transactionId,
          message: 'Paiement Orange Money effectué avec succès',
        };
      } else {
        return {
          success: false,
          message: 'Le paiement a été refusé. Vérifiez votre solde et réessayez.',
        };
      }
    } catch (error) {
      console.error('Erreur paiement Orange Money:', error);
      return {
        success: false,
        message: 'Erreur lors du paiement. Veuillez réessayer.',
        error,
      };
    }
  }

  /**
   * Initier un paiement MTN Mobile Money
   */
  async initiateMTNMobileMoneyPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      // SIMULATION - En production, intégrez l'API MTN Mobile Money
      console.log('Initiation paiement MTN Mobile Money:', data);

      // Valider le numéro
      if (!this.isValidMTNNumber(data.phoneNumber)) {
        return {
          success: false,
          message: 'Numéro MTN Mobile Money invalide. Format attendu: 6XXXXXXXX',
        };
      }

      // Simuler un délai d'API
      await this.delay(2000);

      // Simuler succès (80% de réussite)
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        const transactionId = `MTN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        // Enregistrer la transaction
        await this.recordTransaction({
          orderId: data.orderId,
          transactionId,
          paymentMethod: 'mtn_mobile_money',
          amount: data.amount,
          phoneNumber: data.phoneNumber,
          status: 'completed',
        });

        // Mettre à jour le statut de la commande
        await this.updateOrderPaymentStatus(data.orderId, 'paid', transactionId);

        return {
          success: true,
          transactionId,
          message: 'Paiement MTN Mobile Money effectué avec succès',
        };
      } else {
        return {
          success: false,
          message: 'Le paiement a été refusé. Vérifiez votre solde et réessayez.',
        };
      }
    } catch (error) {
      console.error('Erreur paiement MTN Mobile Money:', error);
      return {
        success: false,
        message: 'Erreur lors du paiement. Veuillez réessayer.',
        error,
      };
    }
  }

  /**
   * Enregistrer une transaction de paiement
   */
  private async recordTransaction(transaction: {
    orderId: string;
    transactionId: string;
    paymentMethod: string;
    amount: number;
    phoneNumber: string;
    status: string;
  }) {
    try {
      const { error } = await supabase.from('payment_transactions').insert({
        order_id: transaction.orderId,
        transaction_id: transaction.transactionId,
        payment_method: transaction.paymentMethod,
        amount: transaction.amount,
        phone_number: transaction.phoneNumber,
        status: transaction.status,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Erreur enregistrement transaction:', error);
      }
    } catch (error) {
      console.error('Exception enregistrement transaction:', error);
    }
  }

  /**
   * Mettre à jour le statut de paiement d'une commande
   */
  private async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: 'pending' | 'paid' | 'failed',
    transactionId?: string
  ) {
    try {
      const updateData: any = {
        payment_status: paymentStatus,
      };

      if (transactionId) {
        updateData.stripe_payment_id = transactionId; // Réutilisation du champ
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Erreur mise à jour statut paiement:', error);
      }
    } catch (error) {
      console.error('Exception mise à jour statut paiement:', error);
    }
  }

  /**
   * Valider un numéro Orange Money
   */
  private isValidOrangeNumber(phone: string): boolean {
    // Extraire seulement les chiffres
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Accepter 9 chiffres (6XXXXXXXX ou 237XXXXXXXXX)
    if (digitsOnly.length === 9) {
      return true; // Format: 6XXXXXXXX
    }
    
    if (digitsOnly.length === 12 && digitsOnly.startsWith('237')) {
      return true; // Format: 2376XXXXXXXX
    }
    
    return false;
  }

  /**
   * Valider un numéro MTN Mobile Money
   */
  private isValidMTNNumber(phone: string): boolean {
    // Extraire seulement les chiffres
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Accepter 9 chiffres (6XXXXXXXX ou 237XXXXXXXXX)
    if (digitsOnly.length === 9) {
      return true; // Format: 6XXXXXXXX
    }
    
    if (digitsOnly.length === 12 && digitsOnly.startsWith('237')) {
      return true; // Format: 2376XXXXXXXX
    }
    
    return false;
  }

  /**
   * Délai simulé
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formater un numéro de téléphone
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    // Si commence par 237, garder tel quel
    if (cleaned.startsWith('237')) {
      return '+' + cleaned;
    }
    
    // Si commence par 6, ajouter +237
    if (cleaned.startsWith('6')) {
      return '+237' + cleaned;
    }
    
    // Si commence par 06, remplacer par +2376
    if (cleaned.startsWith('06')) {
      return '+237' + cleaned.substring(1);
    }
    
    return phone;
  }
}

export const paymentService = new PaymentService();
export default paymentService;