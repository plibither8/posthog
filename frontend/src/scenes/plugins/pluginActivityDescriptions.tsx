import { dayjs } from 'lib/dayjs'
import { ActivityLogItem, ActivityScope, HumanizedChange } from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import React from 'react'
import { SECRET_FIELD_VALUE } from './utils'

export function pluginActivityDescriber(logItem: ActivityLogItem): HumanizedChange {
    if (logItem.scope !== ActivityScope.PLUGIN && logItem.scope !== ActivityScope.PLUGIN_CONFIG) {
        console.error('plugin describer received a non-plugin activity')
        return { description: null }
    }

    if (logItem.activity == 'installed') {
        return {
            description: (
                <>
                    <strong>{logItem.user.first_name}</strong> installed the app: <b>{logItem.detail.name}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'uninstalled') {
        return {
            description: (
                <>
                    <strong>{logItem.user.first_name}</strong> uninstalled the app: <b>{logItem.detail.name}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'enabled') {
        const changes: (string | JSX.Element)[] = []
        for (const change of logItem.detail.changes || []) {
            const newValue = change.after === SECRET_FIELD_VALUE ? '<secret_value>' : change.after
            changes.push(
                <>
                    field <code>{change.field}</code> set to <code>{newValue}</code>
                </>
            )
        }
        return {
            description: (
                <SentenceList
                    listParts={changes}
                    prefix={
                        <>
                            <strong>{logItem.user.first_name}</strong> enabled the app: <b>{logItem.detail.name}</b>{' '}
                            with config ID {logItem.item_id}
                            {changes.length > 0 ? ', with' : '.'}
                        </>
                    }
                />
            ),
        }
    }

    if (logItem.activity == 'disabled') {
        return {
            description: (
                <>
                    <strong>{logItem.user.first_name}</strong> disabled the app: <b>{logItem.detail.name}</b> with
                    config ID {logItem.item_id}.
                </>
            ),
        }
    }

    if (logItem.activity == 'job_triggered' && logItem.detail.trigger?.job_type == 'Export historical events V2') {
        const [startDate, endDate] = logItem.detail.trigger.payload.dateRange
        return {
            description: (
                <>
                    <strong>{logItem.user.first_name}</strong> started exporting historical events between {startDate}{' '}
                    and {endDate} (inclusive).
                </>
            ),
        }
    }

    if (logItem.activity == 'job_triggered' && logItem.detail.trigger) {
        return {
            description: (
                <>
                    <strong>{logItem.user.first_name}</strong> triggered job:{' '}
                    <code>{logItem.detail.trigger.job_type}</code> with config ID {logItem.item_id}.
                </>
            ),
            extendedDescription: (
                <>
                    Payload: <code>{JSON.stringify(logItem.detail.trigger.payload, null, 2)}</code>
                </>
            ),
        }
    }

    if (logItem.activity == 'export_success' && logItem.detail.trigger) {
        const { dateFrom, dateTo } = logItem.detail.trigger.payload
        const startDate = dayjs(dateFrom).format('YYYY-MM-DD')
        // :TRICKY: Internally export date range is non-inclusive so transform it to be inclusive
        const endDate = dayjs(dateTo).subtract(1, 'day').format('YYYY-MM-DD')

        return {
            description: (
                <>
                    Finished exporting historical events between {startDate} and {endDate} (inclusive).
                </>
            ),
        }
    }

    if (logItem.activity == 'export_fail' && logItem.detail.trigger) {
        const { dateFrom, dateTo } = logItem.detail.trigger.payload
        const startDate = dayjs(dateFrom).format('YYYY-MM-DD')
        // :TRICKY: Internally export date range is non-inclusive so transform it to be inclusive
        const endDate = dayjs(dateTo).subtract(1, 'day').format('YYYY-MM-DD')

        return {
            description: (
                <>
                    Fatal error exporting historical events between {startDate} and {endDate} (inclusive). Check logs
                    for more details.
                </>
            ),
        }
    }

    if (logItem.activity == 'config_updated') {
        const changes: (string | JSX.Element)[] = []
        for (const change of logItem.detail.changes || []) {
            let changeWording: string | JSX.Element = ''
            const changeBefore = change.before === SECRET_FIELD_VALUE ? '<secret_value>' : change.before
            const changeAfter = change.after === SECRET_FIELD_VALUE ? '<secret_value>' : change.after
            if (change.action === 'created') {
                changeWording = (
                    <>
                        added new field <code>{change.field}</code>" with value <code>{changeAfter}</code>
                    </>
                )
            } else if (change.action === 'deleted') {
                changeWording = (
                    <>
                        removed field <code>{change.field}</code>, which had value <code>{changeBefore}</code>
                    </>
                )
            } else if (change.action === 'changed') {
                changeWording = (
                    <>
                        updated field <code>{change.field}</code> from value <code>{changeBefore}</code> to value{' '}
                        <code>{changeAfter}</code>{' '}
                    </>
                )
            }
            changes.push(changeWording)
        }
        return {
            description: (
                <SentenceList
                    prefix={<strong>{logItem.user.first_name}</strong>}
                    listParts={changes}
                    suffix={
                        <>
                            on app <b>{logItem.detail.name}</b> with config ID {logItem.item_id}.
                        </>
                    }
                />
            ),
        }
    }

    return { description: null }
}
