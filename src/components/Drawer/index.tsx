import classnames from 'classnames'
import { useLayoutEffect, useRef, RefObject } from 'react'
import { createPortal } from 'react-dom'

import { Card } from '@components'
import { BaseComponentProps } from '@models/BaseProps'
import './style.scss'

interface DrawerProps extends BaseComponentProps {
    visible?: boolean
    width?: number
    containerRef?: RefObject<HTMLElement>
}

export function Drawer (props: DrawerProps) {
    const portalRef = useRef<HTMLElement>(document.createElement('div'))

    useLayoutEffect(() => {
        const current = portalRef.current
        document.body.appendChild(current)
        return () => { document.body.removeChild(current) }
    }, [])

    const cardStyle = 'absolute h-full right-0 transition-transform transform translate-x-full duration-100 pointer-events-auto'

    const container = (
        <div className={classnames(props.className, 'absolute inset-0 pointer-events-none z-9999')}>
            <Card className={classnames(cardStyle, { 'translate-x-[-2em]': props.visible },'drawer')} style={{ width: props.width ?? 450, height: 'auto', marginTop: '4em', background: '#16222a' }}>{props.children}</Card>
        </div>
    )

    return createPortal(container, props.containerRef?.current ?? portalRef.current)
}
