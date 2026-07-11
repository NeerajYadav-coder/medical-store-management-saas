import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader } from './Loader';
import { cn } from '@/utils/cn';
import { TablePagination } from './Table';

export function VirtualTable({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  rowKey = '_id',
  className,
  pagination,
  onPageChange,
  rowHeight = 56, // Default row height
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900', className)}>
      <div 
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px', maxHeight: '70vh' }}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
          <thead className="bg-gray-50 dark:bg-gray-950 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          
          {isLoading ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Loader size="lg" />
                </td>
              </tr>
            </tbody>
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    {emptyIcon && <div className="mb-3 text-gray-300">{emptyIcon}</div>}
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody
              className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 relative"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = data[virtualRow.index];
                const rowId = row[rowKey];

                return (
                  <tr
                    key={rowId || virtualRow.index}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'absolute w-full flex',
                      onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    style={{
                      top: 0,
                      left: 0,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 flex items-center text-sm text-gray-900 dark:text-white',
                          column.align === 'center' && 'justify-center',
                          column.align === 'right' && 'justify-end',
                          column.align === 'left' && 'justify-start',
                          column.cellClassName
                        )}
                        style={{ width: column.width || `${100 / columns.length}%` }}
                      >
                        {column.render ? column.render(row[column.key], row, virtualRow.index) : row[column.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          )}
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
  );
}
