// User behavior analytics client
// This module provides comprehensive user behavior tracking

interface SessionData {
  sessionId: string
  userAgent: string
  ipAddress?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  deviceType: string
  browser: string
  os: string
  screenResolution: string
  language: string
  timezone: string
  [key: string]: unknown
}

interface PageViewData {
  sessionId: string
  pageUrl: string
  pageTitle?: string
  pagePath: string
  referrer?: string
  viewportWidth?: number
  viewportHeight?: number
  scrollDepth?: number
  timeOnPage?: number
  [key: string]: unknown
}

interface InteractionData {
  sessionId: string
  interactionType: 'click' | 'hover' | 'scroll' | 'focus' | 'blur' | 'submit' | 'change'
  elementType?: string
  elementId?: string
  elementClass?: string
  elementText?: string
  elementHref?: string
  pageUrl: string
  xPosition?: number
  yPosition?: number
  [key: string]: unknown
}

interface SearchData {
  sessionId: string
  searchQuery: string
  searchType?: 'product' | 'brand' | 'general'
  filtersApplied?: Record<string, unknown>
  resultsCount?: number
  clickedResultId?: string
  clickedResultType?: 'product' | 'brand'
  searchDuration?: number
  [key: string]: unknown
}

interface ProductInteractionData {
  sessionId: string
  productId: string
  brandId?: string
  interactionType: 'view' | 'click' | 'favorite' | 'add_to_cart' | 'purchase'
  productName?: string
  productPrice?: number
  productCategory?: string
  productType?: string
  positionInList?: number
  timeOnProduct?: number
  [key: string]: unknown
}

interface NavigationData {
  sessionId: string
  fromPage?: string
  toPage: string
  navigationType?: 'direct' | 'back' | 'forward' | 'link_click' | 'form_submit'
  navigationMethod?: 'click' | 'keyboard' | 'programmatic'
  timeBetweenPages?: number
  [key: string]: unknown
}

interface ErrorData {
  sessionId: string
  errorType: 'javascript' | 'api' | 'network' | 'validation'
  errorMessage: string
  errorStack?: string
  pageUrl: string
  userAgent?: string
  browserInfo?: Record<string, unknown>
  [key: string]: unknown
}

interface PerformanceData {
  sessionId: string
  pageUrl: string
  loadTime?: number
  domContentLoaded?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  networkInfo?: Record<string, unknown>
  [key: string]: unknown
}

