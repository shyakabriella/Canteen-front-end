'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Boxes,
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  PackageOpen,
  QrCode,
  RefreshCw,
  ScrollText,
  Settings2,
  ShoppingBag,
  Users,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import DashboardCard from './DashboardCard'
import { apiRequest } from '@/lib/api'

type UnknownRecord = Record<string, unknown>

interface WeeklyActivityItem {
  key: string
  day: string
  salesAmount: number
  orderCount: number
  salesHeight: number
  ordersHeight: number
}

interface DashboardOrder {
  id: string
  number: string
  customer: string
  amount: number
  status: string
  createdAt: string | null
}

interface DashboardInventoryItem {
  id: string
  name: string
  value: string
  quantity: number
  percentage: number
  barClass: string
  lowStock: boolean
}

interface OrderDistribution {
  collected: number
  ready: number
  preparing: number
  pending: number
}

interface DashboardData {
  appName: string
  currencySymbol: string

  todaySales: number
  weeklySales: number
  salesChange: string

  todayOrders: number
  activeOrders: number

  lowStockItems: number
  criticalAlerts: number

  uniqueUsers: number
  todayActivities: number
  failedActivities: number

  pendingPurchaseRequests: number
  inventoryValue: number

  qrScansToday: number
  failedQrScans: number

  weeklyActivity: WeeklyActivityItem[]
  recentOrders: DashboardOrder[]
  inventoryItems: DashboardInventoryItem[]
  distribution: OrderDistribution
}

const emptyDashboard: DashboardData = {
  appName: 'Smart Canteen',
  currencySymbol: 'RWF',

  todaySales: 0,
  weeklySales: 0,
  salesChange: '0%',

  todayOrders: 0,
  activeOrders: 0,

  lowStockItems: 0,
  criticalAlerts: 0,

  uniqueUsers: 0,
  todayActivities: 0,
  failedActivities: 0,

  pendingPurchaseRequests: 0,
  inventoryValue: 0,

  qrScansToday: 0,
  failedQrScans: 0,

  weeklyActivity: createEmptyWeeklyActivity(),
  recentOrders: [],
  inventoryItems: [],

  distribution: {
    collected: 0,
    ready: 0,
    preparing: 0,
    pending: 0,
  },
}

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function firstDefined(
  ...values: unknown[]
): unknown {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== '',
  )
}

function stringValue(
  ...values: unknown[]
): string {
  const value = firstDefined(...values)

  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  return String(value).trim()
}

function numberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      continue
    }

    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function valueFrom(
  record: UnknownRecord,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = record[key]

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value
    }
  }

  return undefined
}

function extractSummary(
  payload: unknown,
): UnknownRecord {
  const root = asRecord(payload)

  if (!root) {
    return {}
  }

  const data = asRecord(root.data)

  return (
    asRecord(root.summary) ??
    asRecord(data?.summary) ??
    data ??
    root
  )
}

function extractArray(
  payload: unknown,
  keys: string[],
): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload
      .map(asRecord)
      .filter(
        (item): item is UnknownRecord =>
          item !== null,
      )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const candidates: unknown[] = [
    ...keys.map((key) => root[key]),
    root.data,
    ...keys.map((key) => data?.[key]),
    data?.data,
    data?.items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map(asRecord)
        .filter(
          (item): item is UnknownRecord =>
            item !== null,
        )
    }
  }

  return []
}

function settingArrayToRecord(
  items: unknown[],
): UnknownRecord {
  const result: UnknownRecord = {}

  for (const item of items) {
    const record = asRecord(item)

    if (!record) {
      continue
    }

    const key = stringValue(
      record.setting_key,
      record.key,
      record.name,
    )

    if (!key) {
      continue
    }

    result[key] = firstDefined(
      record.setting_value,
      record.value,
    )
  }

  return result
}

