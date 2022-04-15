import classnames from 'classnames'
import { useUpdateAtom } from 'jotai/utils'
import { capitalize, camelCase } from 'lodash-es'
import { useEffect, useMemo } from 'react'

import { Header, Card, Switch, ButtonSelect, ButtonSelectOptions, Input } from '@components'
import { Lang } from '@i18n'
import { useObject } from '@lib/hook'
import { jsBridge } from '@lib/jsBridge'
import { useI18n, useClashXData, useAPIInfo, useGeneral, useVersion, useClient, identityAtom } from '@stores'
import './style.scss'

const languageOptions: ButtonSelectOptions[] = [{ label: '中文', value: 'zh_CN' }, { label: 'English', value: 'en_US' }]

export default function Settings () {
    const { premium } = useVersion()
    const { data: clashXData, update: fetchClashXData } = useClashXData()
    const { general, update: fetchGeneral } = useGeneral()
    const setIdentity = useUpdateAtom(identityAtom)
    const apiInfo = useAPIInfo()
    const { translation, setLang, lang } = useI18n()
    const { t } = translation('Settings')
    const client = useClient()
    const [info, set] = useObject({
        mixedProxyPort: 0,
        socks5ProxyPort: 7891,
        httpProxyPort: 7890,
        redirProxyPort: 7892,
    })

    useEffect(() => {
        set('socks5ProxyPort', general?.socksPort ?? 0)
        set('httpProxyPort', general?.port ?? 0)
        set('mixedProxyPort', general?.mixedPort ?? 0)
        set('redirProxyPort', general?.redirPort ?? 0)
    }, [general, set])

    async function handleProxyModeChange (mode: string) {
        await client.updateConfig({ mode })
        await fetchGeneral()
    }

    async function handleLogLevelChange (logLevel: string) {
        await client.updateConfig({ 'log-level': logLevel })
        await fetchGeneral()
    }

    async function handleStartAtLoginChange (state: boolean) {
        await jsBridge?.setStartAtLogin(state)
        await fetchClashXData()
    }

    async function handleSetSystemProxy (state: boolean) {
        await jsBridge?.setSystemProxy(state)
        await fetchClashXData()
    }

    function changeLanguage (language: Lang) {
        setLang(language)
    }

    async function handleHttpPortSave () {
        await client.updateConfig({ port: info.httpProxyPort })
        await fetchGeneral()
    }

    async function handleSocksPortSave () {
        await client.updateConfig({ 'socks-port': info.socks5ProxyPort })
        await fetchGeneral()
    }

    async function handleMixedPortSave () {
        await client.updateConfig({ 'mixed-port': info.mixedProxyPort })
        await fetchGeneral()
    }

    async function handleRedirPortSave () {
        await client.updateConfig({ 'redir-port': info.redirProxyPort })
        await fetchGeneral()
    }

    async function handleAllowLanChange (state: boolean) {
        await client.updateConfig({ 'allow-lan': state })
        await fetchGeneral()
    }

    const {
        hostname: externalControllerHost,
        port: externalControllerPort,
    } = apiInfo

    const { allowLan, mode, logLevel } = general

    const startAtLogin = clashXData?.startAtLogin ?? false
    const systemProxy = clashXData?.systemProxy ?? false
    const isClashX = clashXData?.isClashX ?? false

    const proxyModeOptions = useMemo(() => {
        const options = [
            { label: t('values.global'), value: 'Global' },
            { label: t('values.rules'), value: 'Rule' },
            { label: t('values.direct'), value: 'Direct' },
        ] as Array<{ label: string, value: string }>
        if (premium) {
            options.push({ label: t('values.script'), value: 'Script' })
        }
        return options
    }, [t, premium])

    const logLevelOptions = [
        { label: ('debug'), value: 'debug' },
        { label: ('info'), value: 'info' },
        { label: ('warn'), value: 'warning' },
        { label: ('error'), value: 'error' },
        { label: ('silent'), value: 'silent' },
    ]

    return (
        <div className="page">
            <Header title={t('title')} />    
            {
                clashXData?.isClashX && <Card className="settings-card">
                    <div className="flex flex-wrap">
                        <div className="flex w-full py-3 px-8 items-center justify-between md:w-1/2">
                            <span className="font-bold label">{t('labels.startAtLogin')}</span>
                            <Switch checked={startAtLogin} onChange={handleStartAtLoginChange}/>
                        </div>
                        <div className="flex w-full py-3 px-8 items-center justify-between md:w-1/2">
                            <span className="font-bold label">{t('labels.setAsSystemProxy')}</span>
                            <Switch
                                checked={systemProxy} onChange={handleSetSystemProxy}/>
                        </div>
                    </div>
                </Card>
            }
            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between ">
                        <span className="font-bold label">{t('labels.language')}</span>
                        <ButtonSelect options={languageOptions} value={lang} onSelect={(lang) => changeLanguage(lang as Lang)} />
                    </div>
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between ">
                        <span className="font-bold label">{t('labels.allowConnectFromLan')}</span>
                        <Switch checked={allowLan} onChange={handleAllowLanChange} />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between ">
                        <span className="font-bold label">{t('labels.proxyMode')}</span>
                        <ButtonSelect
                            options={proxyModeOptions}
                            value={capitalize(mode)}
                            onSelect={handleProxyModeChange}
                        />
                    </div>
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between  ">
                        <span className="font-bold label">{t('labels.logLevel')}</span>
                        <ButtonSelect
                            options={logLevelOptions}
                            value={camelCase(logLevel)}
                            onSelect={handleLogLevelChange}
                        />
                    </div>
                </div>
            </Card>

            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between md:w-1/2">
                        <span className="font-bold label">{t('labels.mixedProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.mixedProxyPort}
                            onChange={mixedProxyPort => set('mixedProxyPort', +mixedProxyPort)}
                            onBlur={handleMixedPortSave}
                        />
                    </div>
                    <div className="flex  w-full py-3 px-8 items-center justify-between md:w-1/2">
                        <span className="font-bold label">{t('labels.redirProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.redirProxyPort}
                            onChange={redirProxyPort => set('redirProxyPort', +redirProxyPort)}
                            onBlur={handleRedirPortSave}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between md:w-1/2">
                        <span className="font-bold label">{t('labels.socks5ProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.socks5ProxyPort}
                            onChange={socks5ProxyPort => set('socks5ProxyPort', +socks5ProxyPort)}
                            onBlur={handleSocksPortSave}
                        />
                    </div>
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between md:w-1/2">
                        <span className="font-bold label">{t('labels.httpProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.httpProxyPort}
                            onChange={httpProxyPort => set('httpProxyPort', +httpProxyPort)}
                            onBlur={handleHttpPortSave}
                        />
                    </div>
                    <div className="flex flex-wrap w-full py-3 px-8 items-center justify-between md:w-1/2">
                        <span className="font-bold label">{t('labels.externalController')}</span>
                        <span
                            className={classnames('external-controller')}
                            onClick={() => setIdentity(false)}>
                            {`${externalControllerHost}:${externalControllerPort}`}
                        </span>
                    </div>
                </div>
            </Card>
            {/* <Card className="clash-version hidden">
                <span className="check-icon">
                    <Icon type="check" size={20} />
                </span>
                <p className="version-info">{t('versionString')}</p>
                <span className="check-update-btn">{t('checkUpdate')}</span>
            </Card> */}
        </div>
    )
}