class AnalyticsClient {
  private sessionId: string
  private sessionStartTime: number
  private pageStartTime: number
  private currentPage: string
  private scrollDepth: number = 0
  private maxScrollDepth: number = 0
  private isInitialized: boolean = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = Date.now()
    this.pageStartTime = Date.now()
    this.currentPage = typeof window !== 'undefined' ? window.location.href : ''
    this.isInitialized = false
  }

  private generateSessionId(): string {
    // Generate a unique session ID
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    return `session_${timestamp}_${randomStr}`
  }

  private getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        screenResolution: 'unknown',
        language: 'unknown',
        timezone: 'unknown'
      }
    }

    const userAgent = navigator.userAgent
    const screen = window.screen
    
    // Detect device type
    let deviceType = 'desktop'
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile'
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet'
    }

    // Detect browser
    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    // Detect OS
    let os = 'unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return {
      deviceType,
      browser,
      os,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  private getUTMParameters(): Record<string, string> {
    if (typeof window === 'undefined') {
      return {}
    }

    const urlParams = new URLSearchParams(window.location.search)
    const result: Record<string, string> = {}
    
    const utmSource = urlParams.get('utm_source')
    if (utmSource) result.utmSource = utmSource
    
    const utmMedium = urlParams.get('utm_medium')
    if (utmMedium) result.utmMedium = utmMedium
    
    const utmCampaign = urlParams.get('utm_campaign')
    if (utmCampaign) result.utmCampaign = utmCampaign
    
    const utmTerm = urlParams.get('utm_term')
    if (utmTerm) result.utmTerm = utmTerm
    
    const utmContent = urlParams.get('utm_content')
    if (utmContent) result.utmContent = utmContent
    
    return result
  }

  private async sendLog(endpoint: string, data: Record<string, unknown>): Promise<void> {
    try {
      const response = await fetch(`/api/logs/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        console.warn(`Failed to send log to ${endpoint}:`, response.statusText)
      }
    } catch (error) {
      console.warn(`Error sending log to ${endpoint}:`, error)
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const deviceInfo = this.getDeviceInfo()
      const utmParams = this.getUTMParameters()

      const sessionData: SessionData = {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        ...utmParams,
        ...deviceInfo
      }

      await this.sendLog('session', sessionData)
      this.trackPageView()
      this.setupEventListeners()
      this.setupPerformanceTracking()
      this.setupErrorTracking()
      this.setupScrollTracking()

      this.isInitialized = true
      console.log('Analytics initialized successfully')
    } catch (error) {
      console.error('Analytics initialization failed:', error)
      // エラーが発生しても基本的な追跡は継続
      this.setupEventListeners()
      this.setupErrorTracking()
    }
  }

  private trackPageView(): void {
    if (typeof window === 'undefined') return

    const pageViewData: PageViewData = {
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      pageTitle: document.title,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollDepth: this.maxScrollDepth,
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000)
    }

    this.sendLog('page-view', pageViewData)
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const interactionData: InteractionData = {
        sessionId: this.sessionId,
        interactionType: 'click',
        elementType: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        elementText: target.textContent?.trim().substring(0, 100) || undefined,
        elementHref: (target as HTMLAnchorElement).href || undefined,
        pageUrl: window.location.href,
        xPosition: event.clientX,
        yPosition: event.clientY
      }

      this.sendLog('interaction', interactionData)
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement
      const interactionData: InteractionData = {
        sessionId: this.sessionId,
        interactionType: 'submit',
        elementType: 'form',
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        pageUrl: window.location.href
      }

      this.sendLog('interaction', interactionData)
    })

    // Track navigation
    window.addEventListener('beforeunload', () => {
      const navigationData: NavigationData = {
        sessionId: this.sessionId,
        fromPage: this.currentPage,
        toPage: window.location.href,
        navigationType: 'direct',
        timeBetweenPages: Math.floor((Date.now() - this.pageStartTime) / 1000)
      }

      this.sendLog('navigation', navigationData)
    })

    // Track popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      const navigationData: NavigationData = {
        sessionId: this.sessionId,
        fromPage: this.currentPage,
        toPage: window.location.href,
        navigationType: 'back',
        timeBetweenPages: Math.floor((Date.now() - this.pageStartTime) / 1000)
      }

      this.currentPage = window.location.href
      this.pageStartTime = Date.now()
      this.sendLog('navigation', navigationData)
    })
  }

  private setupPerformanceTracking(): void {
    if (typeof window === 'undefined') return

    // Track performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const performanceData: PerformanceData = {
          sessionId: this.sessionId,
          pageUrl: window.location.href,
          loadTime: Math.round(performance.now()),
          domContentLoaded: Math.round((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.domContentLoadedEventEnd || 0)
        }

        // Get Core Web Vitals if available
        if ('web-vital' in window) {
          // This would require the web-vitals library
          // For now, we'll track basic metrics
        }

        this.sendLog('performance', performanceData)
      }, 1000)
    })
  }

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      const errorData: ErrorData = {
        sessionId: this.sessionId,
        errorType: 'javascript',
        errorMessage: event.message,
        errorStack: event.error?.stack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        }
      }

      this.sendLog('error', errorData)
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorData: ErrorData = {
        sessionId: this.sessionId,
        errorType: 'javascript',
        errorMessage: event.reason?.toString() || 'Unhandled promise rejection',
        errorStack: event.reason?.stack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      }

      this.sendLog('error', errorData)
    })
  }

  private setupScrollTracking(): void {
    if (typeof window === 'undefined') return

    let scrollTimeout: NodeJS.Timeout

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      this.scrollDepth = Math.round((scrollTop / documentHeight) * 100)
      this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth)

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const interactionData: InteractionData = {
          sessionId: this.sessionId,
          interactionType: 'scroll',
          pageUrl: window.location.href,
          yPosition: scrollTop
        }

        this.sendLog('interaction', interactionData)
      }, 1000)
    })
  }

  // Public methods for manual tracking
  trackSearch(searchQuery: string, searchType?: 'product' | 'brand' | 'general', filtersApplied?: Record<string, unknown>, resultsCount?: number): void {
    const searchData: SearchData = {
      sessionId: this.sessionId,
      searchQuery,
      searchType,
      filtersApplied,
      resultsCount
    }

    this.sendLog('search', searchData)
  }

  trackProductInteraction(
    productId: string,
    interactionType: 'view' | 'click' | 'favorite' | 'add_to_cart' | 'purchase',
    productData?: {
      brandId?: string
      productName?: string
      productPrice?: number
      productCategory?: string
      productType?: string
      positionInList?: number
      timeOnProduct?: number
    }
  ): void {
    const productInteractionData: ProductInteractionData = {
      sessionId: this.sessionId,
      productId,
      interactionType,
      ...productData
    }

    this.sendLog('product', productInteractionData)
  }

  trackSearchResultClick(resultId: string, resultType: 'product' | 'brand', searchQuery: string, searchDuration?: number): void {
    const searchData: SearchData = {
      sessionId: this.sessionId,
      searchQuery,
      clickedResultId: resultId,
      clickedResultType: resultType,
      searchDuration
    }

    this.sendLog('search', searchData)
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId
  }

  // Track page navigation
  trackPageNavigation(toPage: string, navigationType?: 'direct' | 'back' | 'forward' | 'link_click' | 'form_submit'): void {
    const navigationData: NavigationData = {
      sessionId: this.sessionId,
      fromPage: this.currentPage,
      toPage,
      navigationType,
      timeBetweenPages: Math.floor((Date.now() - this.pageStartTime) / 1000)
    }

    this.currentPage = toPage
    this.pageStartTime = Date.now()
    this.sendLog('navigation', navigationData)
  }
}

// Create a singleton instance
const analytics = new AnalyticsClient()

export default analytics
export { AnalyticsClient }
export type {
  SessionData,
  PageViewData,
  InteractionData,
  SearchData,
  ProductInteractionData,
  NavigationData,
  ErrorData,
  PerformanceData
}
