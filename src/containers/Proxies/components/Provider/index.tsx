import {useLayoutEffect, useMemo, useState} from 'react'

import { Card, Tag, Icon, Loading } from '@components'
import { compareDesc } from '@containers/Proxies'
import { Proxy } from '@containers/Proxies/components/Proxy'
import { fromNow } from '@lib/date'
import { useVisible } from '@lib/hook'
import { Provider as IProvider, Proxy as IProxy } from '@lib/request'
import { useClient, useI18n, useProxyProviders } from '@stores'

import './style.scss'
import EE, {Action} from "@lib/event";

interface ProvidersProps {
    provider: IProvider
}

export function Provider (props: ProvidersProps) {
    const { update } = useProxyProviders()
    const { translation, lang } = useI18n()
    const client = useClient()

    const { provider } = props
    const { t } = translation('Proxies')
    const [expand, setExpand] = useState(false)
    const { visible, hide, show } = useVisible()

    function handleHealthChech () {
        show()
        client.healthCheckProvider(provider.name).then(async () => await update()).finally(() => hide())
    }

    function toggleExtend () {
        setExpand(!expand)
    }

    useLayoutEffect(() => {
        const handler = () => {  client.healthCheckProvider(provider.name).then(async () => await update()).finally(() => hide()) }
        EE.subscribe(Action.Provider_NOTIFY, handler)
        return () => EE.unsubscribe(Action.Provider_NOTIFY, handler)
    }, [])

    function handleUpdate () {
        show()
        client.updateProvider(provider.name).then(async () => await update()).finally(() => hide())
    }

    const proxies = useMemo(() => {
        return (provider.proxies as IProxy[]).slice().sort((a, b) => -1 * compareDesc(a, b))
    }, [provider.proxies])

    return (
        <Card className="proxy-provider">
            <Loading visible={visible} />
            <div className="flex flex-col justify-between md:(flex-row items-center) ">
                <div className="flex items-center">
                    <span className="mr-6">{ provider.name }</span>
                    <Tag>{ provider.vehicleType }</Tag>
                    <Tag className="rule-provider-behavior"> {t('providerCount')}: { proxies.length }</Tag>
                </div>
                <div className="flex pt-3 items-center md:pt-0">
                    {
                        provider.updatedAt &&
                        <span className="text-sm">{ `${t('providerUpdateTime')}: ${fromNow(new Date(provider.updatedAt), lang)}`}</span>
                    }
                    <Icon className="cursor-pointer text-red pl-5" type="healthcheck" size={18} onClick={handleHealthChech} />
                    <Icon className="cursor-pointer pl-5" type="update" size={18} onClick={handleUpdate} />
                    <span className="tag rule-provider-behavior cursor-pointer right-[-20px] md:right-0" onClick={toggleExtend} style={{margin: '0 0 0 20px',position:'relative'}} > {expand ? t('collapseText') : t('expandText')}</span>
                </div>
            </div>
            <ul className="proxies-list" style={{display: expand ? '' : 'none' }}>
                {
                    proxies.map((p: IProxy) => (
                        <li key={p.name}>
                            <Proxy className="proxy-provider-item" config={p} />
                        </li>
                    ))
                }
            </ul>
        </Card>
    )
}
