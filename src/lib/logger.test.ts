import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import logger, { type LogContext, type LogEntry, type ChildLogger, type ILogger } from './logger'

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logger.error', () => {
    it('calls console.error with formatted output', () => {
      logger.error('Test error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('Test error message')
      expect(output).toContain('[ERROR]')
    })

    it('includes context in the output', () => {
      const context: LogContext = { component: 'TestComponent', action: 'testAction' }
      logger.error('Error with context', context)

      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('component')
      expect(output).toContain('TestComponent')
      expect(output).toContain('action')
      expect(output).toContain('testAction')
    })

    it('includes metadata in the output', () => {
      logger.error('Error with metadata', undefined, { userId: '123' })

      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('userId')
    })

    it('includes stack trace in dev mode', () => {
      logger.error('Error with stack')

      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('Stack trace')
    })
  })

  describe('logger.warn', () => {
    it('calls console.warn with formatted output', () => {
      logger.warn('Test warning message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const output = consoleWarnSpy.mock.calls[0][0] as string
      expect(output).toContain('Test warning message')
      expect(output).toContain('[WARN]')
    })

    it('includes context in the output', () => {
      const context: LogContext = { component: 'TestComponent' }
      logger.warn('Warning with context', context)

      const output = consoleWarnSpy.mock.calls[0][0] as string
      expect(output).toContain('TestComponent')
    })
  })

  describe('logger.info', () => {
    it('calls console.log with formatted output', () => {
      logger.info('Test info message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const output = consoleLogSpy.mock.calls[0][0] as string
      expect(output).toContain('Test info message')
      expect(output).toContain('[INFO]')
    })

    it('includes context in the output', () => {
      const context: LogContext = { component: 'TestComponent' }
      logger.info('Info with context', context)

      const output = consoleLogSpy.mock.calls[0][0] as string
      expect(output).toContain('TestComponent')
    })
  })

  describe('logger.child', () => {
    it('returns a ChildLogger with pre-populated context', () => {
      const context: LogContext = { component: 'ChildComponent' }
      const child = logger.child(context)

      expect(child).toHaveProperty('error')
      expect(child).toHaveProperty('warn')
      expect(child).toHaveProperty('info')
    })

    it('child.error calls logger.error with parent context', () => {
      const child = logger.child({ component: 'ChildComponent' })
      child.error('Child error')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('ChildComponent')
      expect(output).toContain('Child error')
    })

    it('child.warn calls logger.warn with parent context', () => {
      const child = logger.child({ component: 'ChildComponent' })
      child.warn('Child warning')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const output = consoleWarnSpy.mock.calls[0][0] as string
      expect(output).toContain('ChildComponent')
      expect(output).toContain('Child warning')
    })

    it('child.info calls logger.info with parent context', () => {
      const child = logger.child({ component: 'ChildComponent' })
      child.info('Child info')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const output = consoleLogSpy.mock.calls[0][0] as string
      expect(output).toContain('ChildComponent')
      expect(output).toContain('Child info')
    })

    it('child methods pass metadata through', () => {
      const child = logger.child({ component: 'ChildComponent' })
      child.error('Child error', { userId: '456' })

      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain('userId')
    })
  })

  describe('default export', () => {
    it('is the logger instance', () => {
      expect(logger).toBeDefined()
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('child')
    })
  })
})
