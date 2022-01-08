import classnames from 'classnames'
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'

import {noop} from '@lib/helper'
import {BaseComponentProps} from '@models'
import {proxyMapping, useClient, useGeneral, useI18n, useProxy} from '@stores'
import './style.scss'
import {useAtom} from "jotai";
import { Group as IGroup } from '@lib/request'
import {values} from "lodash-es";


interface TagsProps extends BaseComponentProps {
    title: string
    data: string[]
    onClick: (name: string) => void
    errSet?: Set<string>
    select: string
    rowHeight: number
    canClick: boolean
}

export function Tags (props: TagsProps) {
    const { className, title, data, onClick, select, canClick, errSet, rowHeight: rawHeight } = props
    const { translation } = useI18n()
    const { t } = translation('Proxies')
    const [expand, setExpand] = useState(false)
    const [showExtend, setShowExtend] = useState(false)
    const [proxyMap] = useAtom(proxyMapping)
    const { groups } = useProxy()

    const ulRef = useRef<HTMLUListElement>(null)

    useLayoutEffect(() => {
        setShowExtend((ulRef?.current?.offsetHeight ?? 0) > 45)
    }, [])

    // const rowAutoHeight = ulRef?.current?.offsetHeight
    const rowHeight = expand ? 'auto' : rawHeight
    const handleClick = canClick ? onClick : noop

    function toggleExtend () {
        setExpand(!expand)
    }

    const tags = data
        .map( t => {

            const tagClass = classnames({
                'tags-selected': select === t,
                'cursor-pointer': canClick,
                'cursor-default': !canClick,
                error: errSet?.has(t)
            })
            let groupType
            for (let group of groups) {
                if (group.name === t) {
                    groupType = group.type
                    break
                }
            }

            const history = proxyMap.get(t)?.history
            const proxyType = proxyMap.get(t)?.type
            const delay = history?.length ? history.slice(-1)[0].delay : 0
            let color

            if (delay == 0){
                color =  '#909399'
            } else if (delay <= 260){
                color =  '#226600'
            } else if (delay <= 400){
                color =  '#a75c00'
            } else if (delay <= Infinity){
                color =  '#970000'
            }

            return (
                <li className={tagClass} key={t} onClick={() => handleClick(t)}>
                    <span className={'overflow-hidden whitespace-nowrap overflow-ellipsis'} title={t}>{t}</span>
                    <div className={'flex flex-row justify-between'}>
                        <p style={{fontSize:'xx-small'}}>{proxyType === 'Shadowsocks'? 'SS': proxyType === 'ShadowsocksR'? 'SSR': proxyType? proxyType : groupType }</p>
                        <p style={{fontSize:'xx-small',textAlign:'end' , color }}> {history?.length && delay !== 0 ? delay + 'ms' : ''} </p>
                    </div>
                </li>
            )
        })

    return (
        <div className={classnames('flex items-start overflow-y-hidden transition-all', className)} style={{ height: title=="GLOBAL"? "AUTO": rowHeight}}>
            <ul ref={ulRef} className={classnames('tags', { expand })}>
                { tags }
            </ul>
            {
                title !== "GLOBAL" && showExtend &&
                    <span className="h-7 select-none cursor-pointer leading-7 text-xs text-center" onClick={toggleExtend}> { expand ? t('collapseText') : t('expandText') } </span>
            }
        </div>
    )
}
