import { useEffect, useState } from 'react'
import { Table, PageHeader, Badge, Spinner } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatDateTime, toast } from '../lib.js'

export default function Activity() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.activity({ limit: 50 }).then((r) => setRows(r.activity || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'actor', label: 'Actor', render: (r) => (<div><p className="font-medium text-ink">{r.actorName}</p><p className="text-xs text-graphite/50">{r.actorRole?.replace('_', ' ')}</p></div>) },
    { key: 'action', label: 'Action', render: (r) => <span className="font-mono text-xs text-graphite/70">{r.action}</span> },
    { key: 'path', label: 'Path', render: (r) => <span className="text-xs text-graphite/55">{r.path}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.statusCode < 300 ? 'forest' : 'red'}>{r.statusCode}</Badge> },
    { key: 'at', label: 'When', align: 'right', render: (r) => <span className="text-xs text-graphite/55">{formatDateTime(r.createdAt)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Audit trail of admin actions" />
      {loading ? <div className="grid h-60 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} rowKey={(r) => r._id} empty="No activity recorded yet" />}
    </div>
  )
}