function extractPublicSettings(
  payload: unknown,
): UnknownRecord {
  if (Array.isArray(payload)) {
    return settingArrayToRecord(payload)
  }

  const root = asRecord(payload)

  if (!root) {
    return {}
  }

  const data = asRecord(root.data)

  const candidates: unknown[] = [
    root.settings,
    root.public_settings,
    root.system_settings,
    data?.settings,
    data?.public_settings,
    data?.system_settings,
    root.data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return settingArrayToRecord(candidate)
    }

    const record = asRecord(candidate)

    if (record) {
      return record
    }
  }

  return root
}

async function safeGet(
  path: string,
  authenticated = true,
): Promise<unknown | null> {
  try {
    if (authenticated) {
      return await apiRequest<unknown>(
        path,
        {
          method: 'GET',
          auth: true,
        },
      )
    }

    return await apiRequest<unknown>(
      path,
      {
        method: 'GET',
      },
    )
  } catch {
    return null
  }
}

function dateKey(
  date: Date,
): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      '0',
    ),
    String(date.getDate()).padStart(
      2,
      '0',
    ),
  ].join('-')
}

function createEmptyWeeklyActivity():
WeeklyActivityItem[] {
  const result: WeeklyActivityItem[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)

    result.push({
      key: dateKey(date),
      day: new Intl.DateTimeFormat('en', {
        weekday: 'short',
      }).format(date),
      salesAmount: 0,
      orderCount: 0,
      salesHeight: 0,
      ordersHeight: 0,
    })
  }

  return result
}

function getOrderNumber(
  order: UnknownRecord,
): string {
  return (
    stringValue(
      valueFrom(order, [
        'order_number',
        'reference',
        'order_code',
        'code',
      ]),
    ) ||
    `ORDER-${stringValue(order.id) || 'N/A'}`
  )
}

function getOrderCustomer(
  order: UnknownRecord,
): string {
  const customer =
    asRecord(order.customer) ??
    asRecord(order.user) ??
    asRecord(order.student)

  return (
    stringValue(
      customer?.name,
      customer?.full_name,
      customer?.email,
      order.customer_name,
      order.user_name,
    ) || 'Unknown customer'
  )
}

function getOrderAmount(
  order: UnknownRecord,
): number {
  return numberValue(
    valueFrom(order, [
      'grand_total',
      'total_amount',
      'total',
      'amount',
      'payable_amount',
      'final_amount',
    ]),
  )
}

function getOrderStatus(
  order: UnknownRecord,
): string {
  return (
    stringValue(
      valueFrom(order, [
        'status',
        'order_status',
      ]),
    ) || 'pending'
  )
}

function getOrderCreatedAt(
  order: UnknownRecord,
): string | null {
  const value = stringValue(
    valueFrom(order, [
      'created_at',
      'ordered_at',
      'order_date',
      'placed_at',
    ]),
  )

  return value || null
}

function normalizeStatus(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
}

function buildWeeklyActivity(
  orders: UnknownRecord[],
): WeeklyActivityItem[] {
  const weekly = createEmptyWeeklyActivity()

  const indexByDate = new Map(
    weekly.map((item, index) => [
      item.key,
      index,
    ]),
  )

  for (const order of orders) {
    const createdAt = getOrderCreatedAt(order)

    if (!createdAt) {
      continue
    }

    const date = new Date(createdAt)

    if (Number.isNaN(date.getTime())) {
      continue
    }

    const index = indexByDate.get(
      dateKey(date),
    )

    if (index === undefined) {
      continue
    }

    weekly[index].salesAmount +=
      getOrderAmount(order)

    weekly[index].orderCount += 1
  }

  const maximumSales = Math.max(
    ...weekly.map(
      (item) => item.salesAmount,
    ),
    1,
  )

  const maximumOrders = Math.max(
    ...weekly.map(
      (item) => item.orderCount,
    ),
    1,
  )

  return weekly.map((item) => ({
    ...item,

    salesHeight:
      item.salesAmount > 0
        ? Math.max(
            8,
            Math.round(
              (
                item.salesAmount /
                maximumSales
              ) * 100,
            ),
          )
        : 0,

    ordersHeight:
      item.orderCount > 0
        ? Math.max(
            8,
            Math.round(
              (
                item.orderCount /
                maximumOrders
              ) * 100,
            ),
          )
        : 0,
  }))
}

