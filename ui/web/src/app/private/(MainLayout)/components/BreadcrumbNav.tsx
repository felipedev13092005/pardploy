'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/components/ui/breadcrumb'

import { Link, useLocation } from 'react-router'

const labelTraslate = {
  dashboard: 'Panel',
  products: 'Productos',
  categories: 'Categorias',
  inventory: 'Inventario',
  edit: 'Editar',
  warehouse: 'Bodega',
  areas: 'Zonas',
  tables: 'Mesas',
  orders: 'Pedidos',
  events: 'Eventos',
  new: 'Nuevo',
}

export function BreadcrumbNav() {
  const pathname = useLocation().pathname

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .slice(1)

  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href =
            '/private/' + segments.slice(0, index + 1).join('/')

          const isLast = index === segments.length - 1

          const label =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, ' ')

          const text = !isUuid(segment)
            ? labelTraslate[segment as keyof typeof labelTraslate] || label
            : 'Detalle'

          return (
            <BreadcrumbItem key={href}>
              {isLast ? (
                <BreadcrumbPage>{text}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    render={
                      <Link to={href}>
                        {text}
                      </Link>
                    }
                  />

                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function isUuid(segment: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  return uuidRegex.test(segment)
}
