import dayjs from 'dayjs'
import { useLayoutEffect, useEffect, useRef, useState, useMemo } from 'react'

import { ButtonSelect, Card, Header } from '@components'
import { Log } from '@models/Log'
import { useGeneral, useI18n, useLogsStreamReader } from '@stores'

import './style.scss'
import classnames from "classnames";
import { camelCase } from 'lodash-es'

export default function Logs () {
    const listRef = useRef<HTMLUListElement>(null)
    const logsRef = useRef<Log[]>([])
    const [logs, setLogs] = useState<Log[]>([])
    const {general} = useGeneral()
    const { translation } = useI18n()
    const { t } = translation('Logs')
    const logsStreamReader = useLogsStreamReader()
    const scrollHeightRef = useRef(listRef.current?.scrollHeight ?? 0)
    const [logchange,setLogchange] = useState(false) 
    const InfoColors = {
        '#909399': 'debug',
        '#57b366': 'info',
        '#ff9a28': 'warning',
        '#ff3e5e': 'error',
    }
    const {logLevel} = general
    const logLevelOptions = [
        { label: ('debug'), value: 'debug' },
        { label: ('info'), value: 'info' },
        { label: ('warn'), value: 'warning' },
        { label: ('error'), value: 'error' },
        { label: ('silent'), value: 'silent' },
    ]
    useLayoutEffect(() => {
        const ul = listRef.current
        if (ul != null && scrollHeightRef.current === (ul.scrollTop + ul.clientHeight)) {
            ul.scrollTop = ul.scrollHeight - ul.clientHeight
        }
        scrollHeightRef.current = ul?.scrollHeight ?? 0
    })

    useEffect(() => {
        function handleLog (newLogs: Log[]) {
            logsRef.current = logsRef.current.slice().concat(newLogs.map(d => ({ ...d, time: new Date() })))
            setLogs(logsRef.current)
        }
        if (logsStreamReader != null) {
            logsStreamReader.subscribe('data', handleLog)
            logsRef.current = logsStreamReader.buffer()
            setLogs(logsRef.current)
        }

        
        return () => logsStreamReader?.unsubscribe('data', handleLog)
    }, [logsStreamReader,logchange])
    const doLogchange = ()=>{setLogchange(!logchange)}
    async function handleLogLevelChange(logLevel: string) {
        general.logLevel = logLevel
        doLogchange()
    }
    return (
        <div className="page">
            <Header title={t('title')} />
            <div className="flex flex-wrap w-full ">
                <ButtonSelect 
                            options={logLevelOptions}
                            value={camelCase(logLevel)}
                            onSelect={handleLogLevelChange}
                />
            </div>
            <Card className="flex flex-col flex-1 mt-2.5 md:mt-4">
                <ul className="logs-panel" ref={listRef}>
                    {
                        logs.map(
                            (log, index) => (
                                <li className="leading-5 inline-block " style={{fontSize:'11px'}} key={index}>
                                    <span className="mr-2 text-orange-400">[{ dayjs(log.time).format('YYYY-MM-DD HH:mm:ss') }]</span>
                                    <>
                                         <span className={classnames( {
                                             'text-teal-400': log.type === 'debug',
                                             'text-rose-400' : log.type === 'error',
                                             'text-pink-400': log.type === 'warning',
                                             'text-sky-400': log.type === 'info',
                                         })}>[{ log.type.toUpperCase() }]</span>
                                    </>
                                    <span> { log.payload }</span>
                                </li>
                            ),
                        )
                    }
                </ul>
            </Card>
        </div>
    )
}