function buildRecentOrders(
  orders: UnknownRecord[],
): DashboardOrder[] {
  return [...orders]
    .sort((first, second) => {
      const firstDate = Date.parse(
        getOrderCreatedAt(first) ?? '',
      )

      const secondDate = Date.parse(
        getOrderCreatedAt(second) ?? '',
      )

      return (
        (
          Number.isNaN(secondDate)
            ? 0
            : secondDate
        ) -
        (
          Number.isNaN(firstDate)
            ? 0
            : firstDate
        )
      )
    })
    .slice(0, 5)
    .map((order) => ({
      id:
        stringValue(order.id) ||
        getOrderNumber(order),

      number: getOrderNumber(order),

      customer: getOrderCustomer(order),

      amount: getOrderAmount(order),

      status: getOrderStatus(order),

      createdAt: getOrderCreatedAt(order),
    }))
}

function getInventoryQuantity(
  stock: UnknownRecord,
): number {
  return numberValue(
    valueFrom(stock, [
      'current_quantity',
      'available_quantity',
      'stock_quantity',
      'quantity',
      'balance',
    ]),
  )
}

function getInventoryReorderLevel(
  stock: UnknownRecord,
): number {
  return numberValue(
    valueFrom(stock, [
      'reorder_level',
      'minimum_quantity',
      'minimum_stock',
      'low_stock_threshold',
      'alert_quantity',
    ]),
  )
}

function buildInventoryItems(
  stocks: UnknownRecord[],
): DashboardInventoryItem[] {
  return stocks
    .map((stock) => {
      const foodItem =
        asRecord(stock.food_item) ??
        asRecord(stock.foodItem) ??
        asRecord(stock.item) ??
        asRecord(stock.product)

      const quantity =
        getInventoryQuantity(stock)

      const reorderLevel =
        getInventoryReorderLevel(stock)

      const maximumQuantity = Math.max(
        numberValue(
          valueFrom(stock, [
            'maximum_quantity',
            'maximum_stock',
            'max_stock',
            'capacity',
          ]),
        ),
        reorderLevel > 0
          ? reorderLevel * 4
          : quantity,
        quantity,
        1,
      )

      const percentage = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (
              quantity /
              maximumQuantity
            ) * 100,
          ),
        ),
      )

      const lowStock =
        reorderLevel > 0 &&
        quantity <= reorderLevel

      const unit =
        stringValue(
          valueFrom(stock, [
            'unit',
            'measurement_unit',
          ]),
          foodItem?.unit,
          foodItem?.measurement_unit,
        ) || 'units'

      let barClass =
        'bg-emerald-500'

      if (percentage <= 25) {
        barClass = 'bg-rose-500'
      } else if (percentage <= 50) {
        barClass = 'bg-amber-500'
      } else if (percentage <= 75) {
        barClass = 'bg-indigo-500'
      }

      return {
        id:
          stringValue(stock.id) ||
          stringValue(foodItem?.id) ||
          stringValue(
            foodItem?.name,
            stock.item_name,
          ),

        name:
          stringValue(
            foodItem?.name,
            foodItem?.title,
            stock.item_name,
            stock.name,
          ) || 'Inventory Item',

        value: `${formatNumber(
          quantity,
        )} ${unit}`,

        quantity,
        percentage,
        barClass,
        lowStock,
      }
    })
    .sort((first, second) => {
      if (
        first.lowStock !==
        second.lowStock
      ) {
        return first.lowStock ? -1 : 1
      }

      return (
        first.percentage -
        second.percentage
      )
    })
    .slice(0, 5)
}

