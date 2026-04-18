import { Platform } from 'react-native';

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercentage: number;
}

export interface MemoryConfig {
  maxCacheSize: number;
  cleanupInterval: number;
  warningThreshold: number;
  criticalThreshold: number;
}

class MemoryManager {
  private static instance: MemoryManager;
  private config: MemoryConfig;
  private cache: Map<string, any> = new Map();
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private listeners: Array<(stats: MemoryStats) => void> = [];

  private constructor() {
    this.config = {
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      cleanupInterval: 60000, // 1 minute
      warningThreshold: 70, // 70%
      criticalThreshold: 85, // 85%
    };

    this.startMemoryMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
      this.checkMemoryUsage();
    }, this.config.cleanupInterval);
  }

  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(stats));

    // Handle critical memory usage
    if (stats.memoryUsagePercentage >= this.config.criticalThreshold) {
      console.warn('Critical memory usage detected:', stats);
      this.performAggressiveCleanup();
    } else if (stats.memoryUsagePercentage >= this.config.warningThreshold) {
      console.warn('High memory usage detected:', stats);
      this.performCleanup();
    }
  }

  getMemoryStats(): MemoryStats {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }

    // Fallback for mobile platforms
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUsagePercentage: 0,
    };
  }

  // Cache management
  setCache(key: string, value: any, maxSize?: number): void {
    const size = this.calculateSize(value);
    const maxItemSize = maxSize || this.config.maxCacheSize;

    if (size > maxItemSize) {
      console.warn('Item too large for cache:', key);
      return;
    }

    // Check if we need to make space
    if (this.getCacheSize() + size > this.config.maxCacheSize) {
      this.evictLRU(size);
    }

    this.cache.set(key, {
      value,
      size,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  getCache(key: string): any {
    const item = this.cache.get(key);
    if (item) {
      item.accessCount++;
      item.timestamp = Date.now();
      return item.value;
    }
    return null;
  }

  removeCache(key: string): boolean {
    return this.cache.delete(key);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCacheSize(): number {
    let size = 0;
    for (const item of this.cache.values()) {
      size += item.size;
    }
    return size;
  }

  private calculateSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimation (2 bytes per char)
    } catch {
      return 1024; // Default 1KB
    }
  }

  private evictLRU(requiredSpace: number): void {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // Sort by access frequency and recency
        const scoreA = a.accessCount / (Date.now() - a.timestamp);
        const scoreB = b.accessCount / (Date.now() - b.timestamp);
        return scoreA - scoreB;
      });

    let freedSpace = 0;
    for (const item of items) {
      this.cache.delete(item.key);
      freedSpace += item.size;
      if (freedSpace >= requiredSpace) {
        break;
      }
    }
  }

  // Cleanup operations
  private performCleanup(): void {
    // Remove old cache items (older than 30 minutes)
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < cutoff) {
        this.cache.delete(key);
      }
    }

    // Force garbage collection if available
    if (Platform.OS === 'web' && 'gc' in window) {
      (window as any).gc();
    }
  }

  private performAggressiveCleanup(): void {
    // Clear most of the cache
    const items = Array.from(this.cache.entries());
    const keepCount = Math.floor(items.length * 0.1); // Keep only 10%
    
    items.sort((a, b) => {
      const [, itemA] = a;
      const [, itemB] = b;
      return itemB.accessCount - itemA.accessCount;
    });

    this.cache.clear();
    for (let i = 0; i < keepCount; i++) {
      this.cache.set(items[i][0], items[i][1]);
    }

    // Force garbage collection
    if (Platform.OS === 'web' && 'gc' in window) {
      (window as any).gc();
    }
  }

  // Event listeners
  addMemoryListener(listener: (stats: MemoryStats) => void): void {
    this.listeners.push(listener);
  }

  removeMemoryListener(listener: (stats: MemoryStats) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  // Cleanup on unmount
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
    this.listeners = [];
  }
}

// Image optimization utilities
export class ImageOptimizer {
  private static imageCache: Map<string, string> = new Map();
  private static maxCacheSize = 100; // Max 100 images

  static async optimizeImage(uri: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<string> {
    const cacheKey = `${uri}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      const cachedUri = this.imageCache.get(cacheKey);
      if (cachedUri) {
        return cachedUri;
      }
    }

    try {
      // For web, we can use canvas to resize images
      if (Platform.OS === 'web') {
        return await this.optimizeImageWeb(uri, options);
      }

      // For mobile, return original URI (expo-image handles optimization)
      return uri;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return uri;
    }
  }

  private static async optimizeImageWeb(uri: string, options: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const { width = img.width, height = img.height, quality = 0.8 } = options;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedUri = URL.createObjectURL(blob);
              this.addToCache(`${uri}-${JSON.stringify(options)}`, optimizedUri);
              resolve(optimizedUri);
            } else {
              reject(new Error('Could not create blob'));
            }
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = uri;
    });
  }

  private static addToCache(key: string, uri: string): void {
    if (this.imageCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
      }
    }
    this.imageCache.set(key, uri);
  }

  static clearCache(): void {
    this.imageCache.clear();
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  private static loadedModules: Set<string> = new Set();

  static async loadModule(moduleName: string): Promise<any> {
    if (this.loadedModules.has(moduleName)) {
      return;
    }

    try {
      // Dynamic import for code splitting
      const module = await import(moduleName);
      this.loadedModules.add(moduleName);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  static preloadModules(moduleNames: string[]): Promise<void[]> {
    return Promise.all(
      moduleNames.map(name => this.loadModule(name).catch(() => null))
    );
  }

  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  static getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  static getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instances
export const memoryManager = MemoryManager.getInstance();
export const imageOptimizer = ImageOptimizer;
export const bundleOptimizer = BundleOptimizer;
export const performanceMonitor = PerformanceMonitor;
