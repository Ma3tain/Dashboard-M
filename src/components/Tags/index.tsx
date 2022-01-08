import classnames from 'classnames'
import {useCallback, useLayoutEffect, useRef, useState} from 'react'

import {noop} from '@lib/helper'
import {BaseComponentProps} from '@models'
import {proxyMapping, useClient, useI18n, useProxy} from '@stores'
import './style.scss'
import {useAtom} from "jotai";
import {Icon} from "@components/Icon";
import {ResultAsync} from "neverthrow";
import {AxiosError} from "axios";

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
    const { proxies , groups } = useProxy()
    const { set } = useProxy()
    const [loading, setloading] = useState(false)

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

    const client = useClient()

    async function handleNotityGroupTest() {
        setloading(true)
        for (let group of groups) {
            if (group.name === title) {
                for (let proxy of group.all) {
                    for (let match of proxies){
                        if (proxy === match.name){
                            const result = await ResultAsync.fromPromise(getDelay(proxy), e => e as AxiosError)
                            const validDelay = result.isErr() ? 0 : result.value
                            set(draft => {
                                const proxymatch = draft.proxies.find(p => p.name === proxy)
                                if (proxymatch != null) {
                                    proxymatch.history.push({time: Date.now().toString(), delay: validDelay})
                                }
                            })
                        }
                    }
                }
                break
            }
        }
        setTimeout(function (){setloading(false)}, 500)
    }

    const getDelay = useCallback(async (name: string) => {
        const { data: { delay } } = await client.getProxyDelay(name)
        return delay
    }, [client])

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
                            <p style={{fontSize: 'xx-small'}}>{proxyType === 'Shadowsocks' ? 'SS' : proxyType === 'ShadowsocksR' ? 'SSR' : proxyType ? proxyType : groupType}</p>
                            <p style={{
                                fontSize: 'xx-small',
                                textAlign: 'end',
                                color
                            }}> {history?.length && delay !== 0 ? delay + 'ms' : ''} </p>
                        </div>
                    </li>
            )
        })

    return (
        <>
            <div id="facebook" style={{display: loading? '' : 'none' }}>
                <div className="bar"/>
                <div className="bar"/>
                <div className="bar"/>
            </div>
            <div className={classnames('flex items-start overflow-y-hidden transition-all', className)}
                 style={{height: title == "GLOBAL" ? "AUTO" : rowHeight, display: loading? 'none' : '' }}>
                <ul ref={ulRef} className={classnames('tags', {expand})}>
                    {tags}
                </ul>
                <div className={'flex flex-row justify-end'} style={{width: '80px'}}>
                    <div>
                        <Icon className="h-7 select-none leading-7 text-xs text-center speed-icon cursor-pointer"
                              type="speed" size={10} onClick={handleNotityGroupTest}/>
                        <span
                            className="proxies-speed-test h-7 select-none cursor-pointer leading-7 text-xs text-center rule-provider-loading"
                            onClick={handleNotityGroupTest}>{t('speedTestText')}</span>
                    </div>
                    {title !== "GLOBAL" && showExtend &&
                        <span className="h-7 select-none cursor-pointer leading-7 text-xs text-center"
                              style={{paddingLeft: '10px'}}
                              onClick={toggleExtend}> {expand ? t('collapseText') : t('expandText')} </span>}
                </div>
            </div>
        </>
    )
}