function buildOrderDistribution(
  summary: UnknownRecord,
  todayOrders: UnknownRecord[],
): OrderDistribution {
  let collected = numberValue(
    valueFrom(summary, [
      'collected_orders',
      'completed_orders',
      'picked_up_orders',
      'completed',
      'collected',
    ]),
  )

  let ready = numberValue(
    valueFrom(summary, [
      'ready_orders',
      'ready',
    ]),
  )

  let preparing = numberValue(
    valueFrom(summary, [
      'preparing_orders',
      'processing_orders',
      'preparing',
      'processing',
    ]),
  )

  let pending = numberValue(
    valueFrom(summary, [
      'pending_orders',
      'pending',
    ]),
  )

  if (
    collected +
      ready +
      preparing +
      pending ===
    0
  ) {
    for (const order of todayOrders) {
      const status = normalizeStatus(
        getOrderStatus(order),
      )

      if (
        [
          'completed',
          'collected',
          'picked_up',
          'pickup_confirmed',
        ].includes(status)
      ) {
        collected += 1
      } else if (status === 'ready') {
        ready += 1
      } else if (
        [
          'preparing',
          'processing',
          'confirmed',
        ].includes(status)
      ) {
        preparing += 1
      } else {
        pending += 1
      }
    }
  }

  return {
    collected,
    ready,
    preparing,
    pending,
  }
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-RW',
    {
      maximumFractionDigits: 0,
    },
  ).format(value)
}

function formatCurrency(
  value: number,
  symbol: string,
): string {
  const formatted = formatNumber(value)

  if (
    symbol.length <= 2 &&
    !/^[A-Z]{3}$/.test(symbol)
  ) {
    return `${symbol}${formatted}`
  }

  return `${formatted} ${symbol}`
}

