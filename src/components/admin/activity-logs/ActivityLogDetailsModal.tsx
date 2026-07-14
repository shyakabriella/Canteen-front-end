'use client'

import {
  CalendarDays,
  CircleUserRound,
  Code2,
  Globe2,
  Hash,
  Laptop,
  LoaderCircle,
  Route,
  ScrollText,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  activityLogStatusLabel,
  formatActivityLogAction,
  formatActivityLogDate,
  formatActivityLogJson,
  getActivityLogAction,
  getActivityLogActorEmail,
  getActivityLogActorName,
  getActivityLogDate,
  getActivityLogDescription,
  getActivityLogDevice,
  getActivityLogIpAddress,
  getActivityLogMetadata,
  getActivityLogMethod,
  getActivityLogModule,
  getActivityLogReference,
  getActivityLogRoute,
  getActivityLogStatus,
  getActivityLogSubjectId,
  getActivityLogSubjectType,
} from '@/lib/activity-log'
import type { ActivityLog } from '@/types/activity-log'

interface Props {
  isOpen: boolean
  log: ActivityLog | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function ActivityLogDetailsModal({
  isOpen,
  log,
  isLoading,
  errorMessage,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  const status = log
    ? getActivityLogStatus(log)
    : 'info'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close activity log details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Activity Log Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              User, request, device and changed-value
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && log && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'success'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : status === 'failed'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : status === 'warning'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-700'
                        : 'bg-gradient-to-br from-indigo-600 to-violet-700'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  {getActivityLogReference(log)}
                </p>

                <h3 className="mt-2 text-3xl font-extrabold">
                  {formatActivityLogAction(
                    getActivityLogAction(log),
                  )}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/80">
                  {getActivityLogDescription(log)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {activityLogStatusLabel(log)}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {getActivityLogModule(log)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Detail
                  icon={Hash}
                  label="Log ID"
                  value={String(log.id)}
                />

                <Detail
                  icon={CircleUserRound}
                  label="Actor"
                  value={getActivityLogActorName(
                    log,
                  )}
                />

                <Detail
                  icon={CircleUserRound}
                  label="Actor Email"
                  value={getActivityLogActorEmail(
                    log,
                  )}
                />

                <Detail
                  icon={ScrollText}
                  label="Subject"
                  value={`${getActivityLogSubjectType(
                    log,
                  )} #${getActivityLogSubjectId(
                    log,
                  )}`}
                />

                <Detail
                  icon={CalendarDays}
                  label="Occurred At"
                  value={formatActivityLogDate(
                    getActivityLogDate(log),
                  )}
                />

                <Detail
                  icon={Globe2}
                  label="IP Address"
                  value={getActivityLogIpAddress(
                    log,
                  )}
                />

                <Detail
                  icon={Code2}
                  label="Request Method"
                  value={getActivityLogMethod(log)}
                />

                <Detail
                  icon={Route}
                  label="Route"
                  value={getActivityLogRoute(log)}
                />

                <Detail
                  icon={Laptop}
                  label="Device"
                  value={getActivityLogDevice(log)}
                />
              </div>

              {log.user_agent && (
                <JsonBlock
                  label="User Agent"
                  value={log.user_agent}
                />
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <JsonBlock
                  label="Old Values"
                  value={formatActivityLogJson(
                    log.old_values,
                  )}
                />

                <JsonBlock
                  label="New Values"
                  value={formatActivityLogJson(
                    log.new_values,
                  )}
                />
              </div>

              <JsonBlock
                label="Metadata"
                value={formatActivityLogJson(
                  getActivityLogMetadata(log),
                )}
              />

              {log.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatActivityLogDate(
                    log.deleted_at,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function JsonBlock({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b border-slate-700 bg-slate-800 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
        </p>
      </div>

      <pre className="max-h-80 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        {value}
      </pre>
    </div>
  )
}
