import classnames from 'classnames'
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'

import {noop} from '@lib/helper'
import {BaseComponentProps} from '@models'
import {proxyMapping, useClient, useGeneral, useI18n, useProxy} from '@stores'
import './style.scss'
import {useAtom} from "jotai";
import { Group as IGroup } from '@lib/request'


interface TagsProps extends BaseComponentProps {
    data: string[]
    onClick: (name: string) => void
    errSet?: Set<string>
    select: string
    rowHeight: number
    canClick: boolean
}

export function Tags (props: TagsProps) {
    const { className, data, onClick, select, canClick, errSet, rowHeight: rawHeight } = props
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
    const TagColors = {
        '#909399': 0,
        '#226600': 260,
        '#a75c00': 400,
        '#970000': Infinity,
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

            const color = useMemo(
                () => Object.keys(TagColors).find(
                    threshold => delay <= TagColors[threshold as keyof typeof TagColors],
                ),
                [delay],
            )

            return (
                <li className={tagClass} key={t} onClick={() => handleClick(t)}>
                    <span className={'overflow-hidden whitespace-nowrap overflow-ellipsis'} title={t}>{t}</span>
                    <div className={'flex flex-row justify-between'}>
                        <p style={{fontSize:'x-small'}}>{proxyType === 'Shadowsocks'? 'SS': proxyType === 'ShadowsocksR'? 'SSR': proxyType? proxyType : groupType }</p>
                        <p style={{fontSize:'x-small',textAlign:'end', color }}> {history?.length && delay !== 0 ? delay + 'ms' : ''} </p>
                    </div>
                </li>
            )
        })

    return (
        <div className={classnames('flex items-start overflow-y-hidden transition-all', className)} style={{ height: rowHeight}}>
            <ul ref={ulRef} className={classnames('tags', { expand })}>
                { tags }
            </ul>
            {
                showExtend &&
                    <span className="h-7 select-none cursor-pointer leading-7 text-xs text-center" onClick={toggleExtend}> { expand ? t('collapseText') : t('expandText') } </span>
            }
        </div>
    )
}
