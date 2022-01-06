import {useMemo} from 'react'

import {Card, Checkbox, Header, Icon} from '@components'
import EE from '@lib/event'
import {useRound} from '@lib/hook'
import * as API from '@lib/request'
import {useConfig, useGeneral, useI18n, useProxy, useProxyProviders} from '@stores'

import {Group, Provider, Proxy} from './components'
import './style.scss'

enum sortType {
    None,
    Asc,
    Desc,
}

const sortMap = {
    [sortType.None]: 'sort',
    [sortType.Asc]: 'sort-ascending',
    [sortType.Desc]: 'sort-descending',
}

export function compareDesc (a: API.Proxy, b: API.Proxy) {
    const lastDelayA = (a.history.length > 0) ? a.history.slice(-1)[0].delay : 0
    const lastDelayB = (b.history.length > 0) ? b.history.slice(-1)[0].delay : 0
    return (lastDelayB || Number.MAX_SAFE_INTEGER) - (lastDelayA || Number.MAX_SAFE_INTEGER)
}

export function handleNotitySpeedTest () {
    EE.notifySpeedTest()
}

function ProxyGroups () {
    const { groups,global } = useProxy()
    const { data: config, set: setConfig } = useConfig()
    const { general } = useGeneral()
    const { translation } = useI18n()
    const { t } = translation('Proxies')
    const list = useMemo(
        () => general.mode === 'global' ? [global] : groups,
        [general, groups, global],
    )
    return <>
        {
            list.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('groupTitle')} >
                    <Icon className="speed-icon" type="speed" size={20} onClick={handleNotitySpeedTest}/>
                    <span className="proxies-speed-test text-xs md:text-sm" style={{paddingRight:'10px'}} onClick={handleNotitySpeedTest}>{t('speedTestText')}</span>
                    <Checkbox
                        className="cursor-pointer text-xs md:text-sm text-shadow-primary text-primary-600"
                        checked={config.breakConnections}
                        onChange={value => setConfig('breakConnections', value)}>
                        {t('breakConnectionsText')}
                    </Checkbox>
                </Header>
                <Card className="my-2.5 p-0 md:my-4">
                   <ul className="list-none">
                        {
                            list.map(p => (
                                <li className="proxies-group-item" key={p.name}>
                                    <Group config={p} />
                                </li>
                            ))
                        }
                    </ul>
                </Card>
            </div>
        }
    </>
}

function ProxyProviders () {
    const { providers } = useProxyProviders()
    const { translation: useTranslation } = useI18n()
    const { t } = useTranslation('Proxies')

    return <>
        {
            providers.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('providerTitle')} />
                <ul className="list-none">
                    {
                        providers.map(p => (
                            <li className="my-2.5 md:my-4" key={p.name}>
                                <Provider provider={p} />
                            </li>
                        ))
                    }
                </ul>
            </div>
        }
    </>
}

function Proxies () {
    const { proxies } = useProxy()
    const { translation: useTranslation } = useI18n()
    const { t } = useTranslation('Proxies')

    const { current: sort,next  } = useRound(
        [sortType.None, sortType.Asc, sortType.Desc],
    )
    const sortedProxies = useMemo(() => {
        switch (sort) {
            case sortType.Desc:
                return proxies.slice().sort((a, b) => compareDesc(a, b))
            case sortType.Asc:
                return proxies.slice().sort((a, b) => -1 * compareDesc(a, b))
            default:
                return proxies.slice()
        }
    }, [sort, proxies])
    return <>
        {
            sortedProxies.length !== 0 &&
            <div className="flex flex-col ">
                <Header title={t('title')}>
                    <Icon className="ml-3" type={sortMap[sort]} onClick={next} size={20} />
                    <Icon className="ml-3" type="speed" size={20} />
                    <span className="proxies-speed-test text-xs md:text-sm" onClick={handleNotitySpeedTest}>{t('speedTestText')}</span>
                </Header>
                <Card className="proxy-provider my-2.5 md:my-4">
                    <ul className="proxies-list">
                        {
                            sortedProxies.map(p => (
                                <li key={p.name}>
                                    <Proxy config={p} />
                                </li>
                            ))
                        }
                    </ul>
                </Card>
            </div>
        }
    </>
}

export default function ProxyContainer () {
    return (
        <div className="page">
            <ProxyGroups />
            <ProxyProviders />
            <Proxies />
        </div>
    )
}
