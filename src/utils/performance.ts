import React from 'react';

// Linus式性能优化工具集

/**
 * 深度比较props，防止不必要的重渲染
 * 只比较实际使用的属性
 */
export function arePropsEqual<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keysToCompare?: (keyof T)[]
): boolean {
  const keys = keysToCompare || (Object.keys(prevProps) as (keyof T)[]);
  
  for (const key of keys) {
    if (!Object.is(prevProps[key], nextProps[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * 创建稳定的事件处理器引用
 * 避免因为闭包导致的重新创建
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = React.useRef(callback);
  
  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });
  
  return React.useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
}

/**
 * 防抖hook - 减少频繁更新
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * 测量组件渲染时间
 */
export function useRenderProfiler(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(0);

  React.useEffect(() => {
    lastRenderTime.current = performance.now();
  });

  React.useLayoutEffect(() => {
    const now = performance.now();
    const duration = now - lastRenderTime.current;
    renderCount.current += 1;
    
    console.log(
      `%c[RenderProfiler] %c${componentName} %crendered %c${renderCount.current} %ctimes. Last render took %c${duration.toFixed(2)}ms`,
      'color: #999;',
      'color: #00f;',
      'color: #999;',
      'color: #f0f;',
      'color: #999;',
      'color: #f00;'
    );
  });
}
