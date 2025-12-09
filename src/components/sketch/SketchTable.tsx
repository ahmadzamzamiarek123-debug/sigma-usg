'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SketchTable({ children, className, ...props }: SketchTableProps) {
  return (
    <div className={cn('sketch-table-wrapper overflow-x-auto', className)} {...props}>
      <table className="sketch-table" style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}>
        {children}
      </table>
    </div>
  )
}

export function SketchTableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('', className)} {...props}>
      {children}
    </thead>
  )
}

export function SketchTableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('', className)} {...props}>
      {children}
    </tbody>
  )
}

export function SketchTableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('', className)} {...props}>
      {children}
    </tr>
  )
}

export function SketchTableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th 
      className={cn('', className)} 
      style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
      {...props}
    >
      {children}
    </th>
  )
}

export function SketchTableCell({ children, className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('', className)} {...props}>
      {children}
    </td>
  )
}
