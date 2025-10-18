// Stub: needs rebuild
export const sendAppointmentConfirmation = async () => {};
export const sendAppointmentReminder = async () => {};
export const sendCancellationNotification = async () => {};

export class EventEmailService {
  static async initialize() {}
  static async sendEmail() {}
  static getInstance() { return this; }
  static async triggerAppointmentRescheduled(...args: any[]) {}
  static async triggerAppointmentCancelled(...args: any[]) {}
  static async triggerAppointmentReminder(...args: any[]) {}
}
