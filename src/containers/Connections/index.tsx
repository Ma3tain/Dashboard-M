import classnames from 'classnames'
import { groupBy } from 'lodash-es'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
    Cell,
    Column,
    ColumnInstance,
    TableInstance,
    TableOptions,
    useBlockLayout,
    useFilters,
    UseFiltersColumnOptions,
    UseFiltersInstanceProps,
    UseFiltersOptions,
    useResizeColumns,
    UseResizeColumnsColumnProps,
    UseResizeColumnsOptions,
    useSortBy,
    UseSortByColumnOptions,
    UseSortByColumnProps,
    UseSortByOptions,
    useTable,
} from 'react-table'
import { useLatest, useScroll } from 'react-use'

import { Button, Card, Checkbox, Drawer, Header, Icon, Input, Modal } from '@components'
import { fromNow } from '@lib/date'
import { formatTraffic } from '@lib/helper'
import { useObject, useVisible } from '@lib/hook'
import * as API from '@lib/request'
import {useClient, useConnectionStreamReader, useI18n, useVersion} from '@stores'

import { Devices } from './Devices'
import { ConnectionInfo } from './Info'
import { Connection, FormatConnection, useConnections } from './store'
import './style.scss'

enum Columns {
    Host = 'host',
    Process = 'process',
    Network = 'network',
    Type = 'type',
    Chains = 'chains',
    Rule = 'rule',
    Speed = 'speed',
    Upload = 'upload',
    Download = 'download',
    UploadSpeed = 'uploadSpeed',
    DownloadSpeed = 'downloadSpeed',
    SourceIP = 'sourceIP',
    Time = 'time',
}

const shouldCenter = new Set<string>([Columns.Network, Columns.Type, Columns.Speed, Columns.Upload, Columns.Download, Columns.SourceIP, Columns.Time])

interface TableColumn<D extends object> extends
    ColumnInstance<D>,
    UseSortByColumnProps<D>,
    UseResizeColumnsColumnProps<D> {}

type TableColumnOption<D extends object> =
    Column<D> &
    UseResizeColumnsOptions<D> &
    UseFiltersColumnOptions<D> &
    UseSortByColumnOptions<D>

interface ITableOptions<D extends object> extends
    TableOptions<D>,
    UseSortByOptions<D>,
    UseFiltersOptions<D> {}

interface ITableInstance<D extends object> extends
    TableInstance<D>,
    UseFiltersInstanceProps<D> {}

function formatSpeed (UL: number, DL: number) {
    switch (true) {
        case UL !== 0:
            return `↑ ${formatTraffic(UL)}/s`
        case DL !== 0:
            return `↓ ${formatTraffic(DL)}/s`
        default:
            return '-'
    }
}