function formatTime(
  value: string | null,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatUpdatedDate(
  value: Date | null,
): string {
  if (!value) {
    return 'Today'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatPercentageChange(
  value: unknown,
): string {
  const parsed = numberValue(value)

  if (parsed > 0) {
    return `+${parsed.toFixed(1)}%`
  }

  if (parsed < 0) {
    return `${parsed.toFixed(1)}%`
  }

  return '0%'
}

function orderStatusLabel(
  status: string,
): string {
  return normalizeStatus(status)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function orderStatusClass(
  status: string,
): string {
  const normalized =
    normalizeStatus(status)

  if (
    [
      'completed',
      'collected',
      'picked_up',
      'pickup_confirmed',
    ].includes(normalized)
  ) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (normalized === 'ready') {
    return 'bg-indigo-50 text-indigo-700 ring-indigo-200'
  }

  if (
    [
      'preparing',
      'processing',
      'confirmed',
    ].includes(normalized)
  ) {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }

  if (
    [
      'cancelled',
      'canceled',
      'rejected',
      'failed',
    ].includes(normalized)
  ) {
    return 'bg-red-50 text-red-700 ring-red-200'
  }

  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

function distributionGradient(
  distribution: OrderDistribution,
): string {
  const total = Math.max(
    1,
    distribution.collected +
      distribution.ready +
      distribution.preparing +
      distribution.pending,
  )

  const collectedEnd =
    (
      distribution.collected /
      total
    ) * 360

  const readyEnd =
    collectedEnd +
    (
      distribution.ready /
      total
    ) * 360

  const preparingEnd =
    readyEnd +
    (
      distribution.preparing /
      total
    ) * 360

  return `conic-gradient(
    #6366f1 0deg ${collectedEnd}deg,
    #22c55e ${collectedEnd}deg ${readyEnd}deg,
    #f59e0b ${readyEnd}deg ${preparingEnd}deg,
    #e2e8f0 ${preparingEnd}deg 360deg
  )`
}

export default function MainDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData>(
      emptyDashboard,
    )

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [updatedAt, setUpdatedAt] =
    useState<Date | null>(null)

  const loadDashboard = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setErrorMessage('')

      try {
        const responses = await Promise.all([
          safeGet(
            '/sales-reports/summary',
          ),

          safeGet('/orders/summary'),

          safeGet(
            '/low-stock-alerts/summary',
          ),

          safeGet(
            '/activity-logs/summary',
          ),

          safeGet(
            '/purchase-requests/summary',
          ),

          safeGet(
            '/inventory-reports/summary',
          ),

          safeGet(
            '/qr-scan-logs/summary',
          ),

          safeGet('/orders?per_page=200'),

          safeGet(
            '/inventory-stocks?per_page=100',
          ),

          safeGet(
            '/system-settings/public',
            false,
          ),
        ])

        const [
          salesPayload,
          ordersSummaryPayload,
          lowStockPayload,
          activityPayload,
          purchasePayload,
          inventoryReportPayload,
          qrPayload,
          ordersPayload,
          inventoryPayload,
          settingsPayload,
        ] = responses

        const failureCount =
          responses.filter(
            (response) => response === null,
          ).length

        const salesSummary =
          extractSummary(salesPayload)

        const ordersSummary =
          extractSummary(
            ordersSummaryPayload,
          )

        const lowStockSummary =
          extractSummary(lowStockPayload)

        const activitySummary =
          extractSummary(activityPayload)

        const purchaseSummary =
          extractSummary(purchasePayload)

        const inventoryReportSummary =
          extractSummary(
            inventoryReportPayload,
          )

        const qrSummary =
          extractSummary(qrPayload)

        const orders = extractArray(
          ordersPayload,
          [
            'orders',
            'items',
          ],
        )

        const inventoryStocks =
          extractArray(
            inventoryPayload,
            [
              'inventory_stocks',
              'inventoryStocks',
              'stocks',
              'items',
            ],
          )

        const publicSettings =
          extractPublicSettings(
            settingsPayload,
          )

        const currencySymbol =
          stringValue(
            publicSettings.currency_symbol,
            publicSettings.currency,
            publicSettings.currency_code,
          ) || 'RWF'

        const appName =
          stringValue(
            publicSettings.app_name,
            publicSettings.system_name,
            publicSettings.site_name,
          ) || 'Smart Canteen'

        const today = new Date()
        const currentDateKey =
          dateKey(today)

        const todayOrderRecords =
          orders.filter((order) => {
            const createdAt =
              getOrderCreatedAt(order)

            if (!createdAt) {
              return false
            }

            const date =
              new Date(createdAt)

            return (
              !Number.isNaN(
                date.getTime(),
              ) &&
              dateKey(date) ===
                currentDateKey
            )
          })

        const calculatedTodaySales =
          todayOrderRecords.reduce(
            (total, order) =>
              total +
              getOrderAmount(order),
            0,
          )

        const weeklyActivity =
          buildWeeklyActivity(orders)

        const calculatedWeeklySales =
          weeklyActivity.reduce(
            (total, item) =>
              total +
              item.salesAmount,
            0,
          )

        const calculatedActiveOrders =
          orders.filter((order) =>
            [
              'pending',
              'confirmed',
              'preparing',
              'processing',
              'ready',
            ].includes(
              normalizeStatus(
                getOrderStatus(order),
              ),
            ),
          ).length

        const calculatedLowStock =
          inventoryStocks.filter(
            (stock) => {
              const reorder =
                getInventoryReorderLevel(
                  stock,
                )

              return (
                reorder > 0 &&
                getInventoryQuantity(
                  stock,
                ) <= reorder
              )
            },
          ).length

        const distribution =
          buildOrderDistribution(
            ordersSummary,
            todayOrderRecords,
          )

        setDashboard({
          appName,
          currencySymbol,

          todaySales: numberValue(
            valueFrom(salesSummary, [
              'today_sales',
              'sales_today',
              'today_revenue',
              'revenue_today',
              'total_sales_today',
            ]),
            calculatedTodaySales,
          ),

          weeklySales: numberValue(
            valueFrom(salesSummary, [
              'weekly_sales',
              'week_sales',
              'sales_this_week',
              'total_week_sales',
            ]),
            calculatedWeeklySales,
          ),

          salesChange:
            formatPercentageChange(
              valueFrom(salesSummary, [
                'sales_growth_percentage',
                'growth_percentage',
                'percentage_change',
                'sales_change',
              ]),
            ),

          todayOrders: numberValue(
            valueFrom(ordersSummary, [
              'today_orders',
              'orders_today',
              'today_count',
              'total_today',
            ]),
            todayOrderRecords.length,
          ),

          activeOrders: numberValue(
            valueFrom(ordersSummary, [
              'active_orders',
              'open_orders',
              'processing_orders',
            ]),
            calculatedActiveOrders,
          ),

          lowStockItems: numberValue(
            valueFrom(lowStockSummary, [
              'active_alerts',
              'unresolved_alerts',
              'low_stock_alerts',
              'total_active',
            ]),
            calculatedLowStock,
          ),

          criticalAlerts: numberValue(
            valueFrom(lowStockSummary, [
              'critical_alerts',
              'critical_count',
              'high_priority_alerts',
            ]),
          ),

          uniqueUsers: numberValue(
            valueFrom(activitySummary, [
              'unique_users',
              'users_count',
              'active_users',
            ]),
          ),

          todayActivities: numberValue(
            valueFrom(activitySummary, [
              'today_logs',
              'logs_today',
              'today_count',
            ]),
          ),

          failedActivities: numberValue(
            valueFrom(activitySummary, [
              'failed_actions',
              'failed_logs',
              'failed_count',
            ]),
          ),

          pendingPurchaseRequests:
            numberValue(
              valueFrom(purchaseSummary, [
                'pending_requests',
                'pending_count',
                'pending',
              ]),
            ),

          inventoryValue: numberValue(
            valueFrom(
              inventoryReportSummary,
              [
                'total_inventory_value',
                'inventory_value',
                'total_stock_value',
              ],
            ),
          ),

          qrScansToday: numberValue(
            valueFrom(qrSummary, [
              'today_scans',
              'scans_today',
              'today_count',
            ]),
          ),

          failedQrScans: numberValue(
            valueFrom(qrSummary, [
              'failed_scans',
              'invalid_scans',
              'failed_count',
            ]),
          ),

          weeklyActivity,

          recentOrders:
            buildRecentOrders(orders),

          inventoryItems:
            buildInventoryItems(
              inventoryStocks,
            ),

          distribution,
        })

        if (failureCount === responses.length) {
          setErrorMessage(
            'Dashboard data could not be loaded. Confirm that Laravel is running and that your login token is valid.',
          )
        } else if (failureCount > 0) {
          setErrorMessage(
            `${failureCount} dashboard source${
              failureCount === 1 ? '' : 's'
            } could not be loaded. Available information is still displayed.`,
          )
        }

        setUpdatedAt(new Date())
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard information.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const totalDistributedOrders =
    dashboard.distribution.collected +
    dashboard.distribution.ready +
    dashboard.distribution.preparing +
    dashboard.distribution.pending

  const chartBackground = useMemo(
    () =>
      distributionGradient(
        dashboard.distribution,
      ),
    [dashboard.distribution],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading live dashboard data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
            {dashboard.appName} Overview
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Live canteen sales, orders, inventory,
            reports and system activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
            <CalendarDays className="h-4 w-4" />

            {formatUpdatedDate(updatedAt)}
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard(true)
            }
            disabled={isRefreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isRefreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh Data'}
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Today's Sales"
          value={formatCurrency(
            dashboard.todaySales,
            dashboard.currencySymbol,
          )}
          description="Sales report revenue"
          change={dashboard.salesChange}
          icon={WalletCards}
          tone="indigo"
        />

        <DashboardCard
          title="Today's Orders"
          value={formatNumber(
            dashboard.todayOrders,
          )}
          description={`${formatNumber(
            dashboard.activeOrders,
          )} currently active`}
          change="Live"
          icon={ShoppingBag}
          tone="emerald"
        />

        <DashboardCard
          title="Low Stock Alerts"
          value={formatNumber(
            dashboard.lowStockItems,
          )}
          description={`${formatNumber(
            dashboard.criticalAlerts,
          )} critical alerts`}
          change="Attention"
          icon={AlertTriangle}
          tone="amber"
        />

        <DashboardCard
          title="Active Users"
          value={formatNumber(
            dashboard.uniqueUsers,
          )}
          description={`${formatNumber(
            dashboard.todayActivities,
          )} activities today`}
          change="Audited"
          icon={Users}
          tone="rose"
        />
      </section>

      <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[1.65fr_0.85fr]">
        <article className="border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Seven-Day Sales Activity
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                {formatCurrency(
                  dashboard.weeklySales,
                  dashboard.currencySymbol,
                )}
              </h2>

              <p
                className={`mt-1 text-xs font-semibold ${
                  dashboard.salesChange.startsWith(
                    '-',
                  )
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              >
                {dashboard.salesChange} sales change
              </p>
            </div>

            <Link
              href="/admin/sales-reports"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              View Report
            </Link>
          </div>

          <div className="mt-8 flex h-[250px] items-end gap-3 border-b border-slate-200 px-1 sm:gap-5">
            {dashboard.weeklyActivity.map(
              (item) => (
                <div
                  key={item.key}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${item.day}: ${formatCurrency(
                    item.salesAmount,
                    dashboard.currencySymbol,
                  )}, ${item.orderCount} orders`}
                >
                  <div className="flex flex-1 items-end justify-center gap-1 sm:gap-2">
                    <div
                      className="w-3 rounded-t-full bg-indigo-500 transition-all sm:w-4"
                      style={{
                        height:
                          item.salesHeight > 0
                            ? `${item.salesHeight}%`
                            : '4px',
                      }}
                    />

                    <div
                      className="w-3 rounded-t-full bg-slate-200 transition-all sm:w-4"
                      style={{
                        height:
                          item.ordersHeight > 0
                            ? `${item.ordersHeight}%`
                            : '4px',
                      }}
                    />
                  </div>

                  <p className="py-3 text-center text-xs font-medium text-slate-400">
                    {item.day}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Sales value
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              Number of orders
            </span>
          </div>
        </article>

        <article className="p-5 sm:p-6">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Order Distribution
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current order statuses
            </p>
          </div>

          <div
            className="mx-auto mt-7 flex h-48 w-48 items-center justify-center rounded-full"
            style={{
              background: chartBackground,
            }}
          >
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
              <span className="text-3xl font-extrabold text-slate-950">
                {formatNumber(
                  totalDistributedOrders,
                )}
              </span>

              <span className="text-xs text-slate-400">
                Total orders
              </span>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 text-xs">
            <DistributionItem
              dotClass="bg-indigo-500"
              label="Collected"
              value={
                dashboard.distribution
                  .collected
              }
            />

            <DistributionItem
              dotClass="bg-emerald-500"
              label="Ready"
              value={
                dashboard.distribution.ready
              }
            />

            <DistributionItem
              dotClass="bg-amber-500"
              label="Preparing"
              value={
                dashboard.distribution
                  .preparing
              }
            />

            <DistributionItem
              dotClass="bg-slate-300"
              label="Pending"
              value={
                dashboard.distribution
                  .pending
              }
            />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Latest customer orders from the API
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3">
                    Order
                  </th>

                  <th className="px-4 py-3">
                    Customer
                  </th>

                  <th className="px-4 py-3">
                    Amount
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {dashboard.recentOrders.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      No recent orders were returned.
                    </td>
                  </tr>
                ) : (
                  dashboard.recentOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="text-sm hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-indigo-600">
                          {order.number}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                          {order.customer}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                          {formatCurrency(
                            order.amount,
                            dashboard.currencySymbol,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${orderStatusClass(
                              order.status,
                            )}`}
                          >
                            {orderStatusLabel(
                              order.status,
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                          {formatTime(
                            order.createdAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Inventory Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Lowest available stock quantities
              </p>
            </div>

            <PackageOpen className="h-5 w-5 text-indigo-500" />
          </div>

          <div className="mt-6 space-y-5">
            {dashboard.inventoryItems.length ===
            0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
                No inventory stock was returned.
              </div>
            ) : (
              dashboard.inventoryItems.map(
                (item) => (
                  <div key={item.id}>
                    <div className="mb-2 flex justify-between gap-3 text-xs">
                      <span className="flex items-center gap-2 font-bold text-slate-700">
                        {item.name}

                        {item.lowStock && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600">
                            Low
                          </span>
                        )}
                      </span>

                      <span className="whitespace-nowrap font-semibold text-slate-500">
                        {item.value}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${item.barClass}`}
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ),
              )
            )}
          </div>

          <Link
            href="/admin/inventory"
            className="mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
          >
            Manage Inventory
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">
            Operational Attention
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Items that may require administrator
            action
          </p>

          <div className="mt-5 space-y-3">
            <AttentionRow
              label="Critical stock alerts"
              value={dashboard.criticalAlerts}
              href="/admin/low-stock-alerts"
              tone="red"
            />

            <AttentionRow
              label="Pending purchase requests"
              value={
                dashboard.pendingPurchaseRequests
              }
              href="/admin/purchase-requests"
              tone="amber"
            />

            <AttentionRow
              label="Failed activities"
              value={
                dashboard.failedActivities
              }
              href="/admin/activity-logs"
              tone="red"
            />

            <AttentionRow
              label="QR scans today"
              value={dashboard.qrScansToday}
              href="/staff/scan"
              tone="indigo"
            />

            <AttentionRow
              label="Failed QR scans"
              value={dashboard.failedQrScans}
              href="/admin/qr-scan-logs"
              tone="red"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-indigo-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              Inventory Value
            </p>

            <p className="mt-2 text-xl font-extrabold text-indigo-950">
              {formatCurrency(
                dashboard.inventoryValue,
                dashboard.currencySymbol,
              )}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">
            Quick Management
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Open the modules added to the Smart
            Canteen administration system
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              title="Low Stock Alerts"
              description="Generate and resolve alerts"
              href="/admin/low-stock-alerts"
              icon={BellRing}
            />

            <QuickAction
              title="Purchase Requests"
              description="Approve and receive stock"
              href="/admin/purchase-requests"
              icon={ClipboardList}
            />

            <QuickAction
              title="Sales Reports"
              description="Generate and finalize reports"
              href="/admin/sales-reports"
              icon={BarChart3}
            />

            <QuickAction
              title="Inventory Reports"
              description="Review inventory reports"
              href="/admin/inventory-reports"
              icon={Boxes}
            />

            <QuickAction
              title="Activity Logs"
              description="Audit user and system actions"
              href="/admin/activity-logs"
              icon={ScrollText}
            />

            <QuickAction
              title="System Settings"
              description="Configure application values"
              href="/admin/system-settings"
              icon={Settings2}
            />

            <QuickAction
              title="QR Scanner"
              description="Verify customer pickup codes"
              href="/staff/scan"
              icon={QrCode}
            />
          </div>
        </article>
      </section>
    </div>
  )
}

function DistributionItem({
  dotClass,
  label,
  value,
}: {
  dotClass: string
  label: string
  value: number
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-semibold text-slate-700">
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
        />

        {label}
      </p>

      <p className="mt-1 text-slate-400">
        {formatNumber(value)} orders
      </p>
    </div>
  )
}

function AttentionRow({
  label,
  value,
  href,
  tone,
}: {
  label: string
  value: number
  href: string
  tone: 'red' | 'amber' | 'indigo'
}) {
  const toneClass = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }[tone]

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-extrabold ${toneClass}`}
      >
        {formatNumber(value)}
      </span>
    </Link>
  )
}

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>

      <h3 className="mt-4 text-sm font-extrabold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  )
}
