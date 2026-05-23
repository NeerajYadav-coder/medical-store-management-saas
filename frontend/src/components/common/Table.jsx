/**
 * components/common/Table.jsx
 * 
 * RESPONSIBILITY:
 * - Reusable data table component
 * - Sorting, pagination, loading states
 * - Empty states, row selection
 */

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'
import { Loader } from './Loader'

/**
 * Table Component
 */
export function Table({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  rowKey = '_id',
  className,
  // Sorting
  sortable = false,
  defaultSort,
  onSort,
  // Selection
  selectable = false,
  selectedRows = [],
  onSelectRows,
  // Pagination
  pagination,
  onPageChange,
  // Striped rows
  striped = false,
  // Hover effect
  hoverable = true,
  // Compact mode
  compact = false,
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: 'asc' })

  // Handle sorting
  const handleSort = (columnKey) => {
    if (!sortable) return

    let direction = 'asc'
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    const newSort = { key: columnKey, direction }
    setSortConfig(newSort)
    onSort?.(newSort)
  }

  // Sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 opacity-30" />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  // Handle row selection
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectRows?.(data.map(row => row[rowKey]))
    } else {
      onSelectRows?.([])
    }
  }

  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectRows?.([...selectedRows, id])
    } else {
      onSelectRows?.(selectedRows.filter(rowId => rowId !== id))
    }
  }

  const isAllSelected = data.length > 0 && selectedRows.length === data.length
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {/* Selection checkbox */}
              {selectable && (
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500',
                    compact ? 'py-2' : 'py-3',
                    column.sortable !== false && sortable && 'cursor-pointer hover:bg-gray-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <Loader size="lg" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    {emptyIcon && (
                      <div className="mb-3 text-gray-300">{emptyIcon}</div>
                    )}
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = row[rowKey]
                const isSelected = selectedRows.includes(rowId)

                return (
                  <tr
                    key={rowId || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors',
                      hoverable && 'hover:bg-gray-50',
                      striped && rowIndex % 2 === 1 && 'bg-gray-50/50',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-brand-50'
                    )}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectRow(rowId, e.target.checked)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 text-sm text-gray-900 whitespace-nowrap',
                          compact ? 'py-2' : 'py-3',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.cellClassName
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          {...pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

/**
 * Table Pagination Component
 */
export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  showItemCount = true,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const pages = useMemo(() => {
    const pageNumbers = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i)
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i)
      } else {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i)
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3">
      {/* Item count */}
      {showItemCount && (
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </p>
      )}

      {/* Page numbers */}
      <nav className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>

        {/* Page buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'min-w-[32px] h-8 px-2 text-sm font-medium rounded-md transition-colors',
                  page === currentPage
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Next
        </Button>
      </nav>
    </div>
  )
}

/**
 * Simple card-based data display for mobile
 */
export function DataCards({
  data = [],
  renderCard,
  isLoading = false,
  emptyMessage = 'No data found',
  columns = 1,
  className,
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {data.map((item, index) => renderCard(item, index))}
    </div>
  )
}

export default Table
