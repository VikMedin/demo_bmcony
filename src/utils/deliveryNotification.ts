/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodOrder } from '../types';
import { normalizePhone } from './phoneUtils';

/**
 * Plays a vibrant audio notification for the delivery person:
 * 1. An upbeat 4-note ascending chime (C5, E5, G5, C6)
 * 2. Two distinct motorcycle-horn alert beeps
 * 3. Verbal announcement via SpeechSynthesis in Spanish (es-MX)
 */
export function playDeliverySound(orderNumber?: string, clientName?: string) {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      const ctx = new AudioCtxClass();
      const now = ctx.currentTime;

      // Note sequence (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.26);
      });

      // Distinct delivery horn double-beep at 0.55s and 0.75s
      [0.55, 0.75].forEach(timeOffset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now + timeOffset);
        gain.gain.setValueAtTime(0.18, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.13);
      });
    }

    // Verbal speech announcement
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      const text = orderNumber && clientName
        ? `¡Atención Repartidor! Nuevo pedido por entregar. Comanda ${orderNumber}, para ${clientName}.`
        : '¡Atención Repartidor! Tienes un nuevo pedido por entregar en tu ruta.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn('Could not play delivery sound:', err);
  }
}

/**
 * Triggers physical vibration on mobile phones
 * Distinct pattern: buzz - buzz - buzz - long buzz
 */
export function triggerDeliveryVibration() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([350, 150, 350, 150, 350, 150, 700]);
    }
  } catch (err) {
    console.warn('Vibration API not accessible:', err);
  }
}

/**
 * Requests HTML5 System Notification permission from the browser
 */
export async function requestDeliveryNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'default';
  }
}

/**
 * Shows a native system push notification on mobile or desktop
 */
export function showDeliveryNativeNotification(order: FoodOrder): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const title = `🛵 ¡Nuevo Pedido por Entregar! #${order.orderNumber}`;
    const paymentSummary = order.paymentMethod === 'efectivo'
      ? (order.needsChange && order.payingWith
          ? `Efectivo - Llevar cambio de $${(order.changeAmount || 0).toFixed(2)} MXN (Paga con $${order.payingWith.toFixed(2)})`
          : 'Efectivo exacto')
      : 'Transferencia prepagada';

    const options: NotificationOptions = {
      body: `Cliente: ${order.clientName}\nDirección: ${order.address || 'Domicilio'}\nTotal a cobrar: $${order.total.toFixed(2)} MXN (${paymentSummary})`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `delivery-${order.id}`,
      requireInteraction: true
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return notif;
  } catch (err) {
    console.warn('Failed to fire native notification:', err);
    return null;
  }
}

/**
 * Dispatches full mobile alert: Sound + Vibration + Native Notification
 */
export function notifyMessengerMobile(order: FoodOrder) {
  triggerDeliveryVibration();
  playDeliverySound(order.orderNumber, order.clientName);
  showDeliveryNativeNotification(order);
}

/**
 * Generates an instant WhatsApp alert message to be sent directly to the delivery person's mobile phone
 */
export function buildMessengerWhatsAppUrl(
  deliveryPhone: string,
  order: FoodOrder,
  businessName: string = 'Desayunos Cony'
): string {
  const cleanPhone = normalizePhone(deliveryPhone);
  const waPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
  const addressEncoded = encodeURIComponent(order.address || '');

  let text = `🛵 *¡AVISO PARA MENSAJERO DE ${businessName.toUpperCase()}!* 🛵\n\n`;
  text += `¡Tienes un nuevo pedido listo en la barra de cocina para entregar a domicilio! 🍳✨\n\n`;
  text += `📋 *Comanda:* #${order.orderNumber}\n`;
  text += `👤 *Cliente:* ${order.clientName}\n`;
  text += `📞 *Teléfono Cliente:* ${order.clientPhone}\n`;
  text += `📍 *Dirección de Entrega:*\n${order.address || 'Domicilio del comensal'}\n`;
  
  if (order.notes) {
    text += `📝 *Nota de entrega:* ${order.notes}\n`;
  }

  text += `💵 *Total a Cobrar:* $${order.total.toFixed(2)} MXN\n`;
  if (order.paymentMethod === 'efectivo') {
    if (order.needsChange && order.payingWith) {
      text += `💳 *Método de Pago:* 💵 EFECTIVO\n`;
      text += `💵 *Cliente Paga con Billete de:* $${order.payingWith.toFixed(2)} MXN\n`;
      text += `🪙 *LLEVAR CAMBIO DE:* $${(order.changeAmount || 0).toFixed(2)} MXN\n\n`;
    } else {
      text += `💳 *Método de Pago:* 💵 EFECTIVO (Pago exacto - No requiere cambio)\n\n`;
    }
  } else {
    text += `💳 *Método de Pago:* 🏦 TRANSFERENCIA PREVIA (Prepagado)\n\n`;
  }
  
  text += `📦 *Detalle del Pedido:*\n`;
  order.items.forEach(it => {
    text += `  • ${it.quantity}x ${it.name}\n`;
  });

  if (order.address) {
    text += `\n🗺️ *Ruta en Google Maps GPS:*\nhttps://www.google.com/maps/search/?api=1&query=${addressEncoded}\n`;
  }

  text += `\n_¡Pasa a cocina por la comanda, confirma de recibido e inicia tu ruta!_ 🛵💨`;

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
}
