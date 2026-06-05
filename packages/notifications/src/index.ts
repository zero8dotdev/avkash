// Provider-only by design (knows transports, not domains). Callers pre-resolve
// who/what and hand the dispatcher intents.
export * from './providers'; // sendEmail, sendSMS (+ EmailMessage)
export * from './dispatch'; // dispatch + NotificationIntent/Recipient/Channel
export * from './recipients'; // resolveUsers, resolveOrgAdmins (id → contact)
