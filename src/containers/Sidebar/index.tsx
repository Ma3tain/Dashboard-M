import classnames from 'classnames'
import { NavLink } from 'react-router-dom'

import logo from '@assets/logo.png'
import { Lang, Language } from '@i18n'
import { useI18n, useVersion } from '@stores'
import './style.scss'

interface SidebarProps {
    routes: Array<{
        path: string
        name: string
        noMobile?: boolean
    }>
}

export default function Sidebar (props: SidebarProps) {
    const { routes } = props
    const { translation } = useI18n()
    const { version, meta, premium } = useVersion()
    const { t } = translation('SideBar')

    const navlinks = routes.map(
        ({ path, name, noMobile }) => (
            <li className={classnames('item', { 'no-mobile': noMobile })} key={name}>
                <NavLink to={path} className={({ isActive }) => classnames({ active: isActive })}>
                    { t(name as keyof typeof Language[Lang]['SideBar']) }
                </NavLink>
            </li>
        ),
    )

    return (
        <div className="sidebar">
            <img src={logo} alt="logo" className="sidebar-logo" />
            <ul className="sidebar-menu">
                { navlinks }
            </ul>
            <div className="sidebar-version">
                <span className="sidebar-version-label">Clash { t('Version') }</span>
                <span className="sidebar-version-label"> { meta? 'Meta' +' '+ version.substring(0,6) : premium? 'Premium' +' ' +version: version}</span>
            </div>
        </div>
    )
}
