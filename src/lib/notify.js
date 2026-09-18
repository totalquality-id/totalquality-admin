// src/lib/notify.js
//
// Jembatan agar toast bisa dipanggil dari mana saja tanpa harus memakai hook.
// ToastProvider mendaftarkan implementasi aslinya saat mount; sebelum itu (atau
// di luar React tree) panggilan hanya dicatat ke console, bukan melempar error.
//
// Dipakai sebagai pengganti window.alert() di seluruh panel. alert() memblokir
// thread UI dan pada aksi beruntun memunculkan dialog bertumpuk.

let impl = null;

export function registerNotifier(next) {
  impl = next;
  return () => {
    if (impl === next) impl = null;
  };
}

function call(kind, message) {
  if (impl && typeof impl[kind] === "function") {
    impl[kind](message);
    return;
  }
  // Fallback: jangan pernah menelan pesan error diam-diam.
  if (kind === "error") console.error(message);
  else console.info(message);
}

export const notify = {
  success: (message) => call("success", message),
  error: (message) => call("error", message),
  info: (message) => call("info", message),
};

export default notify;
