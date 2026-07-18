export default function StatusBadge({ status }) {
  const map = {
    running: 'badge-running',
    paused:  'badge-paused',
    done:    'badge-done',
    error:   'badge-error',
    stopped: 'badge-stopped',
    pending: 'badge-pending',
  }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-500'}>{status}</span>
}
