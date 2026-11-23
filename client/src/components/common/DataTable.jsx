import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  pageSize = 10,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((data?.length || 0) / pageSize);
  const paginatedData = data?.slice((page - 1) * pageSize, page * pageSize) || [];

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 border-b border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.key} className="table-th" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row._id || idx} className="hover:bg-gray-50/60 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="table-td">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1">
            <PaginationBtn onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft size={14} /></PaginationBtn>
            <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></PaginationBtn>
            <span className="px-3 py-1 text-xs font-medium text-gray-700">{page} / {totalPages}</span>
            <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={14} /></PaginationBtn>
            <PaginationBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight size={14} /></PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
    >
      {children}
    </button>
  );
}
