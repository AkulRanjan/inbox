import { useState } from 'react'
import { Icon } from './Icon'
import { useWorkspaceStore } from '../store/workspace'

const TABS = ['Problems', 'Output', 'Debug Console', 'Terminal', 'Ports']

export function BottomPanel(): React.JSX.Element {
  const [active, setActive] = useState('Terminal')
  const { togglePanel, rootPath } = useWorkspaceStore()
  const cwd = rootPath ?? '~'

  return (
    <div className="bottom-panel">
      <div className="bottom-panel__tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`bottom-panel__tab${active === t ? ' bottom-panel__tab--active' : ''}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
        <span className="bottom-panel__spacer" />
        <button title="New Terminal">
          <Icon name="add" />
        </button>
        <button title="Maximize Panel Size">
          <Icon name="chevron-up" />
        </button>
        <button title="Close Panel" onClick={togglePanel}>
          <Icon name="close" />
        </button>
      </div>
      <div className="bottom-panel__body">
        {active === 'Terminal' ? (
          <pre className="terminal">
            {`${cwd}> `}
            <span className="terminal__cursor" />
            {'\n\n'}
            <span className="dim">Integrated terminal (xterm + node-pty) — not wired up yet.</span>
          </pre>
        ) : active === 'Problems' ? (
          <p className="dim pad">No problems have been detected in the workspace.</p>
        ) : (
          <p className="dim pad">Nothing to show in {active}.</p>
        )}
      </div>
    </div>
  )
}
