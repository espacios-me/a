import React, { useState, ReactNode } from 'react'

interface TabsProps {
  defaultValue?: string
  children: ReactNode
  className?: string
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

const TabsContext = React.createContext<{
  activeTab: string
  setActiveTab: (value: string) => void
}>({ activeTab: '', setActiveTab: () => {} })

export const Tabs: React.FC<TabsProps> = ({ defaultValue = '', children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex gap-1 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black ${className}`}>
      {children}
    </div>
  )
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-3 font-semibold text-sm transition-smooth relative ${
        isActive
          ? 'text-black dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      } ${className}`}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
      )}
    </button>
  )
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { activeTab } = React.useContext(TabsContext)

  if (activeTab !== value) return null

  return <div className={`animate-fade-in ${className}`}>{children}</div>
}