export default function Connections () {
    const { translation, lang } = useI18n()
    const { meta } = useVersion()
    const t = useMemo(() => translation('Connections').t, [translation])
    const connStreamReader = useConnectionStreamReader()
    const client = useClient()
    const cardRef = useRef<HTMLDivElement>(null)

    // total
    const [traffic, setTraffic] = useObject({
        uploadTotal: 0,
        downloadTotal: 0,
    })

    // close all connections
    const { visible, show, hide } = useVisible()
    function handleCloseConnections () {
        client.closeAllConnections().finally(() => hide())
    }

    // connections
    const { connections, feed, save, toggleSave } = useConnections()
    const data: FormatConnection[] = useMemo(() => connections.map(
        c => ({
            id: c.id,
            host: `${c.metadata.host || c.metadata.destinationIP}:${c.metadata.destinationPort}`,
            chains: c.chains.slice().reverse().join(' / '),
            rule: c.rulePayload ? `${c.rule} :: ${c.rulePayload}` : c.rule,
            time: new Date(c.start).getTime(),
            upload: c.upload,
            download: c.download,
            sourceIP: c.metadata.sourceIP,
            type: c.metadata.type,
            process: c.metadata.process,
            network: c.metadata.network.toUpperCase(),
            speed: { upload: c.uploadSpeed, download: c.downloadSpeed },
            completed: !!c.completed,
            original: c,
        }),
    ), [connections])

    const devices = useMemo(() => {
        const gb = groupBy(connections, 'metadata.sourceIP')
        return Object.keys(gb)
            .map(key => ({ label: key, number: gb[key].length }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [connections])



    // table
    const tableRef = useRef<HTMLDivElement>(null)
    const { x: scrollX } = useScroll(tableRef)
    const columns: Array<TableColumnOption<FormatConnection>> = useMemo(() => [
        { Header: t(`columns.${Columns.Host}`), accessor: Columns.Host, minWidth: 180, width: 180 },
        { Header: t(`columns.${Columns.Type}`), accessor: Columns.Type, width: 70, maxWidth: 120 },
        { Header: t(`columns.${Columns.Network}`), accessor: Columns.Network, minWidth: 70, maxWidth: 70 },
        { Header: t(`columns.${Columns.Chains}`), accessor: Columns.Chains, minWidth: 300, width: 300 },
        { Header: t(`columns.${Columns.Rule}`), accessor: Columns.Rule, minWidth: 140, width: 140 },
        { Header: t(`columns.${Columns.Upload}`), accessor: Columns.Upload, minWidth: 100, width: 100, sortDescFirst: true },
        { Header: t(`columns.${Columns.Download}`), accessor: Columns.Download, minWidth: 100, width: 100, sortDescFirst: true },
        {
            id: Columns.UploadSpeed,
            Header: t(`columns.${Columns.UploadSpeed}`),
            accessor (originalRow: FormatConnection) {
                return originalRow.speed.upload
            },
            minWidth: 110,
            maxWidth: 110,
            sortDescFirst: true,
        },
        {
            id: Columns.DownloadSpeed,
            Header: t(`columns.${Columns.DownloadSpeed}`),
            accessor (originalRow: FormatConnection) {
                return originalRow.speed.download
            },
            minWidth: 110,
            maxWidth: 110,
            sortDescFirst: true,
        },
        { Header: t(`columns.${Columns.SourceIP}`), accessor: Columns.SourceIP, minWidth: 100, width: 100, filter: 'equals' },
        { Header: t(`columns.${Columns.Time}`), accessor: Columns.Time, minWidth: 130, maxWidth: 130, sortType (rowA, rowB) { return rowB.original.time - rowA.original.time } },
    ] as Array<TableColumnOption<FormatConnection>>, [t])

    useLayoutEffect(() => {
        function handleConnection (snapshots: API.Snapshot[]) {
            for (const snapshot of snapshots) {
                setTraffic({
                    uploadTotal: snapshot.uploadTotal,
                    downloadTotal: snapshot.downloadTotal,
                })

                feed(snapshot.connections)
            }
        }

        connStreamReader?.subscribe('data', handleConnection)
        return () => {
            connStreamReader?.unsubscribe('data', handleConnection)
            connStreamReader?.destory()
        }
    }, [connStreamReader, feed, setTraffic])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        setFilter,
    } = useTable(
        {
            columns,
            data,
            autoResetSortBy: false,
            autoResetFilters: false,
            initialState: { sortBy: [{ id: Columns.Time, desc: false }] },
        } as unknown as ITableOptions<FormatConnection>,
        useResizeColumns,
        useBlockLayout,
        useFilters,
        useSortBy,
    ) as ITableInstance<FormatConnection>
    const headerGroup = useMemo(() => headerGroups[0], [headerGroups])
    const renderCell = useCallback(function (cell: Cell<FormatConnection>) {
        switch (cell.column.id) {
            case Columns.UploadSpeed:
                return formatSpeed(cell.value, 0)
            case Columns.DownloadSpeed:
                return formatSpeed(0, cell.value)
            case Columns.Upload:
            case Columns.Download:
                return formatTraffic(cell.value)
            case Columns.Time:
                return fromNow(new Date(cell.value), lang)
            default:
                return cell.value
        }
    }, [lang])

    // filter
    const [device, setDevice] = useState('')
    function handleDeviceSelected (label: string) {
        setDevice(label)
        setFilter?.(Columns.SourceIP, label || undefined)
    }

    // click item
    const [drawerState, setDrawerState] = useObject({
        visible: false,
        selectedID: '',
        connection: {} as Partial<Connection>,
    })
    function handleConnectionSelected (id: string) {
        setDrawerState({
            visible: true,
            selectedID: id,
        })
    }
    function handleConnectionClosed () {
        setDrawerState(d => { d.connection.completed = true })
        client.closeConnection(drawerState.selectedID)
    }
    const latestConntion = useLatest(drawerState.connection)
    useEffect(() => {
        const conn = data.find(c => c.id === drawerState.selectedID)?.original
        if (conn) {
            setDrawerState(d => {
                d.connection = { ...conn }
                if (drawerState.selectedID === latestConntion.current.id) {
                    d.connection.completed = latestConntion.current.completed
                }
            })
        } else if (Object.keys(latestConntion.current).length !== 0 && !latestConntion.current.completed) {
            setDrawerState(d => { d.connection.completed = true })
        }
    }, [data, drawerState.selectedID, latestConntion, setDrawerState])

    return (
        <div className="page">
            <Header title={t('title')}>
                <div className="cursor-default flex-1 connections-filter flex hidden text-xs md:(flex flex-row text-sm)">
                    <span className='mr-4'>{`${t('total.upload')} ${formatTraffic(traffic.uploadTotal)}`}</span>
                    <span className='mr-4'>{`${t('total.download')} ${formatTraffic(traffic.downloadTotal)}`}</span>
                    </div>
                <Checkbox className="connections-filter text-xs md:text-sm" checked={save} onChange={toggleSave}>{t('keepClosed')}</Checkbox>
                <Icon className="connections-filter dangerous" onClick={show} type="close-all" size={20} />
            </Header>
            { devices.length > 1 && <Devices devices={devices} selected={device} onChange={handleDeviceSelected} /> }
            <Card ref={cardRef} className="connections-card relative">
                <div {...getTableProps()} className="flex flex-col flex-1 w-full overflow-auto" style={{ flexBasis: 0 }} ref={tableRef}>
                    <div {...headerGroup.getHeaderGroupProps()} className="connections-header">
                        {
                            headerGroup.headers.map((column, idx) => {
                                const realColumn = column as unknown as TableColumn<FormatConnection>
                                const id = realColumn.id
                                return (
                                    <div
                                        {...realColumn.getHeaderProps()}
                                        className={classnames('connections-th', {
                                            resizing: realColumn.isResizing,
                                            fixed: scrollX > 0 && realColumn.id === Columns.Host,
                                            meta: realColumn.id === Columns.Process && !meta
                                        })}
                                        key={id}>
                                        <div {...realColumn.getSortByToggleProps()}
                                            className={classnames( {
                                            meta: realColumn.id === Columns.Process && !meta
                                        })}>
                                            {column.render('Header')}
                                            {
                                                realColumn.isSorted
                                                    ? realColumn.isSortedDesc ? ' ↓' : ' ↑'
                                                    : null
                                            }
                                        </div>
                                        { idx !== headerGroup.headers.length - 1 &&
                                            <div {...realColumn.getResizerProps()} className="connections-resizer" />
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>

                    <div {...getTableBodyProps()} className="flex-1">
                        {
                            rows.map((row,i)=> {
                                prepareRow(row)
                                return (
                                    <div
                                        {...row.getRowProps()}
                                        className = {classnames("cursor-default connections-item select-none",{ tableRow: i % 2 ===0 })}
                                        key={row.original.id}
                                        onClick={() => handleConnectionSelected(row.original.id)}>
                                        {
                                            row.cells.map((cell )=> {
                                                const classname = classnames(
                                                    'connections-block',
                                                    { 'text-center': shouldCenter.has(cell.column.id), completed: row.original.completed },
                                                    { fixed: scrollX > 0 && cell.column.id === Columns.Host },
                                                    { fixed2: scrollX > 0 && cell.column.id === Columns.Host && i % 2 ===0 },
                                                    { meta: cell.column.id === Columns.Process && !meta },
                                                )
                                                return (
                                                    <div {...cell.getCellProps()} className={classname} key={cell.column.id}>
                                                        { renderCell(cell)}
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </Card>
            <Modal title={t('closeAll.title')} show={visible} onClose={hide} onOk={handleCloseConnections}>{t('closeAll.content')}</Modal>
            <Drawer containerRef={cardRef} visible={drawerState.visible} width={450}>
                <div className="flex h-8 justify-between items-center">
                    <span className="font-bold pl-3 text-orange-400">{t('info.title')}</span>
                    <Icon type="close" size={16} className="cursor-pointer" onClick={() => setDrawerState('visible', false)} />
                </div>
                <ConnectionInfo className="mt-3 px-5" connection={drawerState.connection} />
                <div className="flex mt-3 pr-3 justify-end">
                    <Button type="danger" disiabled={drawerState.connection.completed} onClick={() => handleConnectionClosed()}>{ t('info.closeConnection') }</Button>
                </div>
            </Drawer>
        </div>
    )
}
