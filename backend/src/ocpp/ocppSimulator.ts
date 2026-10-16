/**
 * Academic OCPP 1.6-inspired simulation layer.
 *
 * IMPORTANT (see docs/OCPP.md): this module simulates the *message shapes*
 * and *state transitions* of a subset of OCPP 1.6 JSON (BootNotification,
 * Heartbeat, StatusNotification, Authorize, StartTransaction, MeterValues,
 * StopTransaction) so students can study/demo the protocol flow. It is NOT
 * a certified OCPP Central System, and it does not open a real OCPP
 * WebSocket endpoint for physical hardware. The module is intentionally
 * isolated behind this interface so a real CSMS (e.g. steve, SteVe,
 * OCPP-J libraries) could be substituted later without touching the rest
 * of the booking/session code.
 */

export type OcppMessageType =
  | 'BootNotification'
  | 'Heartbeat'
  | 'StatusNotification'
  | 'Authorize'
  | 'StartTransaction'
  | 'MeterValues'
  | 'StopTransaction';

export interface OcppLogEntry {
  timestamp: string;
  chargerCode: string;
  messageType: OcppMessageType;
  payload: Record<string, unknown>;
}

const log: OcppLogEntry[] = [];
const MAX_LOG_SIZE = 500;

function record(chargerCode: string, messageType: OcppMessageType, payload: Record<string, unknown>) {
  log.push({ timestamp: new Date().toISOString(), chargerCode, messageType, payload });
  if (log.length > MAX_LOG_SIZE) log.shift();
}

export function bootNotification(chargerCode: string, vendor = 'Smart Electronic Vehicle Charging Management System-Sim', model = 'VirtualCharger-1') {
  record(chargerCode, 'BootNotification', { chargePointVendor: vendor, chargePointModel: model });
}

export function heartbeat(chargerCode: string) {
  record(chargerCode, 'Heartbeat', { currentTime: new Date().toISOString() });
}

export function statusNotification(chargerCode: string, status: string) {
  record(chargerCode, 'StatusNotification', { status });
}

export function authorize(chargerCode: string, idTag: string) {
  record(chargerCode, 'Authorize', { idTag, idTagInfo: { status: 'Accepted' } });
}

export function startTransaction(chargerCode: string, transactionId: string, meterStart: number) {
  record(chargerCode, 'StartTransaction', { transactionId, meterStart });
}

export function meterValues(chargerCode: string, transactionId: string, meterValueWh: number) {
  record(chargerCode, 'MeterValues', { transactionId, sampledValue: [{ value: meterValueWh, unit: 'Wh' }] });
}

export function stopTransaction(chargerCode: string, transactionId: string, meterStop: number, reason = 'Local') {
  record(chargerCode, 'StopTransaction', { transactionId, meterStop, reason });
}

export function getRecentLog(limit = 100): OcppLogEntry[] {
  return log.slice(-limit);
}
